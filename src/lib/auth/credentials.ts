import { z } from "zod";

export const nameSchema = z.string().trim().min(1).max(100);
export const emailSchema = z.string().trim().max(254).pipe(z.email());
export const countryCodeSchema = z.string().regex(/^\+[1-9]\d{0,2}$/);
export const nationalPhoneSchema = z.string().regex(/^\d{6,14}$/);
export const phoneSchema = z.string().regex(/^\+[1-9]\d{7,14}$/);
export const passwordMaxLength = 128;
export const resetOtpLength = 6;
export const resetOtpMinutes = 5;
