export const dynamic = 'force-dynamic';

import { getUserId } from "@/shared/middleware/getUserId";
import { prisma } from "@/infrastructure/persistence/prisma/PrismaClient";
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
 * GET /api/resumes
 * - List all base resumes for the authenticated user.
 */
export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    // Use Prisma directly to include applications (bypass Domain just for Read-model optimization)
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