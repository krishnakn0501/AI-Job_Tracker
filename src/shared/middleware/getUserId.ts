import { cookies } from "next/headers";
import { verifyJwt } from "@/infrastructure/auth/JwtService";

/**
 * Extract userId from the session cookie by verifying the JWT.
 * Using cookies() from next/headers automatically opts the route into dynamic rendering.
 */
export async function getUserId(): Promise<string> {
  const sessionCookie = cookies().get("jobtrack_session")?.value;

  if (!sessionCookie) {
    throw new Error("Missing user context — no session cookie found");
  }

  const payload = await verifyJwt(sessionCookie);

  if (!payload) {
    throw new Error("Invalid session — could not verify JWT");
  }

  return payload.userId;
}

/**
 * Extended helper that returns both user ID and optional auth info.
 */
export interface AuthContext {
  userId: string;
  tokenValid: boolean;
}

export async function getAuthContext(): Promise<AuthContext> {
  const userId = await getUserId();

  return {
    userId,
    tokenValid: true,
  };
}
