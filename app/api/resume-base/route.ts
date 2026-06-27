import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";

/**
 * GET /api/resume-base
 * - Returns the stored base resume content (singleton).
 * - Returns 404 if no resume has been uploaded yet.
 */
export async function GET(request: Request) {
  try {
    const userId = getUserId(request);
    const resumeBases = await prisma.resumeBase.findMany({
      where: { userId },
    });

    if (!resumeBases || resumeBases.length === 0) {
      return Response.json(
        { error: "No resume uploaded yet" },
        { status: 404 }
      );
    }

    // Return the first resume base for backward compatibility
    // S9 will implement proper multi-resume selection
    return Response.json({
      fileId: resumeBases[0].fileId,
      filename: resumeBases[0].filename,
      updatedAt: resumeBases[0].updatedAt,
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