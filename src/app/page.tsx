// The home page: what Sarjy is, with the Rafeeqs, and the way into the voice screen (/talk).
// The server passes the language and, for someone Sarjy already knows, their name and Rafeeq.

import { Home } from "@/client/ui/home/Home";
import { readPreferences } from "@/server/preferences";
import { readVisitor } from "@/server/visitor";

export default async function HomePage() {
  const [{ lang }, visitor] = await Promise.all([readPreferences(), readVisitor()]);
  return <Home lang={lang} visitor={visitor} />;
}
