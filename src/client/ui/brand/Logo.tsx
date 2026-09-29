// The Sarjy marks, drawn from the brand's path data. Color comes from `currentColor`,
// which the stylesheet sets to --mark (Saddle Green in light, Frost in dark). The logo never mirrors:
// SVG coordinates ignore text direction, so the marks draw the same way in an Arabic layout.

import { ARABIC_WORDMARK_PATH, SYMBOL_PATH, WORDMARK_PATHS } from "@/shared/brand/marks";

type MarkProps = { className?: string; title?: string };

/** The symbol alone: icons, avatars, the orb. */
export function SymbolMark({ className, title }: MarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 224 152"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path fill="currentColor" d={SYMBOL_PATH} />
    </svg>
  );
}

/** Symbol and Latin wordmark, the primary lockup. Geometry from the visual identity (section 1). */
export function LogoCombined({ className, title = "Sarjy" }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 538 166" role="img" aria-label={title}>
      <g transform="translate(2 15) scale(.7)">
        <path fill="currentColor" d={SYMBOL_PATH} />
      </g>
      <g transform="translate(182 12)" fill="currentColor">
        {WORDMARK_PATHS.map((d) => (
          <path key={d.slice(0, 24)} d={d} />
        ))}
      </g>
    </svg>
  );
}

/** Arabic wordmark with the symbol at the reading start (the right). The symbol is not mirrored. */
export function LogoCombinedArabic({ className, title = "سرجي" }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 442.7 166" role="img" aria-label={title}>
      <path fill="currentColor" transform="translate(7.31 81.62)" d={ARABIC_WORDMARK_PATH} />
      <g fill="currentColor" transform="translate(283.04 15) scale(.7)">
        <path d={SYMBOL_PATH} />
      </g>
    </svg>
  );
}

/** The lockup for the interface language. */
export function Logo({ lang, className }: { lang: "en" | "ar"; className?: string }) {
  return lang === "ar" ? (
    <LogoCombinedArabic className={className} />
  ) : (
    <LogoCombined className={className} />
  );
}
