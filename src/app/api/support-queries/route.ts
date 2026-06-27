export const dynamic = 'force-dynamic';

import { getUserId } from "@/shared/middleware/getUserId";
import { container } from "@/infrastructure/container";
import { Result } from "@/shared/types/Result";
import { SupportQueryCategoryDto } from "@/application/dtos/SupportQueryDto";

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
 * POST /api/support-queries
 * - Create a new support query
 */
export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const { category, message } = await request.json();

    if (!category || !message?.trim()) {
      return Response.json(
        { error: "Category and message are required" },
        { status: 400 }
      );
    }

    const result = await container.supportUseCase.create({
      userId,
      category: category as SupportQueryCategoryDto,
      message: message.trim(),
    });

    const error = handleResultError(result);
    if (error) {
      return Response.json({ error: error.error }, { status: error.status });
    }

    return Response.json(result.value, { status: 201 });
  } catch (error) {
    console.error("[api/support-queries POST] Error:", error);
    return Response.json({ error: "Submission failed" }, { status: 500 });
  }
}

/**
 * GET /api/support-queries
 * - List support queries for the authenticated user
 */
export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const result = await container.supportUseCase.getAll(userId);

    const error = handleResultError(result);
    if (error) {
      return Response.json({ error: error.error }, { status: error.status });
    }

    return Response.json(result.value);
  } catch (error) {
    console.error("[api/support-queries GET] Error:", error);
    return Response.json({ error: "Fetch failed" }, { status: 500 });
  }
}