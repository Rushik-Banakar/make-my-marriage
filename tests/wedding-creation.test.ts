import { beforeEach, describe, expect, it, vi } from "vitest";
import { MongoServerError, ObjectId } from "mongodb";
import { createWeddingSchema, suggestWeddingSlug, weddingDateToInstant } from "@/modules/weddings/schema";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: vi.fn() }));
const dependencies = vi.hoisted(() => ({
  session: vi.fn(), insert: vi.fn(), member: vi.fn(), wedding: vi.fn(), list: vi.fn(),
}));
vi.mock("@/lib/auth/server", () => ({ getSession: dependencies.session }));
vi.mock("@/lib/auth/config", () => ({ readAuthEnvironment: () => ({ BETTER_AUTH_URL: "http://localhost:3000" }) }));
vi.mock("@/modules/weddings/create-repository", () => ({ insertWeddingWithOwner: dependencies.insert }));
vi.mock("@/lib/permissions/wedding-access", () => ({ findActiveWeddingMember: dependencies.member }));
vi.mock("@/modules/weddings/repository", () => ({ findWeddingById: dependencies.wedding, findMembershipWeddings: dependencies.list }));

import { POST } from "@/app/api/v1/weddings/route";
import { GET } from "@/app/api/v1/weddings/[weddingId]/route";
import { getMyWedding } from "@/modules/weddings/service";

const input = { brideName: "Ananya", groomName: "Arjun", slug: "ananya-arjun-test",
  startAt: "2027-02-14T06:30:00.000Z", timezone: "Asia/Kolkata", initialOwnerSeat: "bride" };
const id = new ObjectId().toHexString();
function request(body: unknown = input, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/v1/weddings", {
    method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body),
  });
}
beforeEach(() => {
  dependencies.session.mockResolvedValue({ user: { id: "current-account" } });
  dependencies.insert.mockResolvedValue({ id, slug: input.slug, status: "draft", myRole: "admin", ownerSeat: "bride" });
  dependencies.member.mockResolvedValue(null);
  dependencies.wedding.mockResolvedValue(null);
});

describe("wedding input and date interpretation", () => {
  it("normalizes names and slugs and rejects injected ownership and invalid dates", () => {
    expect(createWeddingSchema.parse({ ...input, brideName: "  नमस्ते  ", slug: "  MY-WEDDING  " }))
      .toMatchObject({ brideName: "नमस्ते", slug: "my-wedding" });
    for (const change of [
      { brideName: " " }, { groomName: "x".repeat(101) }, { timezone: "Fake/Zone" },
      { slug: "a/b" }, { slug: "a--b" }, { startAt: "2027-02-30T12:00:00.000Z" },
      { initialOwnerSeat: "manager" }, { authUserId: "other-account" }, { role: "admin" },
    ]) expect(createWeddingSchema.safeParse({ ...input, ...change }).success).toBe(false);
    expect(suggestWeddingSlug("Élodie", "Arjun")).toBe("elodie-arjun");
    expect(suggestWeddingSlug("a".repeat(59), "Arjun")).toBe("a".repeat(59));
    expect(createWeddingSchema.safeParse({ ...input, slug: "a".repeat(60) }).success).toBe(true);
    expect(createWeddingSchema.safeParse({ ...input, slug: "a".repeat(61) }).success).toBe(false);
  });
  it("keeps the wedding date in its chosen timezone, including daylight saving", () => {
    expect(weddingDateToInstant("2027-02-14", "Asia/Kolkata")).toBe("2027-02-14T06:30:00.000Z");
    expect(weddingDateToInstant("2027-02-14", " Asia/Kolkata ")).toBe("2027-02-14T06:30:00.000Z");
    expect(weddingDateToInstant("2027-03-14", "America/New_York")).toBe("2027-03-14T16:00:00.000Z");
    expect(weddingDateToInstant("2027-11-07", "America/New_York")).toBe("2027-11-07T17:00:00.000Z");
    expect(weddingDateToInstant("2027-02-30", "Asia/Kolkata")).toBeNull();
    expect(weddingDateToInstant("2011-12-30", "Pacific/Apia")).toBeNull();
  });
  it("accepts optional celebration details and bounds customer-entered text", () => {
    expect(createWeddingSchema.parse({ ...input, location: " Jaipur ", title: " Our wedding ", description: " A celebration\nwith family " }))
      .toMatchObject({ location: "Jaipur", title: "Our wedding", description: "A celebration\nwith family" });
    for (const change of [{ location: "x".repeat(201) }, { title: "x".repeat(161) },
      { description: "x".repeat(2001) }, { hashtag: "#RemovedField" }]) {
      expect(createWeddingSchema.safeParse({ ...input, ...change }).success).toBe(false);
    }
    expect(createWeddingSchema.safeParse({ ...input, title: "", description: "" }).success).toBe(true);
  });

});

