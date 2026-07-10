export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/infrastructure/auth/JwtService";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("jobtrack_session")?.value;

  if (!token) {
    return NextResponse.json({ error: "No token found in cookies" }, { status: 401 });
  }

  const result = await verifyAccessToken(token);
  return NextResponse.json({
    hasCookie: !!token,
    tokenPrefix: token?.substring(0, 50),
    verified: !!result,
    userId: result?.userId,
    jwtSecretSet: !!process.env.JWT_SECRET,
    jwtSecretLen: process.env.JWT_SECRET?.length || 0,
  });
}
