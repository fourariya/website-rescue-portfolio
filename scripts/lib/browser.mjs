// Shared helpers for the e2e and screenshot scripts: a static server for
// site/ and a headless Chrome/Edge launched through puppeteer-core.
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

export const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
export const SITE = join(ROOT, "site");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".json": "application/json",
};

/** Serve site/ on a random local port. Resolves to { url, close }. */
export function serveSite() {
  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      let file = normalize(join(SITE, path));
      if (!file.startsWith(SITE)) {
        res.writeHead(403).end();
        return;
      }
      if ((await stat(file).catch(() => null))?.isDirectory())
        file = join(file, "index.html");
      const body = await readFile(file);
      res.writeHead(200, {
        "content-type": TYPES[extname(file)] ?? "application/octet-stream",
      });
      res.end(body);
    } catch {
      res.writeHead(404).end("Not found");
    }
  });
  return new Promise((done) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      done({ url: `http://127.0.0.1:${port}/`, close: () => server.close() });
    });
  });
}

const CHROMES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

export async function launch() {
  const executablePath = CHROMES.find((p) => p && existsSync(p));
  if (!executablePath) {
    throw new Error(
      "No Chrome or Edge found. Set CHROME_PATH to a Chromium-based browser.",
    );
  }
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--hide-scrollbars"],
  });
}

/** Wait until web fonts are ready in the page and every iframe has loaded. */
export async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const frames = [...document.querySelectorAll("iframe")];
    await Promise.all(
      frames.map(
        (f) =>
          new Promise((ok) => {
            try {
              if (f.contentDocument?.readyState === "complete") return ok();
            } catch {
              return ok();
            }
            f.addEventListener("load", ok, { once: true });
            setTimeout(ok, 4000);
          }),
      ),
    );
    for (const f of frames) {
      try {
        await f.contentDocument?.fonts?.ready;
      } catch {
        // cross-origin or not loaded: nothing to wait for
      }
    }
  });
  await new Promise((ok) => setTimeout(ok, 300));
}
