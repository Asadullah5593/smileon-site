# SmileOn — static frontend

The smileon.pk homepage, built from the Figma file `emNaKtvekBj0uV2nuvnZQG`
(frames `SmileOn Home page1` / `page2`).

**No database, no backend, no environment variables.** Every route prerenders
to static HTML, which is what makes this deployable to Vercel as-is. The CMS
app in the parent directory is untouched and still owns MySQL, auth and `/admin`.

```bash
npm install
npm run dev        # http://localhost:3001
npm run build      # static export of / and /_not-found
```

## Deploying to Vercel

Import the repository and set **Root Directory** to `site`. Nothing else —
there are no env vars to configure. Framework preset auto-detects as Next.js.

## Layout

```
app/
  layout.tsx       fonts (Inter + Kaushan Script), metadata
  page.tsx         section order, nothing else
  globals.css      brand tokens sampled from Figma + the .shell/.section helpers
components/
  Header.tsx       topbar, nav, mobile drawer
  Footer.tsx
  sections/        one file per band of the design
  ui/              Button, SectionHeading, ArrowLink
content/site.ts    every string and image path on the page
public/img         photography + raster icons (WebP)
public/icons       vector icons (SVG, exported from Figma)
```

**`content/site.ts` is the seam.** Components take their copy from it and hold
no literals of their own. When the CMS takes over, a loader returning the same
shape replaces the constants and the components do not change. That was the
point of the file.

## Design fidelity

Built against the 1440px frame and verified by diffing a Playwright capture
against the Figma render. Every section lands within 0–4px of the design's
y-position; the page is 4074px against the design's 4063px.

Three things the Figma layer names get wrong, and that the rendered frame
settles:

- **The brand is teal `#0399b2`, not navy.** The navy shades (`#0b057d`,
  `#03328f`, `#002689`) are ink colours for headings and body copy. The topbar,
  primary buttons, active tabs, badges and footer are all teal.
- **The whole page is set in Inter *italic*.** Every text layer uses an italic
  style, so `app/layout.tsx` loads the italic axis and `body` sets
  `font-style: italic`. Only the Kaushan Script flourish opts back out.
- **Exact px values are written against `xl:`, and `--breakpoint-xl` is
  overridden to 1400px** (`87.5rem`, so Tailwind sorts it after `lg`). 1280
  fires 160px early and overflows; a literal 1440 would miss a 1440px window,
  because a classic scrollbar leaves ~1425px of content.

The content inset is 48px per side — the design's bands run edge to edge and
only the content is inset, so `.shell` caps at 1440 and pads once.

Matched to the 1440px frame. Below that the layout is an addition, not a
transcription — Figma has no tablet or mobile frame, so those breakpoints are
a judgement call:

- Grids step 3 → 2 → 1 (treatments, dentists, FAQ, reviews).
- The topbar drops the address and hours below `lg`, keeping the phone number.
- Nav collapses to a drawer below `lg`.
- The hero stacks with the photo above the copy.
- Decorative images (overseas illustration, globe) are hidden on small screens
  rather than shrunk to illegibility.

Two design states became one component: `page1` and `page2` are the *Search by
Dental Treatment* and *Search by Dental Concern* tabs of **Find Your Solution**,
not separate pages. Everything else on those two frames is identical.

## Copy corrections

Transcribed verbatim except for these, which are evident typos in the source:

| Figma | Here |
| --- | --- |
| `Explore Clear Aligers` | Explore Clear Aligners |
| `clear Aligners`, `smile Makeover`, `dental Implants` | title case |
| `Dr. Husssain shahid` | Dr. Hussain Shahid |
| `A brighter, move confident smile` | A brighter, more confident smile |
| `How do i book a consultant?` | How do I book a consultation? |
| `Experience specialists providing…` (page2) | Experienced specialists providing… |
| `Your care,safety and feedback…` | spacing after commas |
| footer `0331106666` (10 digits) | `03311066666`, matching the rest of the page |
| footer `info@smileon.com` | `info@smileon.pk`, matching the domain |

Revert any of these in `content/site.ts` if the Figma spelling was deliberate.

## Known gaps

- **The imagery is AI-generated placeholder art**, not photographs of a real
  clinic or real dentists — the source files are named `ChatGPT Image …` and
  `Gemini_Generated_Image_…`. Replace before launch; the dentist portraits in
  particular are of people who do not exist.
- The FAQ answers are **written, not designed** — Figma shows six collapsed
  rows with no answer text. They read as plausible clinic copy and need review.
- Nav and footer links resolve to on-page anchors or `#`; only the homepage is
  designed.
- Before/after shows one case, so its carousel arrows are rendered disabled.
  They activate when the content layer returns more than one.
- Source PNGs were 18.2MB. They are downscaled to WebP at 1.2MB total; the
  originals are still in Figma if a larger master is ever needed.

## Asset repairs

Several Figma exports needed fixing before they were usable. If these assets
are ever re-exported, the same work applies:

- `stat-specialists` and `stat-sterilization` each exported as a **two-glyph
  sheet** (medal + people, person + shield). Figma's fill crops to the right
  glyph; the files here are cropped to match, otherwise both glyphs render.
- `dentist-sarooj-hannan` had a **solid blue frame** baked into the raw upload.
  Trimmed, then shaved 2px to clear the antialiased remnant.
- The four dentist portraits export as tall originals (roughly 950×1080) but
  the card slot is 312×230 landscape. They are pre-cropped with sharp's
  attention strategy so faces sit in frame; a plain top crop clipped chins.
- `whatsapp.svg` is filled `#0E9A51` — the same green as the button it sits on.
  The design places it in a white disc, which is what `Hero.tsx` does.
- `logo-mark.webp` is the navy-on-white mark and disappears on the navy footer;
  it is forced white with `brightness-0 invert` rather than shipping a variant.
- The two `pin-alt` / `phone-alt` vector exports arrived transposed relative to
  their use in the design, and are swapped here; both `chevron-*` exports point
  right, so the left-hand ones are mirrored with `-scale-x-100`.
- **Arrow glyphs ship in three colours and are easy to mix up.**
  `arrow-right.svg` / `arrow-link.svg` are near-white (`#FBFDFF`) and belong on
  the teal and green buttons; `arrow-sm.svg` / `card-arrow.svg` /
  `arrow-link2.svg` are ink navy (`#0B057D`) for links on white;
  `arrow-tiny.svg` is `#4590E6` for "Get directions". Using the white one on a
  white card renders an invisible arrow.
- Most source images carried large uniform borders — the before/after had 302px
  of letterboxing top and 336px bottom, and the logo 443px above. Each is
  trimmed, then cover-fitted to its exact design slot at 2× and encoded at
  WebP q92; the dentist portraits are top-anchored, which is how Figma frames
  them.
