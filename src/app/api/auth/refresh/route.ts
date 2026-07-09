export const dynamic = 'force-dynamic';

import { cookies } from "next/headers";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/infrastructure/auth/JwtService";

export async function POST(request: Request) {
  try {
    const refreshToken = cookies().get("jobtrack_refresh_token")?.value;

    if (!refreshToken) {
      return Response.json({ error: "No refresh token provided" }, { status: 401 });
    }

    const payload = await verifyRefreshToken(refreshToken);

    if (!payload) {
      // Refresh token is invalid or expired
      cookies().delete("jobtrack_access_token");
      cookies().delete("jobtrack_refresh_token");
      return Response.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    // Generate new tokens (Rotation)
    const newPayload = { userId: payload.userId, email: payload.email };
    const newAccessToken = await signAccessToken(newPayload);
    const newRefreshToken = await signRefreshToken(newPayload);

    cookies().set("jobtrack_access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    cookies().set("jobtrack_refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("[api/auth/refresh] Error:", error);
    return Response.json({ error: "Refresh failed" }, { status: 500 });
  }
}
