// Website Rescue portfolio: page wiring. All deliberately broken code lives in
// demo/before/ and only runs inside its iframes; nothing here depends on it.
import { fitScale, frameSize, splitPercent } from "./frame-math.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const narrow = window.matchMedia("(max-width: 60rem)");

const DEVICES = {
  desktop: { width: 1280, height: 800, label: "Desktop" },
  mobile: { width: 375, height: 667, label: "Mobile" },
};

/* ---------- Navigation (menu under 60rem) ---------- */

const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.getElementById("nav-links");

function setNav(open) {
  navToggle?.setAttribute("aria-expanded", String(open));
  if (navLinks) navLinks.dataset.open = String(open);
}

navToggle?.addEventListener("click", () => {
  setNav(navToggle.getAttribute("aria-expanded") !== "true");
});

navLinks?.addEventListener("click", (event) => {
  if (event.target.closest("a")) setNav(false);
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    navToggle?.getAttribute("aria-expanded") === "true"
  ) {
    setNav(false);
    navToggle.focus();
  }
});

narrow.addEventListener("change", () => setNav(false));

/* ---------- Scaled live frames ---------- */

function fitFrame(frame) {
  const host = frame.parentElement;
  const vw = Number(frame.dataset.vw);
  const vh = Number(frame.dataset.vh);
  const scale = fitScale(host.clientWidth - 2, vw);
  frame.style.setProperty("--vw", String(vw));
  frame.style.setProperty("--vh", String(vh));
  frame.style.setProperty("--scale", String(scale));
  const { width } = frameSize(vw, vh, scale);
  host.style.setProperty("--frame-width", `${width}px`);
}

const frames = [...document.querySelectorAll("[data-frame]")];
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const frame = frames.find((f) => f.parentElement === entry.target);
    if (frame) fitFrame(frame);
  }
});
frames.forEach((frame) => {
  fitFrame(frame);
  resizeObserver.observe(frame.parentElement);
});

/* ---------- Hero: drag to compare ---------- */

const compare = document.querySelector("[data-compare]");
const compareRange = compare?.querySelector("[data-compare-range]");
const heroWidth = document.querySelector("[data-hero-width]");

function setSplit(value) {
  const pos = Math.round(Math.min(100, Math.max(0, value)));
  compare.style.setProperty("--pos", String(pos));
  compareRange.value = String(pos);
  compareRange.setAttribute(
    "aria-valuetext",
    `เส้นแบ่งอยู่ที่ ${pos}% Before ด้านซ้าย After ด้านขวา`,
  );
}

function setHeroDevice() {
  const device = narrow.matches
    ? DEVICES.mobile
    : { ...DEVICES.desktop, height: 900 };
  compare.dataset.vw = String(device.width);
  compare.dataset.vh = String(device.height);
  if (heroWidth) heroWidth.textContent = String(device.width);
  fitFrame(compare);
}

if (compare && compareRange) {
  setSplit(Number(compareRange.value));
  setHeroDevice();
  narrow.addEventListener("change", setHeroDevice);

  compareRange.addEventListener("input", () =>
    setSplit(Number(compareRange.value)),
  );

  let dragging = false;
  const fromPointer = (event) => {
    const rect = compare.getBoundingClientRect();
    setSplit(splitPercent(event.clientX - rect.left, rect.width, 22));
  };
  compare.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragging = true;
    compare.setPointerCapture(event.pointerId);
    fromPointer(event);
  });
  compare.addEventListener("pointermove", (event) => {
    if (dragging) fromPointer(event);
  });
  const stop = () => {
    dragging = false;
  };
  compare.addEventListener("pointerup", stop);
  compare.addEventListener("pointercancel", stop);
}

/* ---------- Isolation: demo links scroll the demo, not this page ---------- */

// A same-origin iframe that follows "#section" links also scrolls its parent
// page. Contain that here so the demo files stay exactly as written.
function containHashLinks(iframe) {
  const attach = () => {
    let doc;
    try {
      doc = iframe.contentDocument;
    } catch {
      return;
    }
    if (!doc || doc.__rescueContained) return;
    doc.__rescueContained = true;
    doc.addEventListener(
      "click",
      (event) => {
        const link = event.target.closest?.('a[href^="#"]');
        if (!link || event.defaultPrevented) return;
        event.preventDefault();
        const id = link.getAttribute("href").slice(1);
        const target = id ? doc.getElementById(id) : null;
        const win = iframe.contentWindow;
        const top = target
          ? target.getBoundingClientRect().top + win.scrollY
          : 0;
        win.scrollTo({
          top,
          behavior: reduceMotion.matches ? "auto" : "smooth",
        });
      },
      true,
    );
  };
  iframe.addEventListener("load", attach);
  attach();
}

document.querySelectorAll("iframe").forEach(containHashLinks);

/* ---------- Showcase: version and device ---------- */

const showcase = document.querySelector("[data-showcase]");
const showcaseFrame = showcase?.querySelector("[data-showcase-frame]");
const showcaseStatus = showcase?.querySelector("[data-showcase-status]");
const showcaseWidth = showcase?.querySelector("[data-showcase-width]");
const showcaseHeight = showcase?.querySelector("[data-showcase-height]");
const versionFrames = {
  before: showcase?.querySelector('iframe[data-version="before"]'),
  after: showcase?.querySelector('iframe[data-version="after"]'),
};

