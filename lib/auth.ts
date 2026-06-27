import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export type { JwtPayload } from "@/lib/jwt";
export { signJwt, verifyJwt } from "@/lib/jwt";

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const OTP_EXPIRY_MS = 2 * 60 * 1000;       // 2 minutes
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000;  // 30 seconds
export const OTP_MAX_ATTEMPTS = 5;