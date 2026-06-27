export const dynamic = 'force-dynamic';

import { getUserId } from "@/shared/middleware/getUserId";
import { triggerResumeGeneration } from "@/infrastructure/external-api/N8nClient";
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
 * POST /api/applications/trigger
 * - Re-trigger n8n resume generation for a specific application.
 */
export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "id and jdText are required" },
        { status: 400 }
      );
    }

    if (!body.id || !body.jdText) {
      return Response.json(
        { error: "id and jdText are required" },
        { status: 400 }
      );
    }

    const [appResult, resumesResult] = await Promise.all([
      container.applicationUseCase.getById(body.id as string, userId),
      container.resumeUseCase.getAll(userId),
    ]);

    const appError = handleResultError(appResult);
    if (appError) {
      return Response.json({ error: appError.error }, { status: appError.status });
    }

    const resumesError = handleResultError(resumesResult);
    if (resumesError) {
      return Response.json(
        { error: resumesError.error },
        { status: resumesError.status }
      );
    }

    if (!Result.isSuccess(appResult) || !Result.isSuccess(resumesResult)) {
      return Response.json({ error: "Unexpected error" }, { status: 500 });
    }

    const application = appResult.value;
    const resumeBases = resumesResult.value;

    if (!resumeBases || resumeBases.length === 0 || !resumeBases[0].fileId) {
      return Response.json(
        { error: "No resume uploaded — cannot generate" },
        { status: 400 }
      );
    }

    // Fire-and-forget
    void triggerResumeGeneration({
      applicationId: body.id as string,
      company: application.company,
      role: application.role,
      jdText: body.jdText as string,
      fileId: resumeBases[0].fileId,
      userId,
    }).catch((e) => console.error("n8n trigger failed:", e));

    return Response.json({ success: true });
  } catch (error) {
    console.error("[api/applications/trigger] Error:", error);
    return Response.json(
      {
        error: "Internal server error",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}