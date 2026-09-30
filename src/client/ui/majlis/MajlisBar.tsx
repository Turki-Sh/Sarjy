"use client";

// The Majlis bar, at the top of the voice area: whose Majlis this is, everyone in it (each in their
// seat's color, dimmed when not connected, ringed while they hold the mic), a way to invite, and a
// way out. The host can end it for everyone.

import type { Lang } from "@/shared/i18n";
import { t } from "@/shared/i18n";
import type { Member } from "@/shared/room";
import { Icon } from "../Icon";
import { Menu } from "../Menu";
import styles from "./Majlis.module.css";
import { seatStyle } from "./seat";

type Props = {
  lang: Lang;
  hostName: string | null;
  members: Member[];
  online: string[];
  floor: string | null;
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
  floor,
  me,
  reconnecting,
  onInvite,
  onLeave,
  onEnd,
}: Props) {
  const s = t(lang).majlis;
  const isHost = members.some((m) => m.id === me && m.host);
  const nameOf = (m: Member) => (m.id === me ? s.you : (m.name ?? s.guest(m.seat)));
  const here = members.filter((m) => online.includes(m.id)).length || 1;

  return (
    <div className={`${styles.bar} glass text`} role="group" aria-label={s.name(hostName)}>
      <Icon name="finjan" className={styles.mark} />
      <span className={styles.title}>{s.name(hostName)}</span>
      <ul className={styles.people} aria-label={s.people}>
        {members.map((m) => (
          <li
            key={m.id}
            className={styles.person}
            style={seatStyle(m.seat)}
            data-online={online.includes(m.id) || m.id === me || undefined}
            data-floor={floor === m.id || undefined}
            title={floor === m.id ? s.holding(nameOf(m)) : nameOf(m)}
          >
            {(m.name ?? s.guest(m.seat)).slice(0, 1).toUpperCase()}
            <span className="sr-only">{floor === m.id ? s.holding(nameOf(m)) : nameOf(m)}</span>
          </li>
        ))}
      </ul>
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
