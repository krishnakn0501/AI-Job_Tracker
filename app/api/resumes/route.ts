import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";

/**
 * GET /api/resumes
 * - List all base resumes for the authenticated user, including which
 *   applications were generated from each one.
 */
export async function GET(request: Request) {
  try {
    const userId = getUserId(request);
    const resumes = await prisma.resumeBase.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        applications: {
          select: { id: true, company: true, role: true, status: true },
        },
      },
    });
    return Response.json(resumes);
  } catch (error) {
    console.error("[api/resumes GET] Error:", error);
    return Response.json({ error: "Fetch failed" }, { status: 500 });
  }
}
