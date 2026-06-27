import { prisma } from "@/lib/prisma";
import { hashPassword, generateOtp, OTP_EXPIRY_MS } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password || password.length < 8) {
      return Response.json(
        { error: "Email and password (min 8 characters) are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.emailVerified) {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = existing
      ? await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } })
      : await prisma.user.create({
          data: {
            email,
            passwordHash,
            username: email.split("@")[0].toLowerCase()
          }
        });

    const code = generateOtp();
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code,
        purpose: "signup",
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      },
    });

    // Send email asynchronously (don't block the response)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    sendOtpEmail(email, code, "signup");

    return Response.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("[api/auth/signup] Error:", error);
    return Response.json({ error: "Signup failed" }, { status: 500 });
  }
}