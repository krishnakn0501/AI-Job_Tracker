import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-otp", "/help"];
const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/cron/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.DISABLE_AUTH === "1") {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname) || PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("jobtrack_access_token")?.value;
  const refreshToken = request.cookies.get("jobtrack_refresh_token")?.value;

  if (!accessToken && !refreshToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|resumes/).*)"],
};
