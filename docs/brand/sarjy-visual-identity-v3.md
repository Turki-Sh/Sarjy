# Sarjy visual identity

Version 3, September 2026. Companion to the brand book (`sarjy-brand-v3.md`).

This file is the agent-readable twin of `sarjy-visual-identity-v3.html`. Both describe the same system. If they disagree, fix both in the same change.

What changed from version 2:
- White is pure white and dark is a true dark. The neutrals no longer carry a green tint.
- Green is reserved for elements, the way Spotify uses its green.
- Liquid glass is the material for everything that floats.
- Dark mode is an option, modeled on a dark voice-assistant reference.
- The docs themselves sit on a white page with hatched margins, after sarj.ai.

How Sarjy looks, how it moves, and how it shows what it is doing while you talk to it. White by default, dark on request, with liquid glass for everything that floats.

---

## 1. Logo

One continuous voice wave, shaped by the raised ends and low seat of a saddle. The wave is the voice. The seat is the place it keeps for you.

| Part | Meaning |
|---|---|
| Two raised ends | The pommel and cantle of the Arabian saddle, the high front and back that hold a rider in place |
| The seat | The low middle of the wave, where the rider sits |
| Start and end tips | The line starts and ends on the same rest line, so every word Sarjy says returns to calm |

### Files

All masters are in `sarjy-logo/`, drawn in Saddle Green `#273B35`. In code, set `fill="currentColor"` and color them with a token. Never retype either wordmark in a font.

| File | viewBox | Use |
|---|---|---|
| `Sarjy_Combined.svg` | `0 0 538 166` | Primary lockup: symbol and wordmark |
| `Sarjy_Symbol.svg` | `0 0 224 152` | Icons, avatars, the orb |
| `Sarjy_Wordmark.svg` | `0 0 365 166` | Where the symbol is already on screen |
| `Sarjy_Bilingual_Stacked.svg` | `0 0 362.2 281.8` | سرجي over sarjy. Covers, signage, title slides |
| `Sarjy_Bilingual_Horizontal.svg` | `0 0 838.1 166` | Symbol, sarjy, rule, سرجي. Headers and footers |
| `Sarjy_Combined_AR.svg` | `0 0 442.7 166` | سرجي with the symbol, for Arabic interfaces |
| `Sarjy_Wordmark_AR.svg` | `0 0 270.1 104.2` | Arabic wordmark alone |
| `Sarjy_Bilingual_Blueprint.svg` | `0 0 362.2 281.8` | The stitched outline. A brand graphic, not a logo |
| `Sarjy_Favicon.svg` | `0 0 256 256` | Favicon and app icon master |

Combined-lockup geometry: symbol at `translate(2 15) scale(.7)`, wordmark paths at `translate(182 12)`.

### Approved versions

| Version | Colors | Use |
|---|---|---|
| Primary | Saddle Green on White | First choice. The logo is the one place green is allowed to be large |
| Dark | Frost on Night | Dark UI. Saddle Green on Night is 1.6 : 1 and never used |
| One color | Black | Print, fax, stamps, embossing |
| Symbol alone | Any of the above | Icons, avatars, the orb |
| Wordmark alone | Any of the above | When the symbol is already visible |

### Clear space and minimum size

x is the x-height of the Latin wordmark, the height of the "a". Keep half of x clear on every side, measured from the dot of the j and the tails of the j and y. In the combined file's units, x = 80, so clear space = 40.

| Asset | Screen | Print |
|---|---|---|
| Symbol and wordmark | 28 px tall | 9 mm tall |
| Wordmark alone | 24 px tall | 8 mm tall |
| Bilingual, stacked | 56 px tall | 16 mm tall |
| Symbol alone | 16 px wide, inside the app tile | 6 mm wide |

### App icon and favicon

White symbol on a Saddle Green tile, corner radius 22.4%, symbol at 64% of the tile width, centered on the symbol's drawn bounds (`13 18 198 107` inside the 224 x 152 viewBox). Like Spotify, the app icon is the one filled block of brand green, so the icon is findable on any home screen.

### Misuse

- Don't stretch it.
- Don't recolor it. The logo is Saddle Green, Frost or black. Never an accent.
- Don't put Saddle Green on Night. Use Frost on dark surfaces.
- Don't tilt it. The rest line is level.
- Don't add effects. No shadows, bevels or glass on the mark itself. Glass holds the mark; it is never made of it.
- Don't mirror it for Arabic.

