export const dynamic = 'force-dynamic';

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
    if (error.message.includes("already exists")) {
      return { error: error.message, status: 409 };
    }
    return { error: error.message, status: 500 };
  }
  return null;
}

/**
 * POST /api/auth/signup
 * - Create a new user account (or update an unverified one) and send OTP.
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password || password.length < 8) {
      return Response.json(
        { error: "Email and password (min 8 characters) are required" },
        { status: 400 }
      );
    }

    const result = await container.authUseCase.signUp(email, password);
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

    return Response.json({ success: true, userId: result.value.userId });
  } catch (error) {
    console.error("[api/auth/signup] Error:", error);
    return Response.json({ error: "Signup failed" }, { status: 500 });
  }
}