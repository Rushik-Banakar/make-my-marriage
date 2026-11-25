import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { ObjectId, type ClientSession, type Db } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { findWeddingAdmin } from "@/lib/permissions/wedding-access";
import { readAuthEnvironment } from "@/lib/auth/config";
import { sendAuthEmail } from "@/lib/auth/verification-email";
import { emailSchema } from "@/lib/auth/credentials";
import { TestSenderRestriction } from "@/lib/auth/email-delivery-error";

const testSenderMessage = "Invitation email is in test mode. The site owner must verify a sending domain to invite other email addresses.";
const deliveryFailureMessage = "The email service could not send this invitation. Please try again later.";

type Actor = { id: string; name: string; email: string; emailVerified: boolean };
export class InviteError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const unavailable = () => new InviteError(404, "This invitation is unavailable. Ask your partner for a new invitation.");
const missing = () => new InviteError(404, "Wedding not found.");
const active = { deletedAt: { $exists: false } };
function id(value: string) {
  if (!/^[a-f0-9]{24}$/i.test(value)) throw missing();
  return new ObjectId(value);
}
function digest(token: string) {
  const config = readAuthEnvironment();
  if (!config) throw new Error("Missing invitation configuration");
  return createHmac("sha256", config.BETTER_AUTH_SECRET).update(token).digest("hex");
}
async function transaction<T>(fn: (db: Db, session: ClientSession) => Promise<T>) {
  const db = await getDatabase();
  return db.client.withSession(session => session.withTransaction(() => fn(db, session)));
}

async function reserveSendAllowance(db: Db, session: ClientSession, actorId: string, recipient: string, now: Date) {
  const hour = Math.floor(now.getTime() / 3600000);
  const expiresAt = new Date((hour + 1) * 3600000);
  const counters = db.collection<{ _id: string; count: number; expiresAt: Date }>("partnerInviteSendLimits");
  for (const [scope, identity, limit] of [["account", actorId, 10], ["recipient", recipient, 5]] as const) {
    const key = digest("partner-invite:" + scope + ":" + hour + ":" + identity);
    const counter = await counters.findOneAndUpdate({ _id: key }, {
      $inc: { count: 1 }, $setOnInsert: { expiresAt },
    }, { upsert: true, returnDocument: "after", session });
    if (!counter || counter.count > limit) throw new InviteError(429, "Invitation send limit reached. Try again later.");
  }
}

async function auditRevocation(db: Db, session: ClientSession, weddingId: ObjectId, inviteId: ObjectId, actorId: string, now: Date) {
  await db.collection("auditEvents").insertOne({
    weddingId, actorAuthUserId: actorId, action: "memberInvite.revoked",
    entityType: "memberInvites", entityId: inviteId.toHexString(),
    occurredAt: now, createdAt: now, outcome: "success",
  }, { session });
}

export async function partnerPanel(wedding: string, actor: string) {
  const weddingId = id(wedding);
  return transaction(async (db, session) => {
    if (!await findWeddingAdmin(db, weddingId, actor, session) ||
        !await db.collection("weddings").findOne({ _id: weddingId, ...active }, { session })) throw missing();
    const owners = await db.collection("weddingMembers").countDocuments({ weddingId, status: "active", role: "admin" }, { session });
    const invitation = await db.collection("memberInvites").findOne({ weddingId, role: "admin", status: "pending", expiresAt: { $gt: new Date() } }, { session });
    return { joined: owners >= 2, invitation: invitation ? {
      id: invitation._id.toString(), email: String(invitation.invitedEmailNormalized),
      sent: (invitation.createdAt as Date).toISOString(), failed: invitation.delivery === "failed",
      failureMessage: invitation.deliveryFailure === "test_sender" ? testSenderMessage : deliveryFailureMessage,
    } : null };
  });
}