---

## 2. Arabic and English

Sarjy is one name in two scripts. The Arabic wordmark سرجي is set in Rubik and tuned to the same 13-unit stroke as the Latin, so the two words read as one family.

| Lockup | Build |
|---|---|
| Bilingual, stacked | Arabic cut at Rubik 430, 120.3 units, centered over the Latin wordmark, 24-unit gap |
| Bilingual, horizontal | The combined lockup, a 2-unit rule 12 units after it, then the Arabic cut at Rubik 500, 96.9 units, centered on the Latin x-height band |
| Arabic combined | Arabic word first, symbol at the reading start on the right, 34-unit gap. The symbol is not mirrored |
| Arabic wordmark | Rubik 500 at 96.9 units: 80 units tall with a 12.8-unit stroke |

All Arabic outlines are merged into single contours. Rubik is under the SIL Open Font License, which permits outlining it for a logo.

### The stitched outline

The bilingual wordmark drawn as dashed outlines with fine hatching, like a saddle pattern before it is cut, and like the hatched margins of the doc pages. A brand graphic for large, quiet moments: the back of a slide, a page footer, print. Never a logo, never small, never inside the product, where the stitch means memory.

| Property | Value |
|---|---|
| Outline | 0.9 unit, dashed 3.5 on, 2.5 off, 85% of the mark color |
| Hatching | Horizontal, every 4.5 units, 0.7 unit at 60% |
| Ground | White or Snow |
| Minimum | 400 px wide on screen, 120 mm in print |

---

## 3. Color

White is the canvas and black is the ink. Green is not a background, it is a signal: like Spotify's green, it marks the things you can press and the things that are on. The accents come from green's place on the color wheel.

### Harmony

| Color | Hue | Relationship | Job |
|---|---|---|---|
| Saddle Green | 162° | Base hue | The logo, and every interactive element that is on |
| Oasis | 162° | Same hue, lifted | Green elements in dark mode |
| Saffron | 40° | Triad with green | The warm heart of the light |
| Dusk | 282° | Third point of the triad | The light's cool edge, and the color of memory |
| Coral | 12° | Split complement of green (complement is 342°) | Blends Saffron into Dusk inside the light, nowhere else |
| Neutrals | none | True grays | White stays white; green is the only green on screen |

### Light, the default

| Name | Hex | Role |
|---|---|---|
| White | `#FFFFFF` | The canvas. Most of every screen |
| Snow | `#FAFAFA` | Sidebar and soft panels |
| Fog | `#F3F3F3` | Inputs, hover, the search field |
| Hairline | `#EAEAEA` | 1 px borders and page rows |
| Graphite | `#6B6B6B` | Secondary text, status, labels |
| Ink | `#111111` | Text and icons |

### Dark, the option

Sampled from the dark reference.

| Name | Hex | Role |
|---|---|---|
| Night | `#111111` | The dark canvas, behind the conversation |
| Night Side | `#0D0D0D` | The sidebar, a step deeper |
| Night Raised | `#1C1C1C` | Cards and panels |
| Night Line | `#262626` | 1 px borders |
| Ash | `#A0A0A0` | Secondary text |
| Frost | `#F2F2F2` | Text, icons and the logo |

### Green, for elements

| Name | Hex | Role |
|---|---|---|
| Saddle Green | `#273B35` | The logo and green elements in light: primary button, live mic, switches, links |
| Oasis | `#6BC7AB` | Green elements in dark. Same hue, lifted to read on Night |

Green goes on: the primary button, the live mic, a switch that is on, a level meter, a link underline, the active filter chip, and the square before each heading in the docs.

Green never goes on: backgrounds, panels, headings, body text, icons at rest, illustrations. The app icon tile is the one exception.

### The light and memory

| Name | Hex | Role |
|---|---|---|
| Saffron | `#E3A72F` | The warm heart of the light |
| Coral | `#E47458` | Blends Saffron into Dusk, inside the light only |
| Dusk | `#835298` | The light's cool edge. Memory and the stitch in light |
| Dusk Light | `#C4A5D8` | Memory and the stitch in dark |

### Proportion

80% White and Snow. 16% Ink and Graphite. About 3% green, on the logo and the few elements that are on. The light is under 1%, and only while Sarjy is live.

### Contrast pairs

