import { prisma } from "@/lib/prisma";
import { generateOtp, OTP_EXPIRY_MS, OTP_RESEND_COOLDOWN_MS } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const { userId, purpose } = await request.json();

    const lastOtp = await prisma.otpCode.findFirst({
      where: { userId, purpose },
      orderBy: { createdAt: "desc" },
    });

    if (lastOtp && Date.now() - lastOtp.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      const waitMs = OTP_RESEND_COOLDOWN_MS - (Date.now() - lastOtp.createdAt.getTime());
      return Response.json({ error: "Please wait before resending", waitMs }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const code = generateOtp();
    await prisma.otpCode.create({
      data: { userId, code, purpose, expiresAt: new Date(Date.now() + OTP_EXPIRY_MS) },
    });

    // Send email asynchronously (don't block the response)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    sendOtpEmail(user.email, code, purpose);

    return Response.json({ success: true });
  } catch (error) {
    console.error("[api/auth/resend-otp] Error:", error);
    return Response.json({ error: "Resend failed" }, { status: 500 });
  }
}