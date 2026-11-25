import { z } from "zod";

export const visibilityLabels = { invitedOnly: "Invitation only", managersOnly: "Organizers only", public: "Public" };
const fields = z.strictObject({
  name: z.string().trim().min(1, "Enter a ceremony name.").max(120),
  startAt: z.iso.datetime({ offset: true }), endAt: z.iso.datetime({ offset: true }),
  venue: z.strictObject({ displayName: z.string().trim().max(200).default(""), address: z.string().trim().max(350).default(""),
    mapUrl: z.union([z.literal(""), z.url({ protocol: /^https?$/ }).max(1000)]).default("") }).default({ displayName: "", address: "", mapUrl: "" }),
  description: z.string().trim().max(2000).default(""), instructions: z.string().trim().max(2000).default(""),
  dressCode: z.string().trim().max(200).default(""), visibility: z.enum(["invitedOnly","managersOnly","public"]).default("invitedOnly"),
  status: z.enum(["draft","scheduled","completed","cancelled"]).default("scheduled"),
});
export const eventSchema = fields.refine(e => Date.parse(e.endAt) > Date.parse(e.startAt), { path: ["endAt"], message: "End time must be after start time." });
export const eventPatch = fields.partial().extend({ expectedVersion: z.number().int().positive().optional() });
export type Ceremony = z.output<typeof fields> & { id: string; version: number };

export function localMinute(instant: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(instant));
  const p = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return p.year + "-" + p.month + "-" + p.day + "T" + p.hour + ":" + p.minute;
}

export function toInstant(local: string, timezone: string) {
  const target = Date.parse(local + ":00Z");
  if (!Number.isFinite(target)) return null;
  // Sample both sides of clock transitions; choose the earlier occurrence of a repeated minute.
  const offsets = [-86400000, 0, 86400000].map(delta => {
    const sample = new Date(target + delta).toISOString();
    return Date.parse(localMinute(sample, timezone) + ":00Z") - Date.parse(sample);
  });
  const candidates = offsets.map(offset => new Date(target - offset).toISOString()).sort();
  return candidates.find(candidate => localMinute(candidate, timezone) === local) ?? null;
}
