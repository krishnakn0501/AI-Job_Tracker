export const dynamic = 'force-dynamic';

import { getUserId } from "@/shared/middleware/getUserId";
import { uploadResumeFileS3 } from "@/infrastructure/external-api/S3Client";
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

/**
 * POST /api/upload-resume
 * - Upload a resume file and create a ResumeBase record.
 */
export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const label =
      (formData.get("label") as string)?.trim() || file?.name || "Untitled";

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

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
    // Upload to Supabase S3 instead of Anthropic
    const { fileUrl, fileId } = await uploadResumeFileS3(buffer, file.name, file.type, userId);

    const result = await container.resumeUseCase.create(
      {
        fileId: fileUrl, // Save the Supabase public URL in fileId so n8n can easily download it
        filename: file.name,
        label: resumeLabel,
      },
      userId
    );

    const error = handleResultError(result);
    if (error) {
      return Response.json({ error: error.error }, { status: error.status });
    }

    if (!Result.isSuccess(result)) {
      return Response.json({ error: "Unexpected error" }, { status: 500 });
    }

    return Response.json({
      success: true,
      id: result.value.id,
      fileId: result.value.fileId,
      filename: result.value.filename,
      label: result.value.label,
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