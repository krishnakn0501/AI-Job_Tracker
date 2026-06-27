import { prisma } from "@/lib/prisma";
import { verifyPassword, signJwt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }
    if (!user.emailVerified) {
      return Response.json({ error: "Please verify your email before logging in" }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signJwt({ userId: user.id, email: user.email });
    cookies().set("jobtrack_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return Response.json({ success: true, isAdmin: user.isAdmin });
  } catch (error) {
    console.error("[api/auth/login] Error:", error);
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}