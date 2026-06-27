import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";
import { startOfDay, endOfDay, addDays } from "date-fns";

/**
 * GET /api/reminders
 * - Returns applications where follow-up is due today OR interview is tomorrow.
 */
export async function GET(request: Request) {
  try {
    const userId = getUserId(request);
    const today = new Date();
    const tomorrow = addDays(today, 1);

    const results = await prisma.application.findMany({
      where: {
        userId,
        OR: [
          {
            followUpDate: { gte: startOfDay(today), lte: endOfDay(today) },
          },
          {
            interviewDate: {
              gte: startOfDay(tomorrow),
              lte: endOfDay(tomorrow),
            },
          },
        ],
        status: { not: "Rejected" },
      },
      orderBy: { followUpDate: "asc" },
      select: {
        id: true,
        company: true,
        role: true,
        status: true,
        followUpDate: true,
        interviewDate: true,
      },
    });

    // Add a "type" field to each result
    const reminders = results.map((r) => ({
      ...r,
      type: r.followUpDate ? "follow_up" : "interview",
    }));

    return Response.json(reminders);
  } catch (error) {
    console.error("[api/reminders] Error:", error);
    return Response.json(
      {
        error: "Internal server error",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}