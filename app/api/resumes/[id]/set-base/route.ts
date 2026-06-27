import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";

/**
 * POST /api/resumes/[id]/set-base
 * - Set a specific resume as the user's default base resume.
 * - Atomically sets all other resumes to isBase: false.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = getUserId(request);

    const existing = await prisma.resumeBase.findFirst({ where: { id: params.id, userId } });
    if (!existing) return Response.json({ error: "Resume not found" }, { status: 404 });

    await prisma.$transaction([
      prisma.resumeBase.updateMany({ where: { userId }, data: { isBase: false } }),
      prisma.resumeBase.update({ where: { id: params.id }, data: { isBase: true } }),
    ]);

    return Response.json({ success: true });
  } catch (error) {
    console.error("[api/resumes/:id/set-base POST] Error:", error);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}
