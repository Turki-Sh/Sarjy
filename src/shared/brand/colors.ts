// Brand colors for places CSS cannot reach: generated images (link previews, app icons) and the manifest.
// tokens.css stays the source of truth; tests/unit/colors.test.ts fails if these ever drift from it.

export const COLORS = {
  white: "#FFFFFF",
  snow: "#FAFAFA",
  hairline: "#EAEAEA",
  graphite: "#6B6B6B",
  ink: "#111111",
  night: "#111111",
  saddle: "#273B35",
  saffron: "#E3A72F",
  coral: "#E47458",
  dusk: "#835298",
} as const;
