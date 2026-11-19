import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

vi.mock("server-only", () => ({}));
const dependencies = vi.hoisted(() => ({
  session: vi.fn(),
  findWeddings: vi.fn(),
  aggregate: vi.fn(),
}));
vi.mock("@/lib/auth/server", () => ({ getSession: dependencies.session }));
vi.mock("@/lib/db/mongodb", () => ({
  getDatabase: async () => ({
    collection: () => ({ aggregate: dependencies.aggregate }),
  }),
}));

import { GET as getMe } from "@/app/api/v1/me/route";
import { GET as getWeddings } from "@/app/api/v1/weddings/route";
import { membershipWeddingPipeline } from "@/modules/weddings/repository";
import { listMyWeddings } from "@/modules/weddings/service";
import { activeMembershipFilter } from "@/lib/permissions/memberships";

beforeEach(() => {
  dependencies.session.mockResolvedValue(null);
  dependencies.aggregate.mockReturnValue({
    toArray: dependencies.findWeddings,
  });
  dependencies.findWeddings.mockResolvedValue([]);
});

describe("protected account APIs", () => {
  for (const [name, handler] of [
    ["me", getMe],
    ["weddings", getWeddings],
  ] as const) {
    it(`${name} denies missing, invalid, or expired sessions before reading weddings`, async () => {
      const result = await handler(
        new Request(`http://localhost/api/v1/${name}`),
      );
      expect(result.status).toBe(401);
      expect((await result.json()).error.code).toBe("AUTH_REQUIRED");
      expect(dependencies.aggregate).not.toHaveBeenCalled();
      expect(result.headers.get("Cache-Control")).toBe("no-store");
    });
    it(`${name} fails closed when session validation fails`, async () => {
      dependencies.session.mockRejectedValue(
        new Error("private database connection string"),
      );
      const result = await handler(
        new Request(`http://localhost/api/v1/${name}`),
      );
      expect(result.status).toBe(503);
      expect(await result.text()).not.toContain("connection string");
      expect(dependencies.aggregate).not.toHaveBeenCalled();
    });
  }

  it("uses the session identity even when a caller supplies another user's ID", async () => {
    dependencies.session.mockResolvedValue({
      user: { id: "owner-a", name: "Owner A", email: "owner-a@example.test" },
      session: { token: "private-token" },
    });
    const result = await getMe(
      new Request("http://localhost/api/v1/me?authUserId=owner-b", {
        headers: { "X-Request-Id": "untrusted" },
      }),
    );
    expect(result.status).toBe(200);
    expect(dependencies.aggregate).toHaveBeenCalledWith(
      membershipWeddingPipeline("owner-a"),
    );
    const body = await result.json();
    expect(body.data.memberships).toEqual([]);
    expect(JSON.stringify(body)).not.toContain("private-token");
    expect(body.meta.requestId).not.toBe("untrusted");
    expect(result.headers.get("X-Request-Id")).toBe(body.meta.requestId);
  });

  it("reports a database failure rather than a misleading empty wedding list", async () => {
    dependencies.session.mockResolvedValue({ user: { id: "owner-a" } });
    dependencies.findWeddings.mockRejectedValue(
      new Error("database unavailable"),
    );
    expect(
      (await getWeddings(new Request("http://localhost/api/v1/weddings")))
        .status,
    ).toBe(503);
  });
});

describe("membership scope and serialization", () => {
  it("requires active membership tied to the authenticated ID before joining weddings", () => {
    expect(membershipWeddingPipeline("owner-a")[0]).toEqual({
      $match: { authUserId: "owner-a", status: "active" },
    });
    expect(() => activeMembershipFilter("")).toThrow();
  });
  it("returns only approved summary fields and no owner seat for an organizer", async () => {
    const id = new ObjectId();
    dependencies.findWeddings.mockResolvedValue([
      {
        weddingId: id,
        role: "manager",
        ownerSeat: "bride",
        wedding: {
          brideName: "A",
          groomName: "B",
          startAt: new Date("2027-02-14T04:30:00Z"),
          timezone: "Asia/Kolkata",
          status: "active",
          budget: 999,
          guestEmails: ["private@example.test"],
        },
      },
    ]);
    const result = await listMyWeddings("organizer-a");
    expect(result).toEqual([
      {
        id: id.toHexString(),
        brideName: "A",
        groomName: "B",
        startAt: "2027-02-14T04:30:00.000Z",
        timezone: "Asia/Kolkata",
        status: "active",
        myRole: "manager",
      },
    ]);
  });
});
