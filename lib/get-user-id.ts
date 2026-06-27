export function getUserId(request: Request): string {
  const userId = request.headers.get("x-user-id");
  if (!userId) throw new Error("Missing user context — middleware should have set this");
  return userId;
}