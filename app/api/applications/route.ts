import { prisma } from "@/lib/prisma";
import { triggerResumeGeneration } from "@/lib/n8n";
import { getUserId } from "@/lib/get-user-id";
import type { Prisma } from "@prisma/client";

/**
 * GET /api/applications
 * - List all applications with optional status filter and text search
 * Query params: ?status=Interview&search=google
 */
export async function GET(request: Request) {
  try {
    const userId = getUserId(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Prisma.ApplicationWhereInput = { userId };
    if (status) where.status = status;
    if (search)
      where.OR = [
        { company: { contains: search, mode: "insensitive" } },
        { role: { contains: search, mode: "insensitive" } },
      ];

    const applications = await prisma.application.findMany({
      where,
      orderBy: { appliedDate: "desc" },
    });

    return Response.json(applications);
  } catch (error) {
    console.error("[api/applications] Error:", error);
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
    const userId = getUserId(request);
    const body = await request.json();

    // Validate required fields
    if (!body.company || !body.role) {
      return Response.json(
        { error: "company and role are required" },
        { status: 400 }
      );
    }

    // S9: require resumeBaseId — a resume must be selected
    if (!body.resumeBaseId) {
      return Response.json({ error: "A resume must be selected" }, { status: 400 });
    }

    const resumeBase = await prisma.resumeBase.findFirst({
      where: { id: body.resumeBaseId, userId },
    });
    if (!resumeBase) {
      return Response.json({ error: "Selected resume not found" }, { status: 400 });
    }

    const application = await prisma.application.create({
      data: {
        userId,
        resumeBaseId: resumeBase.id,
        company: body.company,
        role: body.role,
        jdText: body.jdText ?? null,
        jdUrl: body.jdUrl ?? null,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        interviewDate: body.interviewDate ? new Date(body.interviewDate) : null,
        notes: body.notes ?? null,
        status: body.status ?? "Applied",
        generationStatus: "generating",
      },
    });

    // Trigger n8n with all details including file_id and userId
    void triggerResumeGeneration({
      applicationId: application.id,
      company: body.company,
      role: body.role,
      jdText: body.jdText ?? "",
      fileId: resumeBase.fileId,
      userId,
    }).catch((e) => console.error("n8n trigger failed:", e));

    return Response.json(application, { status: 201 });
  } catch (error) {
    console.error("[api/applications] Error:", error);
    return Response.json(
      {
        error: "Internal server error",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}