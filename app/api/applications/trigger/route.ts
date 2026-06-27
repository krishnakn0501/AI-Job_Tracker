import { prisma } from "@/lib/prisma";
import { triggerResumeGeneration } from "@/lib/n8n";
import { getUserId } from "@/lib/get-user-id";

/**
 * POST /api/applications/trigger
 * - Re-trigger n8n resume generation for a specific application
 * Used by detail page to re-generate resumes
 */
export async function POST(request: Request) {
  try {
    const userId = getUserId(request);
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

    // Fetch the application + resume base in parallel
    const [application, resumeBases] = await Promise.all([
      prisma.application.findUnique({
        where: { id: body.id as string, userId },
      }),
      prisma.resumeBase.findMany({
        where: { userId },
      }),
    ]);

    if (!application) {
      return Response.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

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