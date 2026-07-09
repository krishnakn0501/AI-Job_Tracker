export const dynamic = 'force-dynamic';

import { cookies } from "next/headers";
import { container } from "@/infrastructure/container";
import { Result } from "@/shared/types/Result";

function handleResultError<T>(
  result: Result<T, Error>
): { error: string; detail?: string; status: number } | null {
  if (Result.isFailure(result)) {
    const error = result.error;
    if (error.name === "UnauthorizedError") {
      return { error: error.message, status: 401 };
    }
    if (error.name === "ForbiddenError") {
      return { error: error.message, status: 403 };
    }
    if (error.name === "ValidationError") {
      return { error: error.message, detail: error.message, status: 400 };
    }
    return { error: error.message, status: 500 };
  }
  return null;
}

/**
 * POST /api/auth/login
 * - Authenticate user and set session cookies.
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const result = await container.authUseCase.login(email, password);
    const error = handleResultError(result);
    if (error) {
      return Response.json(
        { error: error.error, detail: error.detail },
        { status: error.status }
      );
    }

    if (!Result.isSuccess(result)) {
      return Response.json({ error: "Unexpected error" }, { status: 500 });
    }

    const { accessToken, refreshToken, isAdmin } = result.value;

    cookies().set("jobtrack_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    cookies().set("jobtrack_refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return Response.json({
      success: true,
      isAdmin,
    });
  } catch (error) {
    console.error("[api/auth/login] Error:", error);
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}