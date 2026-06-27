import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { deleteResumeFile } from "@/lib/anthropic-files";

/**
 * PATCH /api/resumes/[id]
 * - Update the label of a specific resume
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = getUserId(request);
    const { label } = await request.json();

    const existing = await prisma.resumeBase.findFirst({ where: { id: params.id, userId } });
    if (!existing) return Response.json({ error: "Resume not found" }, { status: 404 });

    if (!label?.trim()) {
      return Response.json({ error: "Label cannot be empty" }, { status: 400 });
    }

    const updated = await prisma.resumeBase.update({
      where: { id: params.id },
      data: { label: label.trim() },
    });
    return Response.json(updated);
  } catch (error) {
    console.error("[api/resumes/:id PATCH] Error:", error);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}

/**
 * DELETE /api/resumes/[id]
 * - Delete a resume and its file from Anthropic storage.
 * - If this was the base resume, promote the most recently created remaining one.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = getUserId(request);

    const existing = await prisma.resumeBase.findFirst({
      where: { id: params.id, userId },
      include: { applications: { select: { id: true } } },
    });
    if (!existing) return Response.json({ error: "Resume not found" }, { status: 404 });

    // Delete from Anthropic storage too
    await deleteResumeFile(existing.fileId);
    await prisma.resumeBase.delete({ where: { id: params.id } });

    // If this was the base resume, promote the most recently created remaining one
    if (existing.isBase) {
      const remaining = await prisma.resumeBase.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (remaining) {
        await prisma.resumeBase.update({ where: { id: remaining.id }, data: { isBase: true } });
      }
    }

    return Response.json({ success: true, deletedApplicationLinks: existing.applications.length });
  } catch (error) {
    console.error("[api/resumes/:id DELETE] Error:", error);
    return Response.json({ error: "Delete failed" }, { status: 500 });
  }
}
