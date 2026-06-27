import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("jobtrack_session")?.value;
  const result = token ? await verifyJwt(token) : null;
  return NextResponse.json({
    hasCookie: !!token,
    tokenPrefix: token?.substring(0, 50),
    verified: !!result,
    userId: result?.userId,
    jwtSecretSet: !!process.env.JWT_SECRET,
    jwtSecretLen: process.env.JWT_SECRET?.length || 0,
  });
}
