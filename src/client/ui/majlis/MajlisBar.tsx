"use client";

// The Majlis bar, at the top of the voice area: whose Majlis this is, how many are here, a way to
// invite, and a way out. The host can end it for everyone. The people themselves sit around the
// finjan (MajlisSeats.tsx).

import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import type { Member } from "@/shared/room";
import { Icon } from "../Icon";
import { Menu } from "../Menu";
import styles from "./Majlis.module.css";

type Props = {
  lang: Lang;
  hostName: string | null;
  members: Member[];
  online: string[];
  me: string;
  reconnecting: boolean;
  onInvite: () => void;
  onLeave: () => void;
  onEnd: () => void;
};

export function MajlisBar({
  lang,
  hostName,
  members,
  online,
  me,
  reconnecting,
  onInvite,
  onLeave,
  onEnd,
}: Props) {
  const s = t(lang).majlis;
  const isHost = members.some((m) => m.id === me && m.host);
  const here = members.filter((m) => online.includes(m.id)).length || 1;

  return (
    <div className={`${styles.bar} glass text`} role="group" aria-label={s.name(hostName)}>
      <Icon name="finjan" className={styles.mark} />
      <span className={styles.title}>{s.name(hostName)}</span>
      <span className={styles.count} aria-live="polite">
        {reconnecting ? s.reconnecting : s.here(here)}
      </span>
      <button type="button" className={styles.invite} onClick={onInvite}>
        <Icon name="share" />
        {s.invite}
      </button>
      <Menu
        className={styles.more}
        label={s.people}
        items={[
          { id: "leave", label: s.leave, icon: "x", onSelect: onLeave },
          ...(isHost
            ? [
                {
                  id: "end",
                  label: s.end,
                  icon: "trash" as const,
                  danger: true,
                  confirm: s.endConfirm,
                  onSelect: onEnd,
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
