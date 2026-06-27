import { prisma } from "@/lib/prisma";
import { generateOtp, OTP_EXPIRY_MS } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success even if user doesn't exist — avoid leaking which emails are registered
    if (!user) return Response.json({ success: true });

    const code = generateOtp();
    await prisma.otpCode.create({
      data: { userId: user.id, code, purpose: "reset_password", expiresAt: new Date(Date.now() + OTP_EXPIRY_MS) },
    });

    // Send email asynchronously (don't block the response)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    sendOtpEmail(email, code, "reset_password");

    return Response.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("[api/auth/forgot-password] Error:", error);
    return Response.json({ error: "Request failed" }, { status: 500 });
  }
}