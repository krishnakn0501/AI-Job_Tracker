import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";

export async function POST(request: Request) {
  try {
    const userId = getUserId(request);
    const { category, message } = await request.json();

    if (!category || !message?.trim()) {
      return Response.json({ error: "Category and message are required" }, { status: 400 });
    }

    const query = await prisma.supportQuery.create({
      data: { userId, category, message, status: "open" },
    });
    return Response.json(query, { status: 201 });
  } catch (error) {
    console.error("[api/support-queries POST] Error:", error);
    return Response.json({ error: "Submission failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const userId = getUserId(request);
    const queries = await prisma.supportQuery.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(queries);
  } catch (error) {
    console.error("[api/support-queries GET] Error:", error);
    return Response.json({ error: "Fetch failed" }, { status: 500 });
  }
}