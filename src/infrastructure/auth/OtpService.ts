// src/infrastructure/auth/OtpService.ts

import crypto from "crypto";

export const OTP_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

export function generateOtp(): string {
  // Generate a 6-digit numeric code
  const code = crypto.randomInt(100000, 999999);
  return code.toString();
}
