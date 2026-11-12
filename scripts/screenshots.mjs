// Repeatable screenshots: npm run screenshots
// 1. Captures real states of the demo (before/after, desktop/mobile, filter clicked).
// 2. Writes the two UI crops the portfolio page shows (site/assets/ui-*.png).
// 3. Composes the six 1280 x 720 Fastwork images in screenshots/ from those captures
//    and from the portfolio page itself. Nothing is drawn or invented.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ROOT, SITE, launch, serveSite, settle } from "./lib/browser.mjs";

const OUT = join(ROOT, "screenshots");
const ASSETS = join(SITE, "assets");
const W = 1280;
const H = 720;

await mkdir(OUT, { recursive: true });
await mkdir(ASSETS, { recursive: true });

const server = await serveSite();
const browser = await launch();

async function capture(
  path,
  { width, height, dpr = 1, prepare, clip, scrollTo },
) {
  const page = await browser.newPage();
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.setViewport({ width, height, deviceScaleFactor: dpr });
  await page.goto(server.url + path, { waitUntil: "networkidle0" });
  await settle(page);
  if (prepare) await prepare(page);
  if (scrollTo) {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
    }, scrollTo);
    await new Promise((ok) => setTimeout(ok, 400));
  }
  let region;
  if (typeof clip === "function") region = await clip(page);
  const buffer = await page.screenshot({
    type: "png",
    ...(region ? { clip: region } : {}),
  });
  await page.close();
  return buffer;
}

/** Clip a band starting at a section: 1120px is the shared content width; promo crops use less. */
const band =
  (selector, height, width = 1120) =>
  async (page) => {
    const top = await page.$eval(
      selector,
      (el) => el.getBoundingClientRect().top + window.scrollY,
    );
    return { x: 80, y: Math.max(0, top), width, height };
  };

const clickFilter = (selector) => async (page) => {
  await page.click(selector);
  await new Promise((ok) => setTimeout(ok, 200));
};

console.log("capturing demo states...");
const shots = {
  beforeDesktop: await capture("demo/before/", { width: 1280, height: 800 }),
  afterDesktop: await capture("demo/after/", { width: 1280, height: 800 }),
  beforeMobile: await capture("demo/before/", {
    width: 375,
    height: 667,
    dpr: 2,
  }),
  afterMobile: await capture("demo/after/", {
    width: 375,
    height: 667,
    dpr: 2,
  }),
  beforeFilter: await capture("demo/before/", {
    width: 1280,
    height: 800,
    dpr: 2,
    prepare: clickFilter('.filter-btn[data-filter="Pilates"]'),
    clip: band("#schedule", 400, 760),
  }),
  afterFilter: await capture("demo/after/", {
    width: 1280,
    height: 800,
    dpr: 2,
    prepare: clickFilter('[data-filter="Pilates"]'),
    clip: band("#schedule", 400, 760),
  }),
  beforePackages: await capture("demo/before/", {
    width: 1280,
    height: 800,
    dpr: 2,
    clip: band("#packages", 440),
  }),
  afterPackages: await capture("demo/after/", {
    width: 1280,
    height: 800,
    dpr: 2,
    clip: band("#packages", 440),
  }),
  beforePackagesPromo: await capture("demo/before/", {
    width: 1280,
    height: 800,
    dpr: 2,
    clip: band("#packages", 440, 760),
  }),
  afterPackagesPromo: await capture("demo/after/", {
    width: 1280,
    height: 800,
    dpr: 2,
    clip: band("#packages", 440, 760),
  }),
};

await writeFile(join(ASSETS, "ui-before.png"), shots.beforePackages);
await writeFile(join(ASSETS, "ui-after.png"), shots.afterPackages);
console.log("wrote site/assets/ui-before.png and ui-after.png (2240 x 880)");

if (process.argv.includes("--assets-only")) {
  await browser.close();
  server.close();
  process.exit(0);
}

/* ---------- Composition page, styled with the portfolio's own tokens ---------- */

const tokens = await readFile(join(SITE, "src", "tokens.css"), "utf8");
const uri = (buffer) => `data:image/png;base64,${buffer.toString("base64")}`;

