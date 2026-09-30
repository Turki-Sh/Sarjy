"use client";

// A small menu behind a "⋯" button, like the chat menu in ChatGPT and Claude. It opens in a fixed
// layer measured from the button, so a scrolling sidebar can't clip it, and behaves like a menu:
// arrows move, Enter picks, Escape or a click elsewhere closes, and focus returns to the button.
// An item marked `confirm` asks once more in place (used by Delete), instead of a separate dialog.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { IconName } from "@/shared/brand/icons";
import { Icon } from "./Icon";
import styles from "./Menu.module.css";

export type MenuItem = {
  id: string;
  label: string;
  icon: IconName;
  onSelect: () => void;
  /** Red, for destructive actions. */
  danger?: boolean;
  /** Asks again in place ("Delete for good?") before doing it. */
  confirm?: string;
};

type Props = { label: string; items: MenuItem[]; className?: string };

export function Menu({ label, items, className }: Props) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  const close = (refocus = true) => {
    setOpen(false);
    setConfirming(null);
    if (refocus) button.current?.focus();
  };

  // Place the menu under the button, kept inside the window, before it paints.
  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const r = button.current.getBoundingClientRect();
    const width = 200;
    const rtl = document.documentElement.dir === "rtl";
    const left = rtl ? r.left : r.right - width;
    setAt({ top: r.bottom + 6, left: Math.max(8, Math.min(left, window.innerWidth - width - 8)) });
  }, [open]);

  // Focus the first item once shown; close on a click elsewhere, on scroll, or on resize.
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const away = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node))
        close(false);
    };
    const shut = () => close(false);
    document.addEventListener("pointerdown", away);
    window.addEventListener("resize", shut);
    window.addEventListener("scroll", shut, true);
    return () => {
      document.removeEventListener("pointerdown", away);
      window.removeEventListener("resize", shut);
      window.removeEventListener("scroll", shut, true);
    };
  }, [open, at]);

  const move = (step: number) => {
    const all = [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const i = all.indexOf(document.activeElement as HTMLElement);
    all[(i + step + all.length) % all.length]?.focus();
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        className={className}
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          if (open) close();
          else setOpen(true);
        }}
      >
        <Icon name="more" />
      </button>
      {/* On the page's body: inside anything glass (backdrop-filter), a fixed menu would be placed
          relative to that box instead of the window. */}
      {open &&
        at &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            aria-label={label}
            className={`${styles.menu} glass`}
            style={{ top: at.top, left: at.left }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") move(1);
              else if (e.key === "ArrowUp") move(-1);
              else if (e.key === "Escape") close();
              else if (e.key === "Tab") close(false);
              else return;
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {items.map((item, i) => {
              const asking = confirming === item.id;
              return (
                <div key={item.id} className={styles.group}>
                  {item.danger && i > 0 && <hr className={styles.rule} />}
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.item}
                    data-danger={item.danger || undefined}
                    data-asking={asking || undefined}
                    onClick={() => {
                      if (item.confirm && !asking) return setConfirming(item.id);
                      close();
                      item.onSelect();
                    }}
                  >
                    <Icon name={item.icon} />
                    {asking ? item.confirm : item.label}
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
