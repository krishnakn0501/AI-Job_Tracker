export const dynamic = 'force-dynamic';

import { cookies } from "next/headers";
import { container } from "@/infrastructure/container";
import { Result } from "@/shared/types/Result";

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
 * POST /api/auth/verify-otp
 * - Verify OTP code and apply the corresponding action.
 */
export async function POST(request: Request) {
  try {
    const { userId, code, purpose } = await request.json();

    const result = await container.authUseCase.verifyOtp(userId, code, purpose);
    const error = handleResultError(result);
    if (error) {
      return Response.json(
        { error: error.error, detail: error.detail },
        { status: error.status }
      );
    }

    if (!Result.isSuccess(result)) {
      return Response.json({ error: "Unexpected error" }, { status: 500 });
    }

    // For signup, verify the email but do NOT log them in automatically
    if (purpose === "signup") {
      const userResult = await container.userUseCase.verifyEmail(userId);
      if (Result.isFailure(userResult)) {
        return Response.json({ error: userResult.error.message }, { status: 500 });
      }
    }

    return Response.json({ success: true, purpose });
  } catch (error) {
    console.error("[api/auth/verify-otp] Error:", error);
    return Response.json({ error: "Verification failed" }, { status: 500 });
  }
}