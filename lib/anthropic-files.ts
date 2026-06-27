import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Upload a resume file (PDF or DOCX) to Anthropic's Files API.
 * The SDK automatically adds the files-api-2025-04-14 beta header
 * when calling through the beta.files namespace.
 */
export async function uploadResumeFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ fileId: string }> {
  const uploaded = await anthropic.beta.files.upload({
    file: await Anthropic.toFile(buffer, filename, { type: mimeType }),
  });
  return { fileId: uploaded.id };
}

/**
 * Delete a file from Anthropic's Files API.
 * Non-fatal on failure — logs a warning instead of throwing.
 */
export async function deleteResumeFile(fileId: string): Promise<void> {
  try {
    await anthropic.beta.files.delete(fileId);
  } catch (e) {
    console.warn("[anthropic-files] delete failed (non-fatal):", e);
  }
}
