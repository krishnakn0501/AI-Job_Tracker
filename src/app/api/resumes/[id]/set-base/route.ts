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
 * POST /api/resumes/[id]/set-base
 * - Set a specific resume as the user's default base resume.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();

    const result = await container.resumeUseCase.setAsBase(params.id, userId);
    const error = handleResultError(result);
    if (error) {
      return Response.json({ error: error.error }, { status: error.status });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("[api/resumes/:id/set-base POST] Error:", error);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}