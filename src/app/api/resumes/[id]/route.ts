export const dynamic = 'force-dynamic';

import { getUserId } from "@/shared/middleware/getUserId";
import { container } from "@/infrastructure/container";
import { deleteResumeFile } from "@/infrastructure/external-api/AnthropicClient";
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
 * PATCH /api/resumes/[id]
 * - Update the label of a specific resume
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();
    const { label } = await request.json();

    if (!label?.trim()) {
      return Response.json({ error: "Label cannot be empty" }, { status: 400 });
    }

    const result = await container.resumeUseCase.updateLabel(
      params.id,
      userId,
      label.trim()
    );

    const error = handleResultError(result);
    if (error) {
      return Response.json({ error: error.error }, { status: error.status });
    }

    return Response.json(result.value);
  } catch (error) {
    console.error("[api/resumes/:id PATCH] Error:", error);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}

/**
 * DELETE /api/resumes/[id]
 * - Delete a resume and its file from Anthropic storage.
 * - If this was the base resume, promote the most recently created remaining one.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();

    // Fetch resume first to get fileId for external cleanup
    const getResult = await container.resumeUseCase.getById(params.id, userId);
    if (Result.isFailure(getResult)) {
      const error = getResult.error;
      if (error.name === "NotFoundError") {
        return Response.json({ error: error.message }, { status: 404 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Delete from Anthropic storage too
    await deleteResumeFile(getResult.value.fileId);

    const result = await container.resumeUseCase.delete(params.id, userId);
    const error = handleResultError(result);
    if (error) {
      return Response.json({ error: error.error }, { status: error.status });
    }

    if (!Result.isSuccess(result)) {
      return Response.json({ error: "Unexpected error" }, { status: 500 });
    }

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error("[api/resumes/:id DELETE] Error:", error);
    return Response.json({ error: "Delete failed" }, { status: 500 });
  }
}