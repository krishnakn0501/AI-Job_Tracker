export const dynamic = 'force-dynamic';

import { getUserId } from "@/shared/middleware/getUserId";
import { container } from "@/infrastructure/container";
import { Result } from "@/shared/types/Result";
import { prisma } from "@/infrastructure/persistence/prisma/PrismaClient";
import fs from "fs";
import path from "path";

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
 * GET /api/applications/[id]
 * - Get a single application by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();
    const result = await container.applicationUseCase.getById(params.id, userId);

    const error = handleResultError(result);
    if (error) {
      return Response.json({ error: error.error }, { status: error.status });
    }

    return Response.json(result.value);
  } catch (error) {
    console.error("[api/applications/[id] GET] Error:", error);
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
 * PATCH /api/applications/[id]
 * - Partial update of an application (only allowed fields)
 *
 * TODO: Move full PATCH logic into ApplicationUseCase once domain supports
 * partial updates of all mutable fields.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid or empty request body" }, { status: 400 });
    }

    // For status-only updates, use the use case (validates state machine)
    if (body.status && typeof body.status === "string") {
      const result = await container.applicationUseCase.updateStatus(
        params.id,
        userId,
        body.status as any
      );
      const error = handleResultError(result);
      if (error) {
        return Response.json({ error: error.error }, { status: error.status });
      }
    }

    if (body.followUpDate !== undefined || body.interviewDate !== undefined) {
      const datesResult = await container.applicationUseCase.updateDates(
        params.id,
        userId,
        {
          followUpDate: body.followUpDate as string | null | undefined,
          interviewDate: body.interviewDate as string | null | undefined,
        }
      );
      const error = handleResultError(datesResult);
      if (error) {
        return Response.json({ error: error.error, detail: error.detail }, { status: error.status });
      }
    }

    // Direct Prisma update for other remaining mutable fields (notes, booleans)
    const updateData: any = {};
    if (body.followUpDone !== undefined) updateData.followUpDone = Boolean(body.followUpDone);
    if (body.interviewDone !== undefined) updateData.interviewDone = Boolean(body.interviewDone);
    if (body.notes !== undefined) updateData.notes = String(body.notes);

    if (Object.keys(updateData).length > 0) {
      // Ensure the application belongs to the user before updating directly
      const existing = await prisma.application.findUnique({
        where: { id: params.id },
        select: { userId: true }
      });
      if (existing?.userId === userId) {
        await prisma.application.update({
          where: { id: params.id },
          data: updateData,
        });
      }
    }

    // Re-fetch and return the latest state
    const result = await container.applicationUseCase.getById(params.id, userId);
    const error = handleResultError(result);
    if (error) {
      return Response.json({ error: error.error }, { status: error.status });
    }

    return Response.json(result.value);
  } catch (error) {
    console.error("[api/applications/[id] PATCH] Error:", error);
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
 * DELETE /api/applications/[id]
 * - Delete application and its resume file if present
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();

    // Fetch first so we can clean up generated files
    const getResult = await container.applicationUseCase.getById(params.id, userId);
    if (Result.isFailure(getResult)) {
      const error = getResult.error;
      if (error.name === "NotFoundError") {
        return Response.json({ error: error.message }, { status: 404 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    const application = getResult.value;

    // Delete resume files directory if it exists
    if (application.generationStatus === "completed" && application.resumeFinalPath) {
      const appDir = path.join(
        process.cwd(),
        "public",
        "resumes",
        params.id
      );
      if (fs.existsSync(appDir)) {
        fs.rmSync(appDir, { recursive: true, force: true });
      }
    }

    const result = await container.applicationUseCase.delete(params.id, userId);
    const error = handleResultError(result);
    if (error) {
      return Response.json({ error: error.error }, { status: error.status });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[api/applications/[id] DELETE] Error:", error);
    return Response.json(
      {
        error: "Internal server error",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}