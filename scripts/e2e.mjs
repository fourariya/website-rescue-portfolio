// End-to-end checks in headless Chrome: npm run test:e2e
// Proves the BEFORE bugs reproduce, the AFTER fixes work, and the portfolio
// itself has no console errors, no horizontal overflow and working controls.
import { launch, serveSite, settle } from "./lib/browser.mjs";

const FASTWORK_URL = "https://fastwork.com/user/four";
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`,
  );
}

const server = await serveSite();
const browser = await launch();

async function open(path, width, height = 800) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("requestfailed", (req) =>
    errors.push(`request failed: ${req.url()}`),
  );
  await page.setViewport({ width, height });
  await page.goto(server.url + path, { waitUntil: "networkidle0" });
  await settle(page);
  return { page, errors };
}

const visibleRows = (page, selector) =>
  page.$$eval(
    selector,
    (rows) => rows.filter((r) => r.offsetParent !== null).length,
  );

try {
  /* ---- BEFORE demo: the bugs are real ---- */
  {
    const { page } = await open("demo/before/", 1280);
    await page.click('.filter-btn[data-filter="Pilates"]');
    const shown = await visibleRows(page, ".class-item");
    check(
      "Before: filter 'Pilates' hides every row (bug reproduces)",
      shown === 0,
      `${shown} rows`,
    );

    const blocked = await page.evaluate(() => {
      const btn = document.querySelector(".btn-main");
      const r = btn.getBoundingClientRect();
      const hit = document.elementFromPoint(
        r.left + r.width / 2,
        r.top + r.height / 2,
      );
      return !btn.contains(hit) ? hit.className : "";
    });
    check(
      "Before: main button is covered by another layer",
      blocked !== "",
      `hit .${blocked}`,
    );
    await page.mouse.click(...(await centre(page, ".btn-main")));
    await new Promise((ok) => setTimeout(ok, 400));
    const y = await page.evaluate(() => window.scrollY);
    check(
      "Before: mouse click on main button does not scroll",
      y === 0,
      `scrollY ${y}`,
    );
    await page.close();
  }
  {
    const { page } = await open("demo/before/", 375, 667);
    const width = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    check(
      "Before: page overflows a 375px screen",
      width > 375,
      `scrollWidth ${width}`,
    );
    await page.click(".hamburger");
    const navShown = await page.$eval(
      "#navLinks",
      (n) => getComputedStyle(n).display !== "none",
    );
    check("Before: tapping the menu button does not open the menu", !navShown);
    const focusable = await page.$eval(".hamburger", (el) => el.tabIndex >= 0);
    check("Before: menu toggle is not keyboard-focusable", !focusable);
    await page.close();
  }

  /* ---- AFTER demo: the fixes work ---- */
  {
    const { page, errors } = await open("demo/after/", 1280);
    await page.click('[data-filter="Pilates"]');
    const shown = await visibleRows(page, "tbody tr");
    const count = await page.$eval("[data-result-count]", (el) =>
      el.textContent.trim(),
    );
    const pressed = await page.$eval('[data-filter="Pilates"]', (b) =>
      b.getAttribute("aria-pressed"),
    );
    check(
      "After: filter 'Pilates' shows 2 classes",
      shown === 2,
      `${shown} rows, "${count}"`,
    );
    check("After: chosen filter is aria-pressed", pressed === "true");
    await page.click('.hero a[href="#schedule"]');
    await new Promise((ok) => setTimeout(ok, 900));
    const y = await page.evaluate(() => window.scrollY);
    check(
      "After: main button scrolls to the schedule",
      y > 200,
      `scrollY ${y}`,
    );
    check("After: no console errors", errors.length === 0, errors.join(" | "));
    await page.close();
  }
  {
    const { page } = await open("demo/after/", 375, 667);
    const width = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    check(
      "After: no horizontal overflow at 375px",
      width <= 375,
      `scrollWidth ${width}`,
    );
    await page.click("[data-menu-button]");
    const open1 = await page.$eval(
      "#site-menu",
      (n) => getComputedStyle(n).display !== "none",
    );
    check("After: menu button opens the menu", open1);
    await page.keyboard.press("Escape");
    const closed = await page.$eval(
      "#site-menu",
      (n) => getComputedStyle(n).display === "none",
    );
    const expanded = await page.$eval("[data-menu-button]", (b) =>
      b.getAttribute("aria-expanded"),
    );
    check("After: Escape closes the menu", closed && expanded === "false");
    const small = await page.$$eval("button, .btn, .site-nav a", (els) =>
      els
        .filter((e) => e.offsetParent && e.getBoundingClientRect().height < 44)
        .map((e) => e.textContent.trim()),
    );
    check(
      "After: visible controls are at least 44px tall",
      small.length === 0,
      small.join(", "),
    );
    await page.close();
  }

  /* ---- Portfolio ---- */
  for (const width of [320, 375, 414, 768, 1024, 1280, 1440, 1920]) {
    const { page, errors } = await open("", width, 900);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    check(
      `Portfolio ${width}px: no horizontal overflow`,
      overflow <= 0,
      `extra ${overflow}px`,
    );
    if (width === 1280 || width === 375) {
      check(
        `Portfolio ${width}px: no console or request errors`,
        errors.length === 0,
        errors.join(" | "),
      );
    }
    await page.close();
  }

  {
    const { page } = await open("", 1440, 900);
    const broken = await page.$$eval("img", async (imgs) => {
      // Lazy images only load near the viewport: force them, then decode.
      await Promise.all(
        imgs.map((i) => {
          i.loading = "eager";
          return i.decode().catch(() => {});
        }),
      );
      return imgs.filter((i) => !i.naturalWidth).map((i) => i.src);
    });
    check(
      "Portfolio: every image loads",
      broken.length === 0,
      broken.join(", "),
    );

    await page.click('label[for="v-after"]');
    const afterOn = await page.$eval(
      'iframe[data-version="after"]',
      (f) => !f.hasAttribute("data-off"),
    );
    const beforeOff = await page.$eval('iframe[data-version="before"]', (f) =>
      f.hasAttribute("data-off"),
    );
    check(
      "Showcase: After toggle shows the After site only",
      afterOn && beforeOff,
    );
    await page.click('label[for="d-mobile"]');
    const device = await page.$eval("[data-showcase-frame]", (f) => ({
      device: f.dataset.device,
      width: Math.round(f.getBoundingClientRect().width),
    }));
    const status = await page.$eval(
      "[data-showcase-status]",
      (s) => s.textContent,
    );
    check(
      "Showcase: Mobile mode renders a 375px viewport",
      device.device === "mobile" && device.width === 377,
      `${device.width}px frame, "${status.trim()}"`,
    );

    await page.focus("#tab-1");
    await page.keyboard.press("ArrowDown");
    const tabState = await page.evaluate(() => ({
      selected: document.activeElement.id,
      panel2: !document.getElementById("fix-2").hidden,
      panel1: document.getElementById("fix-1").hidden,
    }));
    check(
      "Breakdown: ArrowDown moves to tab 2 and shows its panel",
      tabState.selected === "tab-2" && tabState.panel2 && tabState.panel1,
    );

    await page.focus("[data-compare-range]");
    await page.keyboard.press("ArrowRight");
    const pos = await page.$eval("[data-compare]", (el) =>
      el.style.getPropertyValue("--pos"),
    );
    check(
      "Hero compare: arrow key moves the split",
      pos === "51",
      `--pos ${pos}`,
    );

    // Clicking an in-page link inside the BEFORE demo must not move the portfolio page.
    await page.click('label[for="v-before"]');
    await page.click('label[for="d-desktop"]');
    await page.evaluate(() =>
      document.getElementById("showcase").scrollIntoView(),
    );
    const yBefore = await page.evaluate(() => window.scrollY);
    const frame = await (
      await page.$('iframe[data-version="before"]')
    ).contentFrame();
    await frame.evaluate(() =>
      document.querySelector('.nav-links a[href="#packages"]').click(),
    );
    await new Promise((ok) => setTimeout(ok, 500));
    const yAfter = await page.evaluate(() => window.scrollY);
    check(
      "Isolation: link inside the Before demo leaves the portfolio scroll alone",
      yBefore === yAfter,
      `${yBefore} -> ${yAfter}`,
    );

    // Contact CTA: a real click must target the Fastwork profile in a new tab.
    // The navigation itself is cancelled so the test makes no external request.
    const link = await page.$eval("[data-fastwork-link]", (a) => ({
      href: a.href,
      target: a.target,
      rel: a.rel.split(/\s+/).sort().join(" "),
    }));
    // The old "link not set" placeholder must be gone from the source itself,
    // not just hidden by CSS (page source, reader mode and previews show it).
    const source = await (await fetch(server.url)).text();
    check(
      "Contact: no placeholder text left in the page source",
      !source.includes("ยังไม่ได้ใส่ลิงก์") && !source.includes('class="fill"'),
    );
    await page.evaluate(() => {
      document.addEventListener(
        "click",
        (event) => {
          const a = event.target.closest("[data-fastwork-link]");
          if (!a) return;
          window.__ctaClick = { href: a.href, target: a.target };
          event.preventDefault();
        },
        { capture: true, once: true },
      );
    });
    await page.click("[data-fastwork-link]");
    const clicked = await page.evaluate(() => window.__ctaClick ?? null);
    check(
      "Contact: CTA clicks through to the Fastwork profile in a new tab",
      link.href === FASTWORK_URL &&
        clicked?.href === FASTWORK_URL &&
        clicked?.target === "_blank" &&
        link.rel === "noopener noreferrer",
      `${clicked?.href} target=${clicked?.target} rel="${link.rel}"`,
    );
    const navContact = await page.$eval('.nav__links a[href="#contact"]', (a) =>
      a.getAttribute("target"),
    );
    check(
      "Contact: nav 'ติดต่อ' still scrolls to the in-page section",
      navContact === null,
    );
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}

async function centre(page, selector) {
  const box = await (await page.$(selector)).boundingBox();
  return [box.x + box.width / 2, box.y + box.height / 2];
}

const failed = results.filter((r) => !r.ok);
console.log(
  `\n${results.length - failed.length}/${results.length} checks passed`,
);
process.exitCode = failed.length ? 1 : 0;
