import { expect, it } from "vitest";
import { eventSchema, localMinute, toInstant } from "@/modules/planning/events-schema";
it("converts wedding wall time independently of the device timezone", () => {
  expect(toInstant("2027-02-14T10:00","Asia/Kolkata")).toBe("2027-02-14T04:30:00.000Z");
  expect(localMinute("2027-02-14T04:30:00.000Z","Asia/Kolkata")).toBe("2027-02-14T10:00");
  expect(toInstant("2027-03-14T02:30","America/New_York")).toBeNull();
  expect(toInstant("2027-11-07T01:30","America/New_York")).toBe("2027-11-07T05:30:00.000Z");
});
it("defaults custom ceremonies to private and rejects invalid intervals or map links", () => {
  const event = { name:"Family puja", startAt:"2027-02-14T06:30:00Z", endAt:"2027-02-14T08:00:00Z" };
  expect(eventSchema.parse(event).visibility).toBe("invitedOnly");
  expect(eventSchema.safeParse({ ...event,endAt:event.startAt }).success).toBe(false);
  expect(eventSchema.safeParse({ ...event,venue:{mapUrl:"javascript:alert(1)"} }).success).toBe(false);
});
