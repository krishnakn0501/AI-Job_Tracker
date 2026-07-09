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

  const token = request.cookies.get("jobtrack_session")?.value;

  if (!token) {
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
