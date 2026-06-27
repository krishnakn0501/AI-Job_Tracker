import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";

export async function PATCH(request: Request) {
  try {
    const userId = getUserId(request);
    const body = await request.json();

    const allowed = ["theme", "username", "dob", "country", "mobile"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }
    if (data.dob) data.dob = new Date(data.dob as string);

    const updated = await prisma.user.update({ where: { id: userId }, data });
    return Response.json({
      theme: updated.theme,
      username: updated.username,
      dob: updated.dob,
      country: updated.country,
      mobile: updated.mobile,
    });
  } catch (error) {
    console.error("[api/user/settings PATCH] Error:", error);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const userId = getUserId(request);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { theme: true, username: true, dob: true, country: true, mobile: true, email: true },
    });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    return Response.json(user);
  } catch (error) {
    console.error("[api/user/settings GET] Error:", error);
    return Response.json({ error: "Fetch failed" }, { status: 500 });
  }
}