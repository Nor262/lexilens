---
name: Warm Editorial Scholar
colors:
  surface: '#faf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#faf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f0'
  surface-container: '#efeeea'
  surface-container-high: '#e9e8e4'
  surface-container-highest: '#e3e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#56423d'
  inverse-surface: '#2f312e'
  inverse-on-surface: '#f2f1ed'
  outline: '#89726b'
  outline-variant: '#dcc1b9'
  surface-tint: '#9d4225'
  primary: '#9a4023'
  on-primary: '#ffffff'
  primary-container: '#ba5838'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb59e'
  secondary: '#715a3e'
  on-secondary: '#ffffff'
  secondary-container: '#fdddb9'
  on-secondary-container: '#786044'
  tertiary: '#37645c'
  on-tertiary: '#ffffff'
  tertiary-container: '#507d74'
  on-tertiary-container: '#f4fffb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59e'
  on-primary-fixed: '#3a0b00'
  on-primary-fixed-variant: '#7e2c10'
  secondary-fixed: '#fdddb9'
  secondary-fixed-dim: '#e0c29f'
  on-secondary-fixed: '#281803'
  on-secondary-fixed-variant: '#584329'
  tertiary-fixed: '#bcece1'
  tertiary-fixed-dim: '#a1d0c6'
  on-tertiary-fixed: '#00201b'
  on-tertiary-fixed-variant: '#204e46'
  background: '#faf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e3e2df'
typography:
  display:
    fontFamily: Newsreader
    fontSize: 3.5rem
    fontWeight: '400'
    lineHeight: 4rem
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Newsreader
    fontSize: 2.5rem
    fontWeight: '400'
    lineHeight: 3rem
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 2.25rem
    fontWeight: '400'
    lineHeight: 2.75rem
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 1.75rem
    fontWeight: '500'
    lineHeight: 2.25rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Newsreader
    fontSize: 1.5rem
    fontWeight: '500'
    lineHeight: 2rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Newsreader
    fontSize: 1.25rem
    fontWeight: '500'
    lineHeight: 1.75rem
    letterSpacing: '0'
  body-lg:
    fontFamily: Manrope
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.875rem
    letterSpacing: -0.005em
  body-md:
    fontFamily: Manrope
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.625rem
    letterSpacing: '0'
  body-sm:
    fontFamily: Manrope
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
    letterSpacing: 0.005em
  label-lg:
    fontFamily: Manrope
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.025em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '400'
    lineHeight: 0.875rem
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system draws its spirit from classical academic publishing merged with modern conversational intelligence. It evokes the quiet, focused gravity of a sunlit reading room, heavy linen book cloth, and archival paper, punctuated by the deliberate warmth of raw terracotta clay. 

The aesthetic sits at the intersection of **Minimalism** and **Refined Editorialism**:
- **Personality:** Authoritative, contemplative, humane, and deeply legible.
- **Target Audience:** Researchers, thinkers, writers, and technical specialists who spend hours in deep analytical reading and dialogue.
- **Emotional Intent:** To provide a serene, tactile sanctuary that lowers visual fatigue and instills a sense of rigorous craftsmanship and intellectual calm.

## Colors

The palette revolves around mineral and paper tones, purposefully devoid of cold blue-gray digital cast:

- **Primary Accent (`#c25e3e` / `#d97757`):** Terracotta / Coral Clay. Used deliberately for focal interactive states, primary actions, and intellectual emphasis. It commands attention without the alarming quality of pure crimson or high-saturation orange.
- **Secondary (`#8c7355`):** Warm Umber / Bookbinder Leather. Bridges interactions, metadata labels, active filter states, and secondary visual tags.
- **Tertiary (`#2d5a52`):** Deep Forest Sage. Provides an intellectual counterbalance to the terracotta warmth, reserved for verified badges, successful operations, code annotations, and secondary data highlights.
- **Neutral Canvas (`#faf9f5` with containers at `#f5f4ee` and `#edebe3`):** Warm Parchment and Natural Sand. Replaces stark optical whites to eliminate glare during prolonged cognitive sessions.
- **Ink / Text (`#23211e` to `#635e57`):** Warm Carbon ink tones rather than pure black, retaining high legibility with an organic edge.
- **Borders & Dividers (`#e5e2d9`):** Soft, muted ochre-tinted hairlines that separate spatial domains without breaking the continuous flow of text.

## Typography

The typographic hierarchy establishes clear roles between long-form scholarship, UI navigation, and technical notation:

- **Headlines (`Newsreader`):** Infuses titles, essay starts, and conversation headings with literary grace. Use italic weights deliberately for secondary section subtitles or citations to evoke traditional scholarly monographs.
- **Body (`Manrope`):** Delivers clean, unhindered reading comprehension across dense paragraphs, dialog transcripts, and data panes. Generous line-height (`1.625` to `1.875`) maintains rhythmic cadence and prevents eye strain.
- **Metadata & Technical Accents (`JetBrains Mono`):** Applied to timestamps, citations, footnotes, token counters, and prompt controls, anchoring technical clarity within an otherwise literary setting.

