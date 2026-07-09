export const dynamic = 'force-dynamic';

import { cookies } from "next/headers";

export async function POST() {
  cookies().delete("jobtrack_access_token");
  cookies().delete("jobtrack_refresh_token");
  return Response.json({ success: true });
}