| Text or mark | On | Ratio | Use |
|---|---|---|---|
| Ink | White | 18.9 : 1 | Body text |
| Graphite | White | 5.3 : 1 | Secondary text |
| Graphite | Snow | 5.1 : 1 | Secondary text in the sidebar |
| Saddle Green | White | 11.9 : 1 | Logo, green elements |
| White | Saddle Green | 11.9 : 1 | Primary button label, live mic glyph |
| Dusk | White | 5.8 : 1 | Memory, the stitch |
| Frost | Night | 16.9 : 1 | Body text, dark |
| Ash | Night | 7.2 : 1 | Secondary text, dark |
| Oasis | Night | 9.3 : 1 | Green elements, dark |
| Ink | Oasis | 9.3 : 1 | Primary button label, dark |
| Dusk Light | Night | 8.7 : 1 | Memory, dark |
| Saddle Green | Night | 1.6 : 1 | Never |
| Saffron | White | 2.1 : 1 | Never as text. Saffron lives inside the light |

---

## 4. Liquid glass

Everything that floats is liquid glass: the control bar, the orb, chips, toasts, the header. It is clear enough to keep the conversation and the light visible behind it, and it catches light along its edge. What you read sits on solid white or black, never on glass.

### The recipe

| Layer | Light | Dark |
|---|---|---|
| Fill | White at 60% | White at 7% |
| Fill, when it carries text | White at 78% | `#181818` at 62% |
| Backdrop | Blur 18 px, saturation 180% | Same |
| Edge | 1 px White at 90% | 1 px White at 16% |
| Rim | 0.5 px Black at 7%, outside the edge | 0.5 px Black at 50% |
| Sheen | A 135° gradient from the top-left corner, strongest at the edge, and a 1 px highlight along the top | Same, at lower strength |
| Shadow | 0 12 32 Black at 8% | 0 12 32 Black at 45% |

```css
/* Liquid glass: the floating layer only */
.glass {
  position: relative;
  background: var(--glass);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  backdrop-filter: blur(18px) saturate(180%);
  border: 1px solid var(--glass-edge);
  box-shadow: 0 0 0 .5px var(--glass-rim), inset 0 1px 0 var(--glass-sheen), var(--glass-shadow);
}
.glass::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: linear-gradient(135deg, var(--glass-sheen), transparent 38%, transparent 68%, color-mix(in srgb, var(--glass-sheen) 45%, transparent));
}
.glass > * { position: relative; }
.glass.text { background: var(--glass-text); color: var(--text); }
@media (prefers-reduced-transparency: reduce) {
  .glass { background: var(--surface); -webkit-backdrop-filter: none; backdrop-filter: none; }
  .glass::before { display: none; }
}
```

### Where glass goes

| Glass | Solid |
|---|---|
| The control bar and the mic | Captions and messages |
| The orb | Memory cards and lists |
| Tool chips and toasts | Settings and forms |
| The header, segmented controls, sheets | Anything you read for more than a glance |

Measured over the brightest point of the light: Ink on text glass is 14.5 : 1, Frost on dark text glass is 6.6 : 1. Gray secondary text drops below 4.5 : 1 there, so text on glass is always the primary text color. Glass is never stacked on glass. With reduced transparency turned on, glass becomes a solid Snow or Night Raised surface.

---

## 5. Type

Two voices on one screen. The interface is set in Figtree. Everything Sarjy says out loud is set in Newsreader italic, so you can always tell what was said to you from what the app is telling you.

| Family | Weights | Role |
|---|---|---|
| Figtree | 400 to 700 | Interface, headings, the user's words |
| Newsreader italic | 400, 500 | Only what Sarjy says |
| IBM Plex Sans Arabic | 400, 600 | Arabic interface |
| Noto Naskh Arabic | 500 | What Sarjy says in Arabic |
| JetBrains Mono | 400 | Machine output only: tool calls, timings, IDs |

Rubik appears only inside the Arabic wordmark, as outlines. It is not a text face.

