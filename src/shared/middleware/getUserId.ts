import { cookies, headers } from "next/headers";
import { verifyAccessToken } from "@/infrastructure/auth/JwtService";

/**
 * Extract userId from the session cookie by verifying the JWT.
 * Using cookies() from next/headers automatically opts the route into dynamic rendering.
 */
export async function getUserId(): Promise<string> {
  if (process.env.DISABLE_AUTH === "1") {
    const headersList = headers();
    const userIdHeader = headersList.get("x-user-id");
    if (userIdHeader) {
      return userIdHeader;
    }
    return process.env.TEST_USER_ID ?? "default-test-user";
  }

  const sessionCookie = cookies().get("jobtrack_access_token")?.value;

  if (!sessionCookie) {
    throw new Error("Missing user context — no access token found");
  }

  const payload = await verifyAccessToken(sessionCookie);

  if (!payload) {
    throw new Error("Invalid session — could not verify access token");
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