const state = {
  version: "before",
  device: narrow.matches ? "mobile" : "desktop",
};

function scrollRatio(iframe) {
  try {
    const win = iframe.contentWindow;
    const max = win.document.documentElement.scrollHeight - win.innerHeight;
    return max > 0 ? win.scrollY / max : 0;
  } catch {
    return 0;
  }
}

function applyScrollRatio(iframe, ratio) {
  try {
    const win = iframe.contentWindow;
    const max = win.document.documentElement.scrollHeight - win.innerHeight;
    win.scrollTo(0, Math.round(max * ratio));
  } catch {
    // The demo may not be loaded yet; leaving its scroll position is fine.
  }
}

function renderShowcase({ syncFrom } = {}) {
  if (!showcase || !showcaseFrame) return;
  const device = DEVICES[state.device];
  const ratio = syncFrom ? scrollRatio(versionFrames[syncFrom]) : null;

  for (const [version, iframe] of Object.entries(versionFrames)) {
    if (!iframe) continue;
    const on = version === state.version;
    iframe.toggleAttribute("data-off", !on);
    iframe.setAttribute("aria-hidden", String(!on));
    iframe.tabIndex = on ? 0 : -1;
  }

  showcaseFrame.dataset.vw = String(device.width);
  showcaseFrame.dataset.vh = String(device.height);
  showcaseFrame.dataset.device = state.device;
  fitFrame(showcaseFrame);

  if (ratio !== null) applyScrollRatio(versionFrames[state.version], ratio);

  showcase.dataset.showing = state.version;
  if (showcaseWidth) showcaseWidth.textContent = String(device.width);
  if (showcaseHeight) showcaseHeight.textContent = String(device.height);
  const versionLabel = state.version === "before" ? "Before" : "After";
  if (showcaseStatus) {
    showcaseStatus.textContent = `กำลังแสดง ${versionLabel} บนหน้าจอ ${device.label} กว้าง ${device.width} px`;
  }

  for (const input of showcase.querySelectorAll(
    'input[name="version"], input[name="device"]',
  )) {
    input.checked = input.value === state[input.name];
  }
}

showcase?.addEventListener("change", (event) => {
  const input = event.target;
  if (input.name === "version") {
    const previous = state.version;
    state.version = input.value;
    renderShowcase({ syncFrom: previous });
  } else if (input.name === "device") {
    state.device = input.value;
    state.deviceChosen = true;
    renderShowcase();
  }
});

// Until the visitor picks a device, follow the viewport: phones start in Mobile.
narrow.addEventListener("change", () => {
  if (state.deviceChosen) return;
  state.device = narrow.matches ? "mobile" : "desktop";
  renderShowcase();
});

renderShowcase();

/* ---------- Fix breakdown: tabs ---------- */

const tabList = document.querySelector('[data-tabs] [role="tablist"]');
const tabs = tabList ? [...tabList.querySelectorAll('[role="tab"]')] : [];

function selectTab(tab, { focus = false } = {}) {
  for (const other of tabs) {
    const selected = other === tab;
    other.setAttribute("aria-selected", String(selected));
    other.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(other.getAttribute("aria-controls"));
    if (panel) panel.hidden = !selected;
  }
  if (focus) tab.focus();
}

if (tabs.length) {
  selectTab(
    tabs.find((t) => t.getAttribute("aria-selected") === "true") ?? tabs[0],
  );
  tabList.addEventListener("click", (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) selectTab(tab);
  });
  tabList.addEventListener("keydown", (event) => {
    const index = tabs.indexOf(document.activeElement);
    if (index === -1) return;
    const moves = {
      ArrowDown: index + 1,
      ArrowRight: index + 1,
      ArrowUp: index - 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = (moves[event.key] + tabs.length) % tabs.length;
    selectTab(tabs[next], { focus: true });
  });
}

/* "ลองดูใน Showcase": jump to the showcase in the state the fix is about. */
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-demo]");
  if (!trigger || !showcase) return;
  const [version, device] = trigger.dataset.demo.split(" ");
  const previous = state.version;
  state.version = version;
  state.device = device;
  state.deviceChosen = true;
  renderShowcase({ syncFrom: previous !== version ? previous : undefined });
  showcase.scrollIntoView({
    behavior: reduceMotion.matches ? "auto" : "smooth",
    block: "start",
  });
  document.getElementById("showcase-title")?.focus({ preventScroll: true });
});

/* ---------- Footer year ---------- */

for (const el of document.querySelectorAll("[data-year]")) {
  el.textContent = String(new Date().getFullYear());
}

/* ---------- Focus ring for the live demos ---------- */

// Chrome does not match :focus on an <iframe> whose document holds focus,
// so mark the active demo frame here and draw its ring in CSS.
function markFocusedFrame() {
  for (const iframe of document.querySelectorAll("iframe")) {
    iframe.toggleAttribute("data-focused", iframe === document.activeElement);
  }
}
window.addEventListener("blur", () => setTimeout(markFocusedFrame, 0));
window.addEventListener("focus", markFocusedFrame);
document.addEventListener("focusin", markFocusedFrame);
