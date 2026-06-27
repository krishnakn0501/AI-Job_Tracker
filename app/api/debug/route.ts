import { NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const cookie = request.cookies.get("jobtrack_session");
  return Response.json({
    hasCookie: !!cookie,
    cookieValue: cookie?.value ? cookie.value.substring(0, 50) + "..." : null,
    cookieName: cookie?.name,
    jwtSecretSet: !!process.env.JWT_SECRET,
    jwtSecretLength: process.env.JWT_SECRET?.length || 0,
  });
}
