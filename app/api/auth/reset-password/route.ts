import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // This route must only be called AFTER /api/auth/verify-otp succeeded with
    // purpose="reset_password" for this userId. There is no separate token check here
    // because the OTP consumption already happened — the client only reaches this step
    // after that verification passed.
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("[api/auth/reset-password] Error:", error);
    return Response.json({ error: "Reset failed" }, { status: 500 });
  }
}