export async function sendPartnerInvite(wedding: string, actor: Actor, address: string, replaceId?: string) {
  const email = emailSchema.parse(address).toLowerCase();
  if (!actor.emailVerified || email === actor.email.toLowerCase()) throw new InviteError(422, "Enter your partner’s email instead of your own verified email.");
  const weddingId = id(wedding);
  const token = randomBytes(32).toString("hex");
  const tokenHash = digest(token);
  const inviteId = new ObjectId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 86400000);
  await transaction(async (db, session) => {
    const admin = await findWeddingAdmin(db, weddingId, actor.id, session);
    if (!admin) throw missing();
    // Serialize concurrent invitations, enrollment and deletion against the same wedding.
    const record = await db.collection("weddings").findOneAndUpdate({ _id: weddingId, ...active }, { $inc: { partnerInviteVersion: 1 } }, { session });
    if (!record) throw missing();
    if (await db.collection("weddingMembers").countDocuments({ weddingId, role: "admin", status: "active" }, { session }) !== 1)
      throw new InviteError(409, "Both co-owner seats are already filled.");
    const invites = db.collection("memberInvites");
    const filter = { weddingId, role: "admin", status: "pending" };
    await invites.updateMany({ ...filter, expiresAt: { $lte: now } }, { $set: { status: "expired" } }, { session });
    const pending = await invites.findOne(filter, { session });
    if (pending && pending._id.toString() !== replaceId || !pending && replaceId)
      throw new InviteError(409, "The invitation has changed. Refresh this page.");
    if (record.lastPartnerInviteAt && now.getTime() - new Date(record.lastPartnerInviteAt).getTime() < 60000)
      throw new InviteError(429, "Please wait one minute before sending another invitation.");
    await reserveSendAllowance(db, session, actor.id, email, now);
    if (pending) {
      await invites.updateOne({ _id: pending._id }, { $set: { status: "revoked" } }, { session });
      await auditRevocation(db, session, weddingId, pending._id, actor.id, now);
    }
    await invites.insertOne({ _id: inviteId, weddingId, role: "admin", ownerSeat: admin.ownerSeat === "bride" ? "groom" : "bride",
      invitedEmailNormalized: email, tokenHash, invitedByAuthUserId: actor.id, inviterName: actor.name,
      status: "pending", createdAt: now, expiresAt }, { session });
    await db.collection("weddings").updateOne({ _id: weddingId }, { $set: { lastPartnerInviteAt: now } }, { session });
  });
  const link = new URL("/partner-invitation", readAuthEnvironment()!.BETTER_AUTH_URL);
  link.hash = token;
  try {
    await sendAuthEmail(email, "Your partner invited you to plan your wedding", actor.name + " invited you to share equal Admin access. Open this link within seven days and sign in with this email to accept.\n\n" + link.href);
  } catch (error) {
    const db = await getDatabase();
    const restricted = error instanceof TestSenderRestriction;
    await db.collection("memberInvites").updateOne({ _id: inviteId, status: "pending" },
      { $set: { delivery: "failed", deliveryFailure: restricted ? "test_sender" : "unavailable" } });
    throw new InviteError(503, restricted ? testSenderMessage : deliveryFailureMessage);
  }
  return { inviteId: inviteId.toString(), status: "pending", expiresAt };
}

export async function cancelPartnerInvite(wedding: string, actor: string, invitation: string) {
  const weddingId = id(wedding);
  const inviteId = id(invitation);
  await transaction(async (db, session) => {
    if (!await findWeddingAdmin(db, weddingId, actor, session) ||
        !await db.collection("weddings").findOne({ _id: weddingId, ...active }, { session })) throw missing();
    const result = await db.collection("memberInvites").updateOne({ _id: inviteId, weddingId, role: "admin", status: "pending" },
      { $set: { status: "revoked" } }, { session });
    if (!result.modifiedCount) throw unavailable();
    await auditRevocation(db, session, weddingId, inviteId, actor, new Date());
  });
  return { status: "revoked" };
}

export async function recipientInvite(token: string, actor: Actor, accept: boolean) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw unavailable();
  return transaction(async (db, session) => {
    const invite = await db.collection("memberInvites").findOne({ tokenHash: digest(token), role: "admin",
      status: "pending", expiresAt: { $gt: new Date() } }, { session });
    if (!invite) throw unavailable();
    if (!actor.emailVerified || actor.email.toLowerCase() !== invite.invitedEmailNormalized)
      throw new InviteError(403, "Sign in with the verified email address that received this invitation.");
    const weddingId = invite.weddingId as ObjectId;
    const wedding = await db.collection("weddings").findOne({ _id: weddingId, ...active }, { session });
    if (!wedding || !await findWeddingAdmin(db, weddingId, invite.invitedByAuthUserId, session)) throw unavailable();
    if (accept) {
      const members = db.collection("weddingMembers");
      if (await members.findOne({ weddingId, $or: [{ authUserId: actor.id }, { ownerSeat: invite.ownerSeat, status: "active", role: "admin" }] }, { session }))
        throw new InviteError(409, "The account or co-owner seat is already assigned.");
      const now = new Date();
      await db.collection("weddings").updateOne({ _id: weddingId, ...active }, { $inc: { partnerInviteVersion: 1 }, $set: { updatedAt: now } }, { session });
      await members.insertOne({ weddingId, authUserId: actor.id, role: "admin", ownerSeat: invite.ownerSeat, status: "active",
        joinedAt: now, createdAt: now, updatedAt: now }, { session });
      await db.collection("memberInvites").updateOne({ _id: invite._id }, { $set: { status: "accepted", acceptedAt: now, acceptedByAuthUserId: actor.id } }, { session });
      await db.collection("auditEvents").insertOne({ weddingId, actorAuthUserId: actor.id, action: "memberInvite.accepted",
        entityType: "memberInvites", entityId: invite._id.toString(), occurredAt: now, createdAt: now, outcome: "success" }, { session });
    }
    return { weddingId: weddingId.toString(), weddingTitle: String(wedding.title || wedding.brideName + " & " + wedding.groomName),
      weddingDetails: new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: wedding.timezone }).format(wedding.startAt)
        + (wedding.location ? " · " + wedding.location : ""), inviterName: String(invite.inviterName), recipientEmail: actor.email };
  });
}
