// AFTER state: the fixed scripts for the fictional Sabai Move Studio demo.
import { matchesCategory } from "./filter.js";

// Fix 1: the class filter.
// Both sides are normalised before comparing, the pressed state moves to the
// chosen button, and a live region announces how many classes are shown.
const filterButtons = document.querySelectorAll("[data-filter]");
const sessions = document.querySelectorAll("[data-category]");
const resultCount = document.querySelector("[data-result-count]");

function applyFilter(filter) {
  let shown = 0;
  sessions.forEach((session) => {
    const match = matchesCategory(session.dataset.category, filter);
    session.hidden = !match;
    if (match) shown += 1;
  });
  filterButtons.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.filter === filter),
    );
  });
  if (resultCount) resultCount.textContent = `แสดง ${shown} คลาส`;
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => applyFilter(button.dataset.filter));
});

// Fix 2: the mobile menu.
// A real <button> with aria-expanded; JS and CSS share one state attribute.
const menuButton = document.querySelector("[data-menu-button]");
const menu = document.getElementById(
  menuButton?.getAttribute("aria-controls") ?? "",
);

function setMenu(open) {
  if (!menuButton || !menu) return;
  menuButton.setAttribute("aria-expanded", String(open));
  menu.dataset.open = String(open);
}

menuButton?.addEventListener("click", () => {
  setMenu(menuButton.getAttribute("aria-expanded") !== "true");
});

menu?.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuButton?.getAttribute("aria-expanded") === "true"
  ) {
    setMenu(false);
    menuButton.focus();
  }
});

// In-page links scroll this document only, so the portfolio page that
// embeds the demo does not jump.
document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const target = document.getElementById(link.getAttribute("href").slice(1));
  if (!target) return;
  event.preventDefault();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const top = target.getBoundingClientRect().top + window.scrollY - 72;
  window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
});
