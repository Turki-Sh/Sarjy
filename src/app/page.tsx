// The home page: what Sarjy is, with the Rafeeqs, and the way into the voice screen (/talk).
// The server passes the language and, for someone Sarjy already knows, their name and Rafeeq.

import { DAYLIGHT_SCRIPT } from "@/shared/daylight";
import { Home } from "@/client/ui/home/Home";
import { readPreferences } from "@/server/preferences";
import { readVisitor } from "@/server/visitor";

export default async function HomePage() {
  const [{ lang }, visitor] = await Promise.all([readPreferences(), readVisitor()]);
  return (
    <>
      {/* Day or night by your clock (or your recent choice), set before the page paints. */}
      <script dangerouslySetInnerHTML={{ __html: DAYLIGHT_SCRIPT }} />
      <Home lang={lang} visitor={visitor} />
    </>
  );
}
