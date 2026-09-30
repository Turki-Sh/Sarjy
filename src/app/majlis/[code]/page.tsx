// A Majlis: the voice screen, joined to other people (architecture, section 13). The link is the
// invite, so its preview says whose Majlis it is and shows the Majlis card. Link-only: noindex.

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { VoiceScreen } from "@/client/ui/VoiceScreen";
import { getDb } from "@/server/db/client";
import { readPreferences } from "@/server/preferences";
import { roomByCode } from "@/server/rooms/access";
import { isMember, listMembers } from "@/server/rooms/rooms";
import { SESSION_COOKIE, verifyCookie } from "@/server/session";
import { t } from "@/shared/i18n";
import { cardImage, pickCard } from "@/shared/og";

type Props = { params: Promise<{ code: string }> };

/** The room behind the link, with its host's name and who has come in. Never creates a visitor. */
async function load(code: string) {
  const db = await getDb();
  const room = await roomByCode(db, code.toUpperCase());
  if (!room) return null;
  const members = await listMembers(db, room);
  return { db, room, members, hostName: members.find((m) => m.host)?.name ?? null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const found = await load(code);
  const { lang } = await readPreferences();
  const s = t(lang).majlis;
  const title = found ? s.inviteText(found.hostName) : s.missing;
  const description = s.joinHint;
  const card = cardImage(pickCard("majlis", lang, code));
  return {
    title,
    description,
    // Shared on purpose, never meant to be found.
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "website", images: [card], url: `/majlis/${code}` },
    twitter: { card: "summary_large_image", title, description, images: [card] },
  };
}

export default async function MajlisPage({ params }: Props) {
  const { code } = await params;
  const { lang, langChoice, themeChoice, sidebarOpen, glass, wallpaper } = await readPreferences();
  const found = await load(code);
  const me = verifyCookie((await cookies()).get(SESSION_COOKIE)?.value);
  const member = !!found && !!me && (await isMember(found.db, found.room.id, me));
  return (
    <VoiceScreen
      initialLang={lang}
      initialLangChoice={langChoice}
      initialThemeChoice={themeChoice}
      initialSidebarOpen={sidebarOpen}
      initialGlass={glass}
      initialWallpaper={wallpaper}
      room={{
        code: found?.room.code ?? code,
        hostName: found?.hostName ?? null,
        people: found?.members.length ?? 0,
        member,
        phase: !found ? "missing" : found.room.endedAt ? "ended" : "door",
      }}
    />
  );
}