```html
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@1,6..72,400;1,6..72,500&family=IBM+Plex+Sans+Arabic:wght@400;600&family=Noto+Naskh+Arabic:wght@500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

| Style | Size / line height | Weight | Sample |
|---|---|---|---|
| Display | 56 / 60 | Figtree 600, tracking -2.5% | Shaped to its rider |
| Heading | 32 / 38 | Figtree 600, tracking -1.5% | What Sarjy remembers |
| Voice | 23 / 32 | Newsreader italic 400 | Saved. Your favorite color is green. |
| Title | 19 / 26 | Figtree 600 | Favorite color |
| Body | 17 / 28 | Figtree 400 | Sarjy keeps what you tell it and uses it the next time you ask. |
| Small | 13 / 20 | Figtree 400, secondary | Listening… |
| Data | 12.5 / 17 | JetBrains Mono 400 | `memory.write(key: "favorite_color")  38 ms` |

---

## 6. The voice screen and its states

The screen: a sidebar (search, new chat, the stitched memory list, recent chats, the user) and a main area with the orb, a tool chip slot, the caption, a status line and a glass control bar (end, mic, voice settings). Below 900 px the sidebar is hidden.

The orb is a liquid glass sphere holding the symbol. It is the product's status light. The wave inside is still when Sarjy is idle, follows your voice when it listens, and moves with Sarjy's own voice when it speaks. The light blooms inside the glass only while Sarjy is live.

| State | Wave | Signal | Screen reader |
|---|---|---|---|
| Idle | The logo at rest, no motion | Clear orb, no light. Mic is glass | "Sarjy is ready" |
| Listening | Height follows mic level, 0.5 to 1.1 of rest | Mic turns green; the light grows with your voice; your words stream in | "Listening" |
| Thinking | Settles to 35%; a Dusk segment travels the line, 1.2 s loop | The light dims to 22% | "Thinking" |
| Checking a tool | Settles to 25% | A glass tool chip with its timing | "Checking the weather" |
| Speaking | Height follows speech audio; the peaks move independently | Mic green; the light turns; upcoming words are blurred until spoken | The spoken text, once |
| Saving to memory | Returns to rest over 480 ms | The saved fact gets a Dusk stitched underline | "Saved: favorite color, green" |

### The orb

| Layer | Light | Dark |
|---|---|---|
| The light | Conic sweep of Saffron, Coral, Dusk, blurred 24 px, radial mask, opacity by state | Same |
| Sphere fill | Clear center, white toward the edge | Clear center, faint white toward a bright rim |
| Edge | 1 px Black at 7% | 1 px White at 55% |
| Shade | Soft inner shade at the bottom, white highlight at the top | Outer glow 34 px White at 9%, inner glow |
| Specular | Ellipse at 38% 16%, White at 90% | Same shape, White at 6% |
| Grain | Noise at 5% | Noise at 16%, like the reference sphere |
| Wave | 56% of the orb, Saddle Green | Frost |

### Captions

Spoken words are solid. Words Sarjy has not said yet are blurred 3.5 px at 42% opacity and come into focus one by one as they are spoken. Your words stream in as you say them.

### Motion centerline

The animated line, in the symbol's 224 x 152 viewBox, stroke 22, round caps:

```
M24 107 C36 107 40 {pl} 57 {pl} C72 {pl} 82 {sy} 112 {sy} C142 {sy} 150 {pr} 168 {pr} C186 {pr} 186 107 200 107

pl = 107 - 66 * a1   (first raised end)
pr = 107 - 78 * a2   (second raised end)
sy = 107 + 7 * s     (the seat)
```

At `a1 = a2 = s = 1` the line matches the master, and the orb crossfades back to the master symbol. Drive `a1` and `a2` from mic level while listening and from speech audio while speaking. Ease every change about 14% per frame. Turn the light with `--rot`: about 15° a second while listening, 40° while speaking.

Motion uses `--ease-rein: cubic-bezier(.3, .7, .2, 1)` and durations of 120, 240 and 480 ms. With reduced motion on, the wave and the light stay still and only the mic, chip and captions change.

---

## 7. Dark mode

Light is the default. Dark is an option the user turns on, and it is a true dark: Night `#111111` behind the conversation, a deeper `#0D0D0D` sidebar, soft streaks of light from above, and an orb with a bright rim like a glass sphere in a dark room. Green lifts to Oasis so it still reads.

| Role | Light | Dark |
|---|---|---|
| Background | White `#FFFFFF` | Night `#111111` |
| Sidebar and panels | Snow `#FAFAFA` | Night Side `#0D0D0D`, Night Raised `#1C1C1C` |
| Text | Ink `#111111` | Frost `#F2F2F2` |
| Secondary text | Graphite `#6B6B6B` | Ash `#A0A0A0` |
| Lines | Hairline `#EAEAEA` | Night Line `#262626` |
| Logo | Saddle Green | Frost |
| Green elements | Saddle Green, White label | Oasis, Ink label |
| Memory | Dusk | Dusk Light |
| Orb | Clear glass, white highlight, soft inner shade | Dark glass, bright rim, grain |

