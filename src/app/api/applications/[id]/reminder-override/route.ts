export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    const result = await container.applicationUseCase.updateReminderOverride(
      params.id,
      userId,
      {
        reminderOverrideEnabled: body.reminderOverrideEnabled,
        overrideReminderHour: body.overrideReminderHour,
        overrideReminderAmPm: body.overrideReminderAmPm,
        overrideReminderOffsetDays: body.overrideReminderOffsetDays,
        overrideReminderRepeat: body.overrideReminderRepeat,
      }
    );

    const error = handleResultError(result);
    if (error) {
      return Response.json({ error: error.error }, { status: error.status });
    }

    return Response.json(result.value);
  } catch (error) {
    console.error("[api/applications/:id/reminder-override] Error:", error);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}
