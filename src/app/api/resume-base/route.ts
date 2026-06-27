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
 * GET /api/resume-base
 * - Returns the user's base resume.
 */
export async function GET(request: Request) {
  try {
    const userId = await getUserId();

    const result = await container.resumeUseCase.getAll(userId);
    const error = handleResultError(result);
    if (error) {
      return Response.json({ error: error.error }, { status: error.status });
    }

    if (!Result.isSuccess(result)) {
      return Response.json({ error: "Unexpected error" }, { status: 500 });
    }

    const baseResume = result.value.find((r) => r.isBase) ?? result.value[0];
    if (!baseResume) {
      return Response.json({ error: "No resume uploaded yet" }, { status: 404 });
    }

    return Response.json({
      fileId: baseResume.fileId,
      filename: baseResume.filename,
      updatedAt: baseResume.updatedAt,
    });
  } catch (error) {
    console.error("[api/resume-base] Error:", error);
    return Response.json(
      {
        error: "Internal server error",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}