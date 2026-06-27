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
    if (error.name === "UnauthorizedError") {
      return { error: error.message, status: 401 };
    }
    return { error: error.message, status: 500 };
  }
  return null;
}

/**
 * POST /api/auth/forgot-password
 * - Request password reset OTP.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const result = await container.authUseCase.forgotPassword(email);
    const error = handleResultError(result);
    if (error) {
      return Response.json(
        { error: error.error, detail: error.detail },
        { status: error.status }
      );
    }

    // Always return generic success to avoid leaking registered emails
    return Response.json({ success: true });
  } catch (error) {
    console.error("[api/auth/forgot-password] Error:", error);
    return Response.json({ error: "Request failed" }, { status: 500 });
  }
}