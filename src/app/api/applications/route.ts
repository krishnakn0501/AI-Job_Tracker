export const dynamic = 'force-dynamic';

import { getUserId } from "@/shared/middleware/getUserId";
import { triggerResumeGeneration } from "@/infrastructure/external-api/N8nClient";
import { container } from "@/infrastructure/container";
import { ApplicationStatus } from "@/domains/application/entities/ApplicationStatus";
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
 * GET /api/applications
 * - List all applications with optional status filter and text search
 * Query params: ?status=Interview&search=google
 */
export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const search = searchParams.get("search") ?? undefined;

    const status = statusParam
      ? (statusParam as ApplicationStatus)
      : undefined;

    const result = await container.applicationUseCase.getAll(userId, {
      status,
      search,
    });

    const error = handleResultError(result);
    if (error) {
      return Response.json({ error: error.error }, { status: error.status });
    }

    return Response.json(result.value);
  } catch (error) {
    console.error("[api/applications GET] Error:", error);
    return Response.json(
      {
        error: "Internal server error",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/applications
 * - Create a new application and fire-and-forget trigger n8n resume generation
 */
export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    let resume = null;
    if (body.resumeBaseId) {
      const resumeResult = await container.resumeUseCase.getById(
        body.resumeBaseId,
        userId
      );
      if (Result.isFailure(resumeResult)) {
        return Response.json({ error: "Selected resume not found" }, { status: 400 });
      }
      resume = resumeResult.value;
    }

    const result = await container.applicationUseCase.create(
      {
        company: body.company,
        role: body.role,
        jdText: body.jdText,
        jdUrl: body.jdUrl,
        resumeBaseId: body.resumeBaseId,
        skipTailoring: body.skipTailoring,
        appliedDate: body.appliedDate,
        followUpDate: body.followUpDate,
        interviewDate: body.interviewDate,
        notes: body.notes,
        status: body.status,
        // S10
        reminderOverrideEnabled: body.reminderOverrideEnabled,
        overrideReminderHour: body.overrideReminderHour,
        overrideReminderAmPm: body.overrideReminderAmPm,
        overrideReminderOffsetDays: body.overrideReminderOffsetDays,
        overrideReminderRepeat: body.overrideReminderRepeat,
      },
      userId
    );

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

    if (resume && !body.skipTailoring) {
      void triggerResumeGeneration({
        applicationId: result.value.id,
        company: result.value.company,
        role: result.value.role,
        jdText: result.value.jdText ?? "",
        fileId: resume.fileId,
        userId,
      }).catch((e) => console.error("n8n trigger failed:", e));
    }

    return Response.json(result.value, { status: 201 });
  } catch (error) {
    console.error("[api/applications POST] Error:", error);
    return Response.json(
      {
        error: "Internal server error",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}