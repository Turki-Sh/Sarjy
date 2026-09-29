// Interface icons from the brand sprite (24 grid, 1.75 stroke). Decorative by default:
// the button that holds an icon carries the accessible name.

import { ICONS, type IconName } from "@/shared/brand/icons";

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
