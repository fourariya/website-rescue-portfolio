# Website Rescue

An interactive before/after portfolio demo for a freelance **website maintenance** service (bug fixing, responsive fixing and UI improvement), written for Thai customers on Fastwork.

> **Demonstration project.** "Sabai Move Studio" is a fictional business made for this demo. Nothing here is a real client, a real result or a measured improvement.

## What it shows

Visitors can explore the same fictional website in two states, side by side:

- **Before:** a realistic, deliberately broken site with genuine, reproducible bugs (not a static image)
- **After:** the same content rebuilt with working JavaScript, a responsive layout, accessible controls and one consistent design system

Both versions are real pages in `site/demo/` and run inside iframes on the portfolio page. All intentionally broken code lives in `site/demo/before/` and only runs inside its own iframe. The portfolio page has none of it.

## Features

| Feature                 | Where                         | Notes                                                                                                                                             |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drag-to-compare preview | Hero                          | Before and After stacked; drag the line or use the arrow keys (it's a real `<input type="range">`). On phones the preview uses the mobile layout. |
| Before / After toggle   | Showcase                      | Radio group with a live status line; scroll position carries over when switching                                                                  |
| Desktop / Mobile toggle | Showcase                      | Renders the demo at a real 1280 × 800 or 375 × 667 viewport, scaled to fit. The demo's own media queries respond.                                 |
| "Try these" guide       | Showcase                      | Four steps to reproduce each bug, with the expected Before and After result                                                                       |
| Fix breakdown           | Six tabs (arrow-key tablist)  | For each issue: problem, cause, fix, result in plain Thai, plus an expandable code diff and a button that opens the showcase in the right state   |
| Services                | Price table on the warm sheet | Bug Fix ฿800, Responsive Fix ฿1,500, UI Improvement ฿2,500 (starting prices)                                                                      |
| Process and contact     | Five stages; contact band     | The CTA opens the Fastwork profile in a new tab (see Configuration)                                                                               |

## Issues demonstrated

| #   | Group          | Before (reproducible)                                                                               | Root cause                                                         | After                                                                               |
| --- | -------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| 1   | Bug Fix        | Clicking a class filter (Yoga, Pilates, Stretch) empties the schedule; old buttons stay highlighted | Buttons send `"Yoga"`, rows store `"yoga"`, compared with `===`    | Values normalised before comparing, `aria-pressed`, live result count               |
| 2   | Bug Fix        | Mobile menu button does nothing and can't be reached by keyboard                                    | JS toggles `.active`, CSS expects `.show`; the toggle is a `<div>` | Real `<button>` with `aria-expanded`, one shared state attribute, Esc closes        |
| 3   | Bug Fix        | Main hero button can't be clicked with a mouse or finger                                            | A transparent decorative overlay sits above it (`z-index: 3`)      | No overlay; decoration lives in the background                                      |
| 4   | Responsive Fix | Page overflows a 375 px screen; third class card drops a row even on desktop                        | Fixed `width: 1100px` / `1060px`; content-box card widths          | `max-width`, `box-sizing: border-box`, CSS Grid, schedule restacks on small screens |
| 5   | Responsive Fix | 11–13 px text, tap targets under 30 px                                                              | Hard-coded small sizes                                             | 16 px minimum body, 44 px minimum controls                                          |
| 6   | UI Improvement | Weak hierarchy, three button styles, three price formats, low-contrast grey text                    | Each section styled on its own                                     | Design tokens for colour, type and spacing, with WCAG AA text contrast              |

The Before script passes ESLint. These are logic bugs a linter can't catch, which is the point of the demo.

## Technologies

- HTML5, CSS3 and vanilla JavaScript (ES modules). No framework and no build step.
- Fonts from Google Fonts: Chakra Petch, IBM Plex Sans Thai and IBM Plex Mono for the portfolio, Noto Sans Thai for the After demo. All are under the SIL Open Font License 1.1.
- Dev tooling only, never shipped: Prettier, ESLint, Node's built-in test runner, and `puppeteer-core` (Apache-2.0), which drives your installed Chrome or Edge for the e2e checks and screenshots.

## Run locally

The pages use ES modules, which browsers block on `file://`, so serve the `site/` folder:

```powershell
npm install
npm run serve          # http://localhost:5500 (needs Python)
```

VS Code Live Server pointed at `site/` also works.

## Checks

```powershell
npm run check          # Prettier check, ESLint, unit tests (node --test)
npm run test:e2e       # headless Chrome: proves the Before bugs reproduce, the After fixes work,
                       # no console errors, no horizontal overflow at 320–1920 px, controls work
```

Set `CHROME_PATH` if Chrome or Edge is not in a standard location.

## Screenshots for Fastwork

```powershell
npm run screenshots
```

This writes six 1280 × 720 PNGs to `screenshots/`, all captured from the running project:

| File                          | Content                                                    |
| ----------------------------- | ---------------------------------------------------------- |
| `01-cover.png`                | Portfolio hero with the live Before/After compare          |
| `02-before-after-desktop.png` | Demo at 1280 px, Before and After                          |
| `03-before-after-mobile.png`  | Demo at 375 × 667 px, Before overflowing and After fitting |
| `04-bug-fix.png`              | The Pilates filter clicked in both versions                |
| `05-ui-improvement.png`       | The price section, Before and After                        |
| `06-services.png`             | The portfolio's services table                             |

Images 02 to 05 are compositions of real captures laid out in the portfolio's style, and each one is labelled as a demonstration. The script also refreshes `site/assets/ui-before.png` and `ui-after.png`, which the portfolio page shows. Run it again after changing either demo.

## Configuration

**Fastwork link:** the contact CTA in `site/index.html` (marked with a `CONFIG` comment) points to `https://fastwork.com/user/four` and opens in a new tab. To change it, edit that `href` and the `FASTWORK_URL` constant in `scripts/e2e.mjs`, which checks it. If the `href` is ever reset to `#contact`, a dashed note under the button shows that the link is not set.

## Deploy to Netlify (manual drag and drop)

1. Run `npm run check` and `npm run test:e2e`.
2. Go to <https://app.netlify.com/drop>.
3. Drag the **`site`** folder (not the project root) onto the page.

`site/` holds everything the website needs and nothing else, so `node_modules`, scripts and screenshots never get uploaded.

## Project structure

```
site/                    ← deploy this folder
  index.html             portfolio page (lang="th")
  src/
    tokens.css           design tokens (colours, type, spacing)
    base.css             base rules
    styles.css           page styles
    main.js              nav, scaled frames, compare slider, showcase, tabs
    frame-math.js        pure helpers (unit-tested)
  demo/
    before/              intentionally broken fictional site
    after/               fixed version (app.js, filter.js, styles.css)
  assets/                favicon, UI crops captured from the demo
scripts/
  e2e.mjs                browser checks
  screenshots.mjs        promo images and UI crops
  lib/browser.mjs        static server and Chrome launcher
tests/                   unit tests (node:test)
screenshots/             generated promotional images
FASTWORK.th.md           Thai portfolio description to copy
```

## Limitations

- Fictional demo: no real client, testimonials, logos or measured results.
- Automated checks run in Chromium (headless Chrome and Playwright). Safari and Firefox have not been tested.
- Fonts load from Google Fonts. Self-host them if a client needs no third-party requests.
- On phones the **Desktop** preview is shown at about 27% scale. It's readable as an overview, and the Mobile preview is the default there.
- The hero preview is display-only. The full interactive demo is in the Showcase or at `demo/before/` and `demo/after/`.
- `npm audit` reports 4 moderate advisories in ESLint's dev-only dependency chain (`minimatch`). Nothing from them ships in `site/`.