describe("wedding creation endpoint", () => {
  it("requires a valid session before creating anything", async () => {
    dependencies.session.mockResolvedValue(null);
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(dependencies.insert).not.toHaveBeenCalled();
  });
  it("rejects untrusted/missing origins and attempts to choose another account", async () => {
    expect((await POST(request(input, "https://attacker.example"))).status).toBe(403);
    const missingOrigin = request(); missingOrigin.headers.delete("origin");
    expect((await POST(missingOrigin)).status).toBe(403);
    expect((await POST(request({ ...input, authUserId: "victim" }))).status).toBe(422);
    expect(dependencies.insert).not.toHaveBeenCalled();
  });
  it("rejects malformed, oversized and non-JSON payloads without writes", async () => {
    const malformed = request();
    const response = await POST(new Request(malformed.url, { method: "POST", headers: malformed.headers, body: "{" }));
    expect(response.status).toBe(400);
    expect((await POST(request({ ...input, brideName: "x".repeat(17000) }))).status).toBe(413);
    const text = request(); text.headers.set("content-type", "text/plain");
    expect((await POST(text)).status).toBe(415);
    expect(dependencies.insert).not.toHaveBeenCalled();
  });
  it("creates using only the session identity and returns a private 201 location", async () => {
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(response.headers.get("location")).toBe(`/api/v1/weddings/${id}`);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(dependencies.insert).toHaveBeenCalledWith(input, "current-account");
    expect((await response.json()).data).toMatchObject({ id, status: "draft", myRole: "admin" });
  });
  it("passes validated celebration details to persistence", async () => {
    const details = { ...input, location: "Jaipur", title: "Forever Begins", description: "With our families" };
    expect((await POST(request(details))).status).toBe(201);
    expect(dependencies.insert).toHaveBeenCalledWith(details, "current-account");
  });
  it("reports a duplicate slug as a conflict and hides unrelated storage errors", async () => {
    dependencies.insert.mockRejectedValueOnce(new MongoServerError({ code: 11000, keyPattern: { slug: 1 } }));
    const duplicate = await POST(request());
    expect(duplicate.status).toBe(409);
    expect((await duplicate.json()).error.code).toBe("SLUG_TAKEN");
    dependencies.insert.mockRejectedValueOnce(new Error("private database credentials"));
    const unavailable = await POST(request());
    expect(unavailable.status).toBe(503);
    expect(await unavailable.text()).not.toContain("credentials");
  });
});

describe("private wedding reads", () => {
  it("conceals another tenant before fetching its wedding and rejects malformed IDs", async () => {
    expect(await getMyWedding("not-an-id", "current-account")).toBeNull();
    expect(dependencies.member).not.toHaveBeenCalled();
    expect(await getMyWedding(id, "current-account")).toBeNull();
    expect(dependencies.member).toHaveBeenCalledWith(new ObjectId(id), "current-account");
    expect(dependencies.wedding).not.toHaveBeenCalled();
    const response = await GET(new Request(`http://localhost/api/v1/weddings/${id}`), { params: Promise.resolve({ weddingId: id }) });
    expect(response.status).toBe(404);
  });
  it("returns only summary fields for an active member", async () => {
    dependencies.member.mockResolvedValue({ role: "manager", ownerSeat: "bride" });
    dependencies.wedding.mockResolvedValue({ _id: new ObjectId(id), ...input, title: "Forever Begins", location: "Jaipur", description: "Our story", startAt: new Date(input.startAt), status: "draft", privateData: "secret" });
    const response = await GET(new Request(`http://localhost/api/v1/weddings/${id}`), { params: Promise.resolve({ weddingId: id }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({ id, brideName: input.brideName, myRole: "manager", title: "Forever Begins", location: "Jaipur", description: "Our story" });
    expect(body.data).not.toHaveProperty("ownerSeat");
    expect(body.data).not.toHaveProperty("privateData");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
