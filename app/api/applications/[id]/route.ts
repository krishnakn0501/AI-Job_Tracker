import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { isValidTransition, TERMINAL_STATUSES_CLEARING_FOLLOWUP } from "@/lib/status-rules";
import fs from "fs";
import path from "path";

/**
 * GET /api/applications/[id]
 * - Get a single application by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId(request);
    const application = await prisma.application.findUnique({
      where: { id: params.id, userId },
    });

    if (!application) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }

    return Response.json(application);
  } catch (error) {
    // Prisma throws for invalid CUID/UUID format — treat as not found
    if (
      error instanceof Error &&
      (error.message.includes("Argument") ||
        error.message.includes("Malformed") ||
        error.message.includes("Invalid"))
    ) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }
    console.error("[api/applications/[id]] Error:", error);
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
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId(request);
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // Empty or invalid JSON body — treat as no updates
      return Response.json({ error: "Invalid or empty request body" }, { status: 400 });
    }

    const existing = await prisma.application.findFirst({ where: { id: params.id, userId } });
    if (!existing) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }

    // If this PATCH includes a status change, validate it against the state machine
    if (body.status && typeof body.status === 'string' && body.status !== existing.status) {
      if (!isValidTransition(existing.status, body.status)) {
        return Response.json(
          {
            error: "Invalid status transition",
            detail: `Cannot move from "${existing.status}" to "${body.status}"`,
          },
          { status: 400 }
        );
      }
      // Auto-clear followUpDate when moving into a terminal status
      if (TERMINAL_STATUSES_CLEARING_FOLLOWUP.includes(body.status)) {
        body.followUpDate = null;
      }
    }

    const allowed = [
      "company",
      "role",
      "jdText",
      "jdUrl",
      "status",
      "followUpDate",
      "interviewDate",
      "generationStatus",
      "resumeMarkdown",
      "coverLetterMarkdown",
      "resumeReviewPath",
      "resumeFinalPath",
      "coverLetterReviewPath",
      "coverLetterFinalPath",
      "roleTitleChanged",
      "roleTitleNote",
      "notes",
    ];

    // Filter body to only allowed fields
    const updateData: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) {
        // Convert date strings to Date objects for date fields
        if (
          (key === "followUpDate" || key === "interviewDate") &&
          body[key] !== null
        ) {
          updateData[key] = new Date(body[key] as string);
        } else {
          updateData[key] = body[key];
        }
      }
    }

    const application = await prisma.application.update({
      where: { id: params.id, userId },
      data: updateData,
    });

    return Response.json(application);
  } catch (error) {
    // Prisma throws for invalid CUID/UUID or record not found
    if (
      error instanceof Error &&
      (error.message.includes("Argument") ||
        error.message.includes("Malformed") ||
        error.message.includes("Invalid") ||
        error.message.includes("Record to update not found"))
    ) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }
    console.error("[api/applications/[id]] Error:", error);
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
    const userId = getUserId(request);
    const application = await prisma.application.findUnique({
      where: { id: params.id, userId },
    });

    if (!application) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }

    // Delete resume files directory if it exists
    if (application.generationStatus === "ready") {
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

    await prisma.application.delete({
      where: { id: params.id, userId },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    // Prisma throws for invalid CUID/UUID or record not found
    if (
      error instanceof Error &&
      (error.message.includes("Argument") ||
        error.message.includes("Malformed") ||
        error.message.includes("Invalid") ||
        error.message.includes("Record to delete does not exist"))
    ) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }
    console.error("[api/applications/[id]] Error:", error);
    return Response.json(
      {
        error: "Internal server error",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}