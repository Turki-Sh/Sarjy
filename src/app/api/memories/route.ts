// GET: the caller's memories (the stitched list).

import { currentUser, json } from "@/server/http";
import { listMemories } from "@/server/memory/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const { db, user } = await currentUser();
  return json({ memories: await listMemories(db, user.id) });
}