function composeHTML({ title, sub, layout = "row", items }) {
  const figures = items
    .map(
      (item) => `<figure class="shot shot--${item.kind}">
        <div class="frame"><img src="${uri(item.src)}" alt=""></div>
        <figcaption><span class="tag tag--${item.kind}">${item.kind === "before" ? "Before" : "After"}</span>${item.caption}</figcaption>
      </figure>`,
    )
    .join("");
  return `<!doctype html><html lang="th"><head><meta charset="utf-8">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600&family=IBM+Plex+Sans+Thai:wght@400;500&display=swap">
  <style>${tokens}
  * { box-sizing: border-box; }
  html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; }
  body { background: var(--color-paper); color: var(--color-ink); font: 400 16px/1.5 var(--font-body); }
  .canvas { display: grid; grid-template-rows: auto 1fr auto; gap: 24px; height: 100%; padding: 36px 48px 24px; }
  .canvas--side { grid-template-columns: 360px 1fr; grid-template-rows: 1fr auto; column-gap: 48px; }
  .brand { margin: 0 0 10px; font: 600 15px/1 var(--font-display); letter-spacing: 0.02em; text-transform: uppercase; color: var(--color-ink-2); }
  h1 { margin: 0; font: 600 40px/1.05 var(--font-display); text-transform: uppercase; letter-spacing: -0.012em; }
  .sub { margin: 10px 0 0; font-size: 18px; color: var(--color-ink-2); max-width: 60ch; }
  .canvas--side header { align-self: center; }
  .canvas--side h1 { font-size: 44px; }
  .grid { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 32px; min-height: 0; align-items: center; }
  .canvas--side .grid { grid-auto-columns: auto; justify-content: start; align-items: stretch; }
  .shot { display: grid; grid-template-rows: auto auto; gap: 10px; margin: 0; min-height: 0; }
  .frame { min-height: 0; border: 1px solid var(--color-rule); outline: 1px solid var(--color-rule-2); outline-offset: 4px; background: var(--color-paper-3); overflow: hidden; }
  .frame img { display: block; width: 100%; height: auto; object-fit: contain; object-position: top center; }
  .canvas--side .shot { grid-template-rows: minmax(0, 1fr) auto; }
  .canvas--side .frame img { width: auto; height: 100%; }
  figcaption { display: flex; align-items: baseline; gap: 10px; font-size: 15px; color: var(--color-ink-2); }
  .tag { padding: 2px 8px; font-size: 14px; font-weight: 500; border: 1px solid var(--color-rule); background: var(--color-paper-3); color: var(--color-ink); white-space: nowrap; }
  .tag--after { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-accent-ink); }
  .note { grid-column: 1 / -1; margin: 0; padding-top: 10px; border-top: 1px solid var(--color-rule-2); font-size: 13px; color: var(--color-muted); }
  </style></head><body>
  <main class="canvas canvas--${layout}">
    <header><p class="brand">Website Rescue</p><h1>${title}</h1><p class="sub">${sub}</p></header>
    <div class="grid">${figures}</div>
    <p class="note">โปรเจกต์สาธิต: เว็บไซต์ในภาพเป็นธุรกิจสมมติ (Sabai Move Studio) ภาพทั้งหมดจับจากเดโมที่ทำงานจริง</p>
  </main></body></html>`;
}

async function compose(file, spec) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.setContent(composeHTML(spec), { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUT, file), type: "png" });
  await page.close();
  console.log(`wrote screenshots/${file}`);
}

/** The portfolio page itself, rendered at 1440 x 810 and saved at 1280 x 720. */
async function portfolio(file, scrollTo) {
  const buffer = await capture("", {
    width: 1440,
    height: 810,
    dpr: W / 1440,
    scrollTo,
  });
  await writeFile(join(OUT, file), buffer);
  console.log(`wrote screenshots/${file}`);
}

await portfolio("01-cover.png");

await compose("02-before-after-desktop.png", {
  title: "Before / After บน Desktop",
  sub: "เว็บเดียวกัน เนื้อหาเดียวกัน ที่ความกว้าง 1280 px",
  items: [
    {
      kind: "before",
      src: shots.beforeDesktop,
      caption: "ลำดับความสำคัญไม่ชัด ปุ่มหลักกดไม่ติด",
    },
    {
      kind: "after",
      src: shots.afterDesktop,
      caption: "หัวข้อชัด ปุ่มเป็นระบบเดียว กดได้จริง",
    },
  ],
});

await compose("03-before-after-mobile.png", {
  layout: "side",
  title: "Responsive Fix บนมือถือ",
  sub: "หน้าจอ 375 × 667 px: Before ล้นจอและเมนูกดไม่ได้ After พอดีจอ ตัวอักษรอ่านง่าย",
  items: [
    { kind: "before", src: shots.beforeMobile, caption: "ล้นจอ 725 px" },
    { kind: "after", src: shots.afterMobile, caption: "พอดีจอ" },
  ],
});

await compose("04-bug-fix.png", {
  title: "Bug Fix: ตัวกรองคลาส",
  sub: "กดตัวกรอง Pilates เหมือนกันทั้งสองเวอร์ชัน",
  items: [
    {
      kind: "before",
      src: shots.beforeFilter,
      caption: "ตารางว่างทั้งหมด เพราะเทียบ “Pilates” กับ “pilates”",
    },
    {
      kind: "after",
      src: shots.afterFilter,
      caption: "แสดง 2 คลาส Pilates พร้อมบอกจำนวน",
    },
  ],
});

await compose("05-ui-improvement.png", {
  title: "UI Improvement: แพ็กเกจราคา",
  sub: "จัดระบบสี ตัวอักษร ระยะห่าง และปุ่มใหม่ โดยใช้เนื้อหาเดิม",
  items: [
    {
      kind: "before",
      src: shots.beforePackagesPromo,
      caption: "ปุ่มสามแบบ ราคาสามรูปแบบ การ์ดไม่เท่ากัน",
    },
    {
      kind: "after",
      src: shots.afterPackagesPromo,
      caption: "การ์ดเท่ากัน ปุ่มแบบเดียว ราคารูปแบบเดียว",
    },
  ],
});

await portfolio("06-services.png", "#services");

await browser.close();
server.close();
