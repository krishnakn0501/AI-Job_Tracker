export const dynamic = 'force-dynamic';

import { getUserId } from "@/shared/middleware/getUserId";
import { container } from "@/infrastructure/container";
import { Result } from "@/shared/types/Result";

function handleResultError<T>(
  result: Result<T, Error>
): { error: string; detail?: string; status: number } | null {
  if (Result.isFailure(result)) {
    const error = result.error;
    if (error.name === "NotFoundError") {
      return { error: error.message, status: 404 };
    }
    if (error.name === "ValidationError") {
      return { error: error.message, detail: error.message, status: 400 };
    }
    return { error: error.message, status: 500 };
  }
  return null;
}

/**
 * GET /api/reminders
 * - Returns applications where follow-up is due today OR interview is tomorrow.
 */
export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const result = await container.reminderUseCase.getRemindersForUser(userId);

    const error = handleResultError(result);
    if (error) {
      return Response.json({ error: error.error }, { status: error.status });
    }

    return Response.json(result.value);
  } catch (error) {
    console.error("[api/reminders GET] Error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}