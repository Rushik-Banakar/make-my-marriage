import { z } from "zod";

export const timezoneSchema = z.string().trim().max(100).refine((value) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return value === "UTC" || value.includes("/");
  } catch { return false; }
}, "Choose a valid IANA timezone, such as Asia/Kolkata.");

const displayName = z.string().trim().min(1, "Enter both names.").max(100)
  .regex(/^[^\u0000-\u001f\u007f]+$/, "Names cannot contain control characters.");

export const weddingSlugMaxLength = 60;

export const createWeddingSchema = z.strictObject({
  brideName: displayName,
  groomName: displayName,
  location: z.string().trim().max(200, "Keep the location within 200 characters.").optional(),
  title: z.string().trim().max(160, "Keep the wedding title within 160 characters.").optional(),
  description: z.string().trim().max(2000, "Keep the description within 2,000 characters.").optional(),
  startAt: z.iso.datetime().refine((value) => Number.isFinite(Date.parse(value)), "Choose a valid wedding date."),
  timezone: timezoneSchema.default("Asia/Kolkata"),
  slug: z.string().trim().toLowerCase().min(3).max(weddingSlugMaxLength)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens."),
  initialOwnerSeat: z.enum(["bride", "groom"]),
});

export type CreateWeddingInput = z.infer<typeof createWeddingSchema>;

export function suggestWeddingSlug(bride: string, groom: string) {
  return `${bride}-${groom}`.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, weddingSlugMaxLength).replace(/-$/, "");
}

// The first setup screen collects a date, not a ceremony time. Anchor it at
// noon in the wedding's timezone so browsers in other zones keep the date.
export function weddingDateToInstant(date: string, timezone: string): string | null {
  const parsedTimezone = timezoneSchema.safeParse(timezone);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !parsedTimezone.success) return null;
  const target = Date.parse(`${date}T12:00:00.000Z`);
  if (!Number.isFinite(target) || new Date(target).toISOString().slice(0, 10) !== date) return null;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: parsedTimezone.data, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  let instant = target;
  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(formatter.formatToParts(instant).map(({ type, value }) => [type, value]));
    const local = Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.000Z`);
    if (local === target) return new Date(instant).toISOString();
    instant += target - local;
  }
  return null; // e.g. a calendar date skipped by a timezone transition
}
