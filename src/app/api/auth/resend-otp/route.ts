export const dynamic = 'force-dynamic';

import { container } from "@/infrastructure/container";
import { Result } from "@/shared/types/Result";
import type { OtpPurpose } from "@/application/services/AuthUseCase";

function handleResultError<T>(
  result: Result<T, Error>
): { error: string; detail?: string; status: number } | null {
  if (Result.isFailure(result)) {
    const error = result.error;
    if (error.name === "ValidationError") {
      return { error: error.message, detail: error.message, status: 400 };
    }
    if (error.name === "UnauthorizedError") {
      return { error: error.message, status: 401 };
    }
    return { error: error.message, status: 500 };
  }
  return null;
}

/**
 * POST /api/auth/resend-otp
 * - Resend OTP code with rate limiting.
 */
export async function POST(request: Request) {
  try {
    const { userId, purpose } = await request.json();

    const result = await container.authUseCase.resendOtp(
      userId,
      purpose as OtpPurpose
    );
    const error = handleResultError(result);
    if (error) {
      return Response.json(
        { error: error.error, detail: error.detail },
        { status: error.status }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("[api/auth/resend-otp] Error:", error);
    return Response.json({ error: "Resend failed" }, { status: 500 });
  }
}