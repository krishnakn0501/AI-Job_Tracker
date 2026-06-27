export const dynamic = 'force-dynamic';

import { cookies } from "next/headers";

export async function POST() {
  cookies().delete("jobtrack_session");
  return Response.json({ success: true });
}