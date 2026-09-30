// Interface icons from the visual identity sprite: 24 grid, 1.75 stroke, round caps and joins.
// Each value is the inner SVG markup for a 0 0 24 24 viewBox; the stroke style is set once, in Icon.tsx.

export const ICONS = {
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  sliders:
    '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.01"/>',
  chev: '<path d="M7 10l5 5 5-5"/>',
  share: '<path d="M12 4v11M8 8l4-4 4 4M5 13v6h14v-6"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.3-4.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chat: '<path d="M5 5h14v10H10l-5 4z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
  moon: '<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
  users:
    '<circle cx="9" cy="8.5" r="3.5"/><path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.8c1.5.7 2.6 2.3 3 4.7"/>',
  image:
    '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5-8 8.5"/>',
  send: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  pencil: '<path d="M14.5 5.5l4 4M4.5 19.5l1-4.5 10-10 3.5 3.5-10 10z"/>',
  keyboard:
    '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M7 10h.01M10.5 10h.01M14 10h.01M17 10h.01M8 14h8"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 19.5c.8-3.4 3.6-5.5 7-5.5s6.2 2.1 7 5.5"/>',
  palette:
    '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1 0 1.5-.7 1.5-1.4 0-.9-.7-1.2-.7-2 0-.9.7-1.5 1.6-1.5H16a4.5 4.5 0 0 0 4.5-4.5c0-4.3-3.8-7.6-8.5-7.6z"/><path d="M7.5 11.5h.01M9.5 7.5h.01M14.5 7.5h.01"/>',
  stitch: '<rect x="4" y="6" width="16" height="12" rx="2.5" stroke-dasharray="2.6 2.4"/>',
  upload: '<path d="M12 15V4M8 8l4-4 4 4M5 14v5h14v-5"/>',
  more: '<path d="M6 12h.01M12 12h.01M18 12h.01" stroke-width="2.6"/>',
  pin: '<path d="M9.5 4.5h5l-.8 5.2 3.3 3.3H7l3.3-3.3zM12 13v6.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  sidebar: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M9.5 4.5v15"/>',
} as const;

export type IconName = keyof typeof ICONS;
