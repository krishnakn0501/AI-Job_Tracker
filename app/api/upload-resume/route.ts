import { prisma } from "@/lib/prisma";
import { uploadResumeFile } from "@/lib/anthropic-files";
import { getUserId } from "@/lib/get-user-id";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const userId = getUserId(request);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const label = (formData.get("label") as string)?.trim() || file?.name || "Untitled";

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Ensure label is always a non-empty string
    const resumeLabel = label.trim() || file.name;

    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      return Response.json(
        { error: "File must be PDF or .docx" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const { fileId } = await uploadResumeFile(
      buffer,
      file.name,
      file.type
    );

    // First-ever resume for this user is automatically set as base
    const isFirstResume = (await prisma.resumeBase.count({ where: { userId } })) === 0;

    const resumeBase = await prisma.resumeBase.create({
      data: {
        userId,
        fileId,
        filename: file.name,
        label: resumeLabel,
        isBase: isFirstResume,
      },
    });

    return Response.json({
      success: true,
      id: resumeBase.id,
      fileId,
      filename: file.name,
      label: resumeLabel,
    });
  } catch (error) {
    console.error("[api/upload-resume] Error:", error);
    return Response.json(
      {
        error: "Upload failed",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}