The streaks: four soft diagonal bands at 97° to 112°, White at 4% in dark and Black at 2.5% in light, fading out by 72% of the height.

---

## 8. The stitch

A leather saddle is held together by hand stitching, and it slowly takes the shape of its rider. In Sarjy, a Dusk stitch marks everything Sarjy has kept about you. If it is stitched, it is remembered. If it is not stitched, it is not stored.

| Property | Value |
|---|---|
| Dash | 6 on, 4 off, 1.5 px thick (2 px on lines longer than 400 px) |
| Color | Dusk on light, Dusk Light on dark |
| Memory card | Solid surface, stitch inset 6 px, 80% opacity |
| Where it appears | Memory cards, the sidebar memory list, the underline on a fact as it is saved |
| Where it never appears | Decoration inside the product, anything that is not stored |

Every stitched item has Edit and Forget next to it. Sarjy never keeps something the user cannot see.

---

## 9. Components

| Component | Spec |
|---|---|
| Mic | Ready, live, no mic access. 52 px, inside the glass control bar. Glass when ready, green when live, dashed when there is no mic access |
| Control bar | Glass pill, 6 px padding: end, mic, voice settings |
| Buttons | Pill shaped. One green primary per view. Quiet buttons are a 1 px line. The label names the result: Save, Forget, Try again |
| Tool chip | Text glass, mono 12.5 px, radius 14. Shows which tool answered and how long it took. Wraps inside its box at any width. Sarjy only quotes numbers that came back in a chip |
| Segmented control | Glass track with a solid thumb. Choosing between views is not an on state, so no green |
| Switch | Fog track when off, green track when on, white thumb |
| Memory card | Solid, radius 12, Dusk stitched inset, Edit and Forget |
| Radius | 6 inputs, 12 cards, 14 chips, 22 panels and the voice screen, pill for buttons and the control bar |
| Icons | 24 grid, 1.75 stroke, round caps and joins |
| Spacing | 4 px base: 4, 8, 12, 16, 24, 32, 48, 64, 96 |
| Focus | 2 px outline in the green of the current theme, 3 px offset |

---

## 10. The doc pages

The visual identity and the brand book follow sarj.ai's white page:
- a white 1120 px column with 1 px Hairline sides;
- hatched margins at 135°, 1 px `#EFEFEF` every 11 px;
- full-width Hairline rows between sections, with a 44 px white band between them;
- a glass header with the bilingual horizontal lockup;
- a green 10 px square before each section heading.

Below 700 px the margins and column sides drop away and the page keeps a 16 px gutter.

---

## 11. Rules

### Always

- Start from White. Dark is an option, never the default.
- Use green only for elements that are on or pressable: the primary button, the live mic, switches, levels, links.
- Make floating things glass and readable things solid.
- Use the primary text color on glass, over the heavier text tint.
- Use the supplied SVG files for the logo, in both scripts.
- Set Sarjy's words in Newsreader italic and the user's words in Figtree.
- Stitch everything that is stored, with Edit and Forget next to it.
- Use logical properties so Arabic layouts mirror. The logo does not mirror.

### Never

- Green backgrounds, green headings, green panels. The app icon is the one exception.
- Tinted whites or tinted blacks. White is `#FFFFFF` and dark is `#111111`.
- Glass on glass, or glass behind body text.
- The light while Sarjy is idle, or on the logo.
- Saddle Green on Night.
- Waveforms, microphones or sound bars as brand imagery. The symbol is the only wave.
- Mono type for anything a person wrote or said.

---

## 12. Tokens

Copy these into the build as they are. Colors live here and nowhere else.

