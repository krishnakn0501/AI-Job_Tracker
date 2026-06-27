import { prisma } from "@/lib/prisma";
import { signJwt, OTP_MAX_ATTEMPTS } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { userId, code, purpose } = await request.json();

    const otp = await prisma.otpCode.findFirst({
      where: { userId, purpose, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return Response.json({ error: "No active code found. Request a new one." }, { status: 400 });
    }
    if (otp.expiresAt < new Date()) {
      return Response.json({ error: "Code expired. Request a new one." }, { status: 400 });
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      return Response.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
    }
    if (otp.code !== code) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      return Response.json({ error: "Incorrect code" }, { status: 400 });
    }

    await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

    // Fetch user before updating
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    let updateData = {};
    if (purpose === "signup") {
      updateData = { emailVerified: true };
    } else if (purpose === "change_email" && user.pendingEmail) {
      updateData = { email: user.pendingEmail, pendingEmail: null };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    if (purpose === "signup") {
      const token = await signJwt({ userId: updatedUser.id, email: updatedUser.email });
      cookies().set("jobtrack_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });
    }

    return Response.json({ success: true, purpose });
  } catch (error) {
    console.error("[api/auth/verify-otp] Error:", error);
    return Response.json({ error: "Verification failed" }, { status: 500 });
  }
}