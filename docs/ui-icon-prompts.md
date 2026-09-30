# Interface icon generation — 1.0.21

Generated on 2026-09-30 with the built-in image-generation tool. The tool did not expose a verifiable model identifier. Assets live in `desktop/assets/ui-icons/`. Their original alpha channels are preserved; CSS applies the shared blue-violet color, tile background and selection state.

Design references: [Apple design principles](https://developer.apple.com/cn/design/human-interface-guidelines/design-principles) for clarity, familiar metaphors and consistency, and [Discord branding](https://discord.com/branding) for a blue-violet accent direction. These project-generated glyphs are not official symbols from either company.

## Shared prompt for the five navigation glyphs

Use case: logo-brand / UI icon asset. Create one ORIGINAL monochrome interface symbol for a desktop proxy control app, with the clarity and optical balance of Apple interface symbols and the friendly rounded geometry of Discord navigation icons. This is a UI glyph, not an app logo.
STYLE: precise 2D geometric monoline, perfectly uniform medium-bold stroke (about 8% of the symbol width), soft round caps, rounded corners, simple recognizable silhouette, meticulous optical centering. No perspective, texture, shading, gradients, shadows, bevels, lighting, sketch marks, thin hairlines or outlined double edges. All strokes and fills are SOLID BLACK, #000000, on a genuinely TRANSPARENT alpha background. The black artwork is a mask source: do not render a white background or checkerboard. No colored tile, no enclosing backplate, no border outside the described symbol, no text, letters, numbers, watermarks or logos.
COMPOSITION: square canvas, symbol occupies exactly 68% of both canvas width and height, with equal 16% transparent margins; preserve that scale for the icon family. Single icon only.

### overview.png

SUBJECT: Overview dashboard. A rounded square outline containing a vertical divider at one third width (left sidebar), and a horizontal divider halfway down ONLY the right two-thirds (two content panels). Three clean empty panes total. Lines share the same weight. A minimal familiar dashboard symbol.

### settings.png

The attached image is a STYLE REFERENCE ONLY: match its stroke weight, roundness, centering and flat mask treatment, but replace its dashboard subject entirely.

SUBJECT: Settings / adjustments: THREE vertical parallel slider rails with one outlined round knob on each rail, alternating knob heights (left near top, middle near bottom, right near middle). The rails connect tangentially to the knobs without crossing their empty centers. Minimal rounded sliders; no gear.

### models.png

The attached image is a STYLE REFERENCE ONLY: match its stroke weight, roundness, centering and flat mask treatment, but replace its dashboard subject entirely.

SUBJECT: Model library: THREE evenly spaced stacked rounded diamond-shaped layers seen as simple 2D layer pictograms, matching perspective-free standard interface stacked-layer symbols. Top is one closed rounded diamond outline, the next two are open shallow downward V contours below. Only three layers; clean negative space; no tiny facets.

### logs.png

The attached image is a STYLE REFERENCE ONLY: match its stroke weight, roundness, centering and flat mask treatment, but replace its dashboard subject entirely.

SUBJECT: Runtime logs: one rounded rectangle sheet outline with THREE short horizontal parallel lines inside, evenly spaced; the lowest line slightly shorter. No folded page corner, no text characters. Bold simple log list.

### diagnostics.png

The attached image is a STYLE REFERENCE ONLY: match its stroke weight, roundness, centering and flat mask treatment, but replace its dashboard subject entirely.

SUBJECT: Diagnostics and help: a clean circular outline containing one simple ECG/pulse line with a single up-down peak, horizontal baseline on either side, generous separation between pulse and circle. Familiar activity health symbol.

For settings, models, logs and diagnostics, `overview.png` was supplied as the style reference.

## Proxy glyph

Create one original interface icon for a desktop proxy app. Match the attached reference's simple flat monoline geometry, medium-bold even strokes, rounded line caps and corners, and generous transparent padding. All artwork pure BLACK on truly transparent alpha background; no tile, white backdrop, text, shadow, bevel, perspective, 3D, texture or glow. Single centered glyph on square canvas, occupying about 68% of the canvas dimensions, leaving 16% transparent padding. Designed to remain clear at 28–52 px. This will be colorized blue-violet with CSS. Match the reference only for style, replace its subject completely.
SUBJECT: Proxy forwarding. Two parallel horizontal arrows traveling in opposite directions. Upper arrow points RIGHT, lower arrow points LEFT. Each arrow shaft has a short, smooth rounded 90-degree return at the tail, creating a compact balanced bidirectional transfer motif. Simple open arrowheads of equal length; clearly separated paths; consistent medium-bold stroke thickness. No circles, checks, letters or tiny decorative details.

## Connection glyph

Create one original interface icon for a desktop proxy app. Match the attached reference's simple flat monoline geometry, medium-bold even strokes, rounded line caps and corners, and generous transparent padding. All artwork pure BLACK on truly transparent alpha background; no tile, white backdrop, text, shadow, bevel, perspective, 3D, texture or glow. Single centered glyph on square canvas, occupying about 68% of the canvas dimensions, leaving 16% transparent padding. Designed to remain clear at 28–52 px. This will be colorized blue-violet with CSS. Match the reference only for style, replace its subject completely.
SUBJECT: Connection test. A simple familiar chain-link icon: TWO interlocking oblong rounded chain links oriented on the same rising 45-degree diagonal, one at lower left and one at upper right, overlapping at the center. Spacious transparent inner openings, smooth round ends, balanced mirror symmetry about diagonal, same uniform medium-bold outline weight as reference. No success checkmark, circle badge, arrows or extra decorations.

Both use `overview.png` as the style reference. Individual source images are retained without raster editing.