```css
:root {
  /* Neutrals, light */
  --white: #FFFFFF;
  --snow: #FAFAFA;
  --fog: #F3F3F3;
  --hairline: #EAEAEA;
  --graphite: #6B6B6B;
  --ink: #111111;

  /* Neutrals, dark */
  --night: #111111;
  --night-side: #0D0D0D;
  --night-raised: #1C1C1C;
  --night-line: #262626;
  --ash: #A0A0A0;
  --frost: #F2F2F2;

  /* Green, for elements */
  --saddle: #273B35;
  --oasis: #6BC7AB;

  /* The light and memory */
  --saffron: #E3A72F;
  --coral: #E47458;
  --dusk: #835298;
  --dusk-light: #C4A5D8;
  --light-a: rgba(227, 167, 47, .85);
  --light-b: rgba(228, 116, 88, .75);
  --light-c: rgba(131, 82, 152, .7);

  /* Shape and motion */
  --r-s: 6px;
  --r-m: 12px;
  --r-l: 22px;
  --r-pill: 999px;
  --ease-rein: cubic-bezier(.3, .7, .2, 1);
  --t-quick: 120ms;
  --t-base: 240ms;
  --t-slow: 480ms;

  /* Type */
  --font-ui: "Figtree", system-ui, sans-serif;
  --font-voice: "Newsreader", Georgia, serif;
  --font-ar: "IBM Plex Sans Arabic", "Segoe UI", sans-serif;
  --font-ar-voice: "Noto Naskh Arabic", serif;
  --font-data: "JetBrains Mono", ui-monospace, monospace;

  /* --grain: an feTurbulence noise tile, used at 5% light and 16% dark on the orb */
}

/* Roles. Light is the default everywhere; dark is an option. */
:root, .scheme-light {
  --bg: var(--white);
  --side: var(--snow);
  --surface: var(--snow);
  --sunken: var(--fog);
  --text: var(--ink);
  --text-2: var(--graphite);
  --line: var(--hairline);
  --mark: var(--saddle);
  --accent: var(--saddle);
  --on-accent: var(--white);
  --memory: var(--dusk);
  --focus: var(--saddle);
  --hatch: #EFEFEF;
  --streak: rgba(0, 0, 0, .025);
  --glass: rgba(255, 255, 255, .6);
  --glass-text: rgba(255, 255, 255, .78);
  --glass-edge: rgba(255, 255, 255, .9);
  --glass-rim: rgba(0, 0, 0, .07);
  --glass-sheen: rgba(255, 255, 255, .55);
  --glass-shadow: 0 12px 32px rgba(0, 0, 0, .08), 0 2px 6px rgba(0, 0, 0, .05);
  --orb-fill: radial-gradient(circle, rgba(255, 255, 255, 0) 56%, rgba(255, 255, 255, .5) 86%, rgba(255, 255, 255, .95) 100%);
  --orb-edge: rgba(0, 0, 0, .07);
  --orb-shadow: inset 0 -14px 30px rgba(0, 0, 0, .05), inset 0 2px 2px rgba(255, 255, 255, .95), 0 24px 60px rgba(0, 0, 0, .09);
  --orb-spec: rgba(255, 255, 255, .9);
  --orb-grain: .05;
  --frame-shadow: 0 30px 80px rgba(0, 0, 0, .08), 0 2px 8px rgba(0, 0, 0, .04);
}
:root[data-theme="dark"], .scheme-dark {
  --bg: var(--night);
  --side: var(--night-side);
  --surface: var(--night-raised);
  --sunken: #181818;
  --text: var(--frost);
  --text-2: var(--ash);
  --line: var(--night-line);
  --mark: var(--frost);
  --accent: var(--oasis);
  --on-accent: var(--ink);
  --memory: var(--dusk-light);
  --focus: var(--oasis);
  --hatch: #1B1B1B;
  --streak: rgba(255, 255, 255, .04);
  --glass: rgba(255, 255, 255, .07);
  --glass-text: rgba(24, 24, 24, .62);
  --glass-edge: rgba(255, 255, 255, .16);
  --glass-rim: rgba(0, 0, 0, .5);
  --glass-sheen: rgba(255, 255, 255, .1);
  --glass-shadow: 0 12px 32px rgba(0, 0, 0, .45);
  --orb-fill: radial-gradient(circle, rgba(255, 255, 255, 0) 54%, rgba(255, 255, 255, .07) 80%, rgba(255, 255, 255, .42) 97%, rgba(255, 255, 255, .85) 100%);
  --orb-edge: rgba(255, 255, 255, .55);
  --orb-shadow: 0 0 34px rgba(255, 255, 255, .09), inset 0 0 22px rgba(255, 255, 255, .1);
  --orb-spec: rgba(255, 255, 255, .06);
  --orb-grain: .16;
  --frame-shadow: 0 30px 80px rgba(0, 0, 0, .35), 0 0 0 1px rgba(255, 255, 255, .04);
}
.scheme-light, .scheme-dark { color: var(--text); background-color: var(--bg); }
```
