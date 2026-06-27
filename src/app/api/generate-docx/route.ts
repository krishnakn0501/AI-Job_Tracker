export const dynamic = 'force-dynamic';

import { markdownToDocx, saveDocx } from "@/infrastructure/document/MarkdownDocx";
import { getUserId } from "@/shared/middleware/getUserId";
import path from "path";

/**
 * POST /api/generate-docx
 * - Called by n8n after Claude generates tailored resume + cover letter markdown.
 * - Requires x-api-key header auth (shared secret with n8n).
 * - Generates 4 docx files: resume-review, resume-final, cover-letter-review, cover-letter-final.
 */
export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.N8N_API_KEY) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      application_id,
      resume_markdown,
      cover_letter_markdown,
      role_title_changed,
      role_title_note,
      userId, // NEW parameter for S7 - passed from n8n
    } = body;

    if (!application_id || !resume_markdown || !cover_letter_markdown) {
      return Response.json(
        {
          error:
            "application_id, resume_markdown, and cover_letter_markdown are required",
        },
        { status: 400 }
      );
    }

    // If userId is provided (from n8n), verify the application belongs to this user
    // This is a security measure to ensure n8n is only updating applications for the correct user
    if (userId) {
      // In a real implementation, we would verify the application belongs to userId
      // For now, we'll just log it for debugging
      console.log(`[api/generate-docx] Processing for userId: ${userId}`);
    }

    const paths = {
      resumeReviewPath: `/resumes/${application_id}/resume-review.docx`,
      resumeFinalPath: `/resumes/${application_id}/resume-final.docx`,
      coverLetterReviewPath: `/resumes/${application_id}/cover-letter-review.docx`,
      coverLetterFinalPath: `/resumes/${application_id}/cover-letter-final.docx`,
    };

    const resumeReviewDoc = markdownToDocx(resume_markdown, "review");
    const resumeFinalDoc = markdownToDocx(resume_markdown, "final");
    const coverReviewDoc = markdownToDocx(cover_letter_markdown, "review");
    const coverFinalDoc = markdownToDocx(cover_letter_markdown, "final");

    await Promise.all([
      saveDocx(
        resumeReviewDoc,
        path.join(process.cwd(), "public", paths.resumeReviewPath)
      ),
      saveDocx(
        resumeFinalDoc,
        path.join(process.cwd(), "public", paths.resumeFinalPath)
      ),
      saveDocx(
        coverReviewDoc,
        path.join(
          process.cwd(),
          "public",
          paths.coverLetterReviewPath
        )
      ),
      saveDocx(
        coverFinalDoc,
        path.join(process.cwd(), "public", paths.coverLetterFinalPath)
      ),
    ]);

    return Response.json({
      ...paths,
      application_id,
      role_title_changed: !!role_title_changed,
      role_title_note: role_title_note ?? null,
    });
  } catch (error) {
    console.error("[api/generate-docx] Error:", error);
    return Response.json(
      {
        error: "Generation failed",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}