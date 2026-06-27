import { prisma } from "@/lib/prisma";
import { verifyPassword, generateOtp, OTP_EXPIRY_MS } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/mailer";
import { getUserId } from "@/lib/get-user-id";

export async function POST(request: Request) {
  try {
    const userId = getUserId(request);
    const { newEmail, currentPassword } = await request.json();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return Response.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const taken = await prisma.user.findUnique({ where: { email: newEmail } });
    if (taken) {
      return Response.json({ error: "That email is already in use" }, { status: 409 });
    }

    await prisma.user.update({ where: { id: userId }, data: { pendingEmail: newEmail } });

    const code = generateOtp();
    await prisma.otpCode.create({
      data: { userId, code, purpose: "change_email", expiresAt: new Date(Date.now() + OTP_EXPIRY_MS) },
    });
    await sendOtpEmail(newEmail, code, "change_email" as any); // see lib/mailer.ts update below

    return Response.json({ success: true, userId });
  } catch (error) {
    console.error("[api/auth/change-email] Error:", error);
    return Response.json({ error: "Email change request failed" }, { status: 500 });
  }
}