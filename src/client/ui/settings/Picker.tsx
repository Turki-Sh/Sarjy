"use client";

// A dropdown in the style of the rest of Settings (a glass list with a check on the current
// choice), instead of the browser's own <select> menu, which can't be styled. It behaves like a
// listbox: arrows move, Enter or a click picks, Escape or a click outside closes. Escape closes
// only the menu, never the settings popup around it.

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "../Icon";
import styles from "./Picker.module.css";

/** Fired when Escape closes a menu, so the dialog around it can ignore that same Escape. */
export const MENU_ESCAPE = "sarjy:menu-escape";

export type PickerOption<T extends string> = { value: T; label: string; lang?: string };

type Props<T extends string> = {
  label: string;
  value: T;
  options: PickerOption<T>[];
  onChange: (value: T) => void;
};

export function Picker<T extends string>({ label, value, options, onChange }: Props<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value) ?? options[0]!;

  // A click anywhere else closes the menu.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const show = () => {
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    );
    setOpen(true);
    requestAnimationFrame(() => list.current?.focus());
  };
  const pick = (i: number) => {
    onChange(options[i]!.value);
    setOpen(false);
    root.current?.querySelector("button")?.focus();
  };

  return (
    <div
      ref={root}
      className={styles.picker}
      // Escape closes an open menu wherever the focus is inside the picker (the list, or the button
      // if it is pressed the instant the menu opens), and never the settings popup around it.
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !open) return;
        e.currentTarget.dispatchEvent(new Event(MENU_ESCAPE, { bubbles: true }));
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        root.current?.querySelector("button")?.focus();
      }}
    >
      <button
        type="button"
        className={styles.button}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current.label}`}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            show();
          }
        }}
      >
        <span lang={current.lang}>{current.label}</span>
        <Icon name="chev" />
      </button>
      {open && (
        <ul
          ref={list}
          id={id}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          aria-activedescendant={`${id}-${active}`}
          className={`${styles.menu} glass`}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((a) => Math.min(options.length - 1, a + 1));
            else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
            else if (e.key === "Home") setActive(0);
            else if (e.key === "End") setActive(options.length - 1);
            else if (e.key === "Enter" || e.key === " ") pick(active);
            else if (e.key === "Tab") setOpen(false);
            else return; // Escape is handled by the picker around the list
            // Handled here: keep the key from also scrolling or moving focus.
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={o.value === value}
              data-active={i === active || undefined}
              lang={o.lang}
              className={styles.option}
              onPointerEnter={() => setActive(i)}
              onClick={() => pick(i)}
            >
              {o.label}
              {o.value === value && <Icon name="check" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
