export const dynamic = 'force-dynamic';

import { getUserId } from "@/shared/middleware/getUserId";
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
 * POST /api/auth/change-email
 * - Request email change with OTP.
 */
export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const { newEmail, currentPassword } = await request.json();

    const result = await container.authUseCase.requestEmailChange(
      userId,
      newEmail,
      currentPassword
    );
    const error = handleResultError(result);
    if (error) {
      return Response.json(
        { error: error.error, detail: error.detail },
        { status: error.status }
      );
    }

    return Response.json({ success: true, userId });
  } catch (error) {
    console.error("[api/auth/change-email] Error:", error);
    return Response.json({ error: "Email change request failed" }, { status: 500 });
  }
}