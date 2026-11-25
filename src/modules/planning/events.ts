import "server-only";
import { ObjectId, type WithId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { findActiveWeddingMember, findWeddingAdmin } from "@/lib/permissions/wedding-access";
import { eventSchema, eventPatch, type Ceremony } from "@/modules/planning/events-schema";

export class EventError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const missing = () => new EventError(404, "Wedding or ceremony unavailable.");
function objectId(value: string) {
  if (!ObjectId.isValid(value)) throw missing();
  return new ObjectId(value);
}
type Stored = Omit<Ceremony, "id" | "startAt" | "endAt"> & { weddingId: ObjectId; startAt: Date; endAt: Date };
function present({ _id, weddingId: _weddingId, startAt, endAt, ...fields }: WithId<Stored>): Ceremony {
  void _weddingId;
  return { ...fields, id: _id.toHexString(), startAt: startAt.toISOString(), endAt: endAt.toISOString() };
}
export async function readEvents(wid: string, actor: string, options: { scheduled?: boolean; eventId?: string } = {}) {
  const weddingId = objectId(wid);
  if ((await findActiveWeddingMember(weddingId, actor))?.role !== "admin") throw missing();
  const db = await getDatabase();
  const records = await db.collection<Stored>("events").find({ weddingId,
    ...(options.eventId ? { _id: objectId(options.eventId) } : {}), ...(options.scheduled ? { status: "scheduled" as const } : {}),
  }).sort({ startAt: 1, _id: 1 }).toArray();
  if (options.eventId && !records.length) throw missing();
  return records.map(present);
}
export async function saveEvent(wid: string, actor: string, input: unknown, eid?: string) {
  const weddingId = objectId(wid);
  const db = await getDatabase();
  const events = db.collection<Stored>("events");
  const _id = eid ? objectId(eid) : new ObjectId();
  return db.client.withSession(session => session.withTransaction(async () => {
    if (!await findWeddingAdmin(db, weddingId, actor, session)) throw missing();
    // Coordinate event writes with wedding deletion and restoration.
    const wedding = await db.collection("weddings").updateOne({ _id: weddingId, deletedAt: { $exists: false } },
      { $inc: { eventRevision: 1 } }, { session });
    if (!wedding.matchedCount) throw missing();
    let values, version = 1;
    if (eid) {
      const existing = await events.findOne({ _id, weddingId }, { session });
      if (!existing) throw missing();
      const { expectedVersion, ...patch } = eventPatch.parse(input);
      if (expectedVersion !== undefined && expectedVersion !== existing.version)
        throw new EventError(409, "Your partner updated this ceremony. Refresh before saving.");
      const { id: eventId, version: previousVersion, ...previous } = present(existing);
      void eventId;
      void previousVersion;
      // Partial Zod schemas can apply field defaults to omitted keys.
      const changes = Object.fromEntries(Object.entries(patch).filter(([key]) => Object.hasOwn(input as object, key)));
      values = eventSchema.parse({ ...previous, ...changes });
      version = existing.version + 1;
    } else values = eventSchema.parse(input);
    const record = { ...values, _id, weddingId, startAt: new Date(values.startAt), endAt: new Date(values.endAt), version };
    if (eid) await events.replaceOne({ _id, weddingId }, record, { session });
    else await events.insertOne(record, { session });
    return present(record);
  }));
}
