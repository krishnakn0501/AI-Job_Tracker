export const dynamic = 'force-dynamic';

import { getUserId } from "@/shared/middleware/getUserId";
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
 * GET /api/user/settings
 * - Get current user settings
 */
export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const result = await container.userUseCase.getById(userId);

    const error = handleResultError(result);
    if (error) {
      return Response.json({ error: error.error }, { status: error.status });
    }

    return Response.json(result.value);
  } catch (error) {
    console.error("[api/user/settings GET] Error:", error);
    return Response.json({ error: "Fetch failed" }, { status: 500 });
  }
}

/**
 * PATCH /api/user/settings
 * - Update user profile settings
 */
export async function PATCH(request: Request) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    const result = await container.userUseCase.updateProfile(userId, {
      theme: body.theme,
      username: body.username,
      dob: body.dob,
      country: body.country,
      mobile: body.mobile,
    });

    const error = handleResultError(result);
    if (error) {
      return Response.json({ error: error.error }, { status: error.status });
    }

    return Response.json(result.value);
  } catch (error) {
    console.error("[api/user/settings PATCH] Error:", error);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}