## Layout & Spacing

The layout is built upon an editorial grid philosophy, prioritizing optimal reading column widths (60 to 75 characters) surrounded by structured parchment borders:

- **Grid Architecture:** 
  - **Desktop (>= 1200px):** 12-column layout with 48px margins and 24px gutters. The central reading or dialogue column centers at a maximum width of 768px, flanked by contextual sidebars or annotation gutters.
  - **Tablet (768px - 1199px):** 8-column layout with 32px margins and 24px gutters. Secondary sidebars collapse into toggleable drawer panels.
  - **Mobile (< 768px):** 4-column layout with 20px margins and 16px gutters, providing uninterrupted linear vertical rhythm.
- **Rhythm & Structure:** Horizontal rules (`1px solid #e5e2d9`) separate distinct thematic sections. White space serves as punctuation; ample top and bottom padding around section headers mirrors book chapter headbands.

## Elevation & Depth

This system intentionally departs from synthetic, high-blur drop shadows, adopting an archival **Tonal Layering** and **Ghost Outline** model:

- **Layer 0 (Canvas Base):** Archival parchment (`#faf9f5`).
- **Layer 1 (Cards, Code Blocks, Panels):** Sand container (`#f5f4ee`) framed with a 1px crisp hairline border (`#e5e2d9`).
- **Layer 2 (Overlays, Flyouts, Popovers):** Elevated sand (`#ffffff` or tint `#faf8f3`) bounded by a dual boundary: `1px solid #ddd9ce` accompanied by a faint, warm ambient contact shadow (`0 2px 8px -2px rgba(60, 50, 40, 0.06), 0 8px 24px -4px rgba(60, 50, 40, 0.04)`).
- **Interactive Surfaces:** Elements do not float upwards on hover; instead, they shift tint subtly toward warm clay undertones or deepen their borders (`#c25e3e`), resembling a pen stroke meeting pressed paper.

## Shapes

The geometric framework favors subtle, classical soft corners over modern ultra-round geometries:

- **Soft Radius (`0.25rem` / `4px`):** Used across standard interactive controls, code chips, inputs, and buttons. This captures the slight softening of aged paper leaves and letterpress slugs.
- **Container Radius (`rounded-lg` / `0.5rem` / `8px`):** Applied to reading cards, modal dialogs, and split panes.
- **Archival Elements:** Vertical rule dividers, marginal notes, and blockquotes employ precise squared termination lines (`0px`), retaining academic rigor.

## Components

### Buttons
- **Primary:** Solid terracotta clay background (`#c25e3e`), text in crisp parchment (`#faf9f5`). Hover state shifts to deeper raw sienna (`#a84f33`). Active state introduces a gentle inset compression.
- **Secondary / Ghost:** Parchment background with a warm border (`1px solid #dcd8cc`), text in warm carbon (`#23211e`). On hover, the surface shifts to sand (`#f0eee6`) with border warming (`#c25e3e`).
- **Editorial Text Action:** Unbordered, underline rendered in thin clay (`#c25e3e`), with an offset underline for inline research references and source exploration.

### Input Fields & Text Areas
- Built with a warm sand surface (`#f5f4ee`), encased in a 1px border (`#e5e2d9`).
- Active focus state replaces standard outlines with a 1px crisp terracotta border (`#c25e3e`) and a subtle 2px tinted ring (`rgba(194, 94, 62, 0.15)`).
- Placeholders rendered in muted bookbinder umber (`#8c7355`).

### Cards & Reading Panes
- Rendered on `#f5f4ee` with a 1px `#e5e2d9` hairline boundary.
- Headers within cards feature Newsreader serif titles accompanied by JetBrains Mono category stamps.
- Content sections inside cards are divided by faint warm-gray horizontal separators.

### Chips & Tags
- Compact, flat elements with 4px border radius.
- Standard metadata chips use warm sand background (`#edebe3`) with carbon text (`#524d46`).
- Active or semantic filter chips use an outline of clay (`#c25e3e`) with a tinted background (`rgba(194, 94, 62, 0.08)`).

### Lists & Citations
- Academic unordered lists use custom square or en-dash terracotta bullets rather than generic discs.
- Citation blocks are framed by a 2px left border in `#c25e3e` with a 16px indent, rendered in italicized serif or monospace for biblio-references.

### Checkboxes & Radio Buttons
- 16px square (checkbox) or circle (radio) with a 1.5px border (`#c7c2b5`).
- Selected state fills with solid clay (`#c25e3e`), presenting a pure ivory/parchment checkmark or inner pip.