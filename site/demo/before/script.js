// DEMO ONLY: the BEFORE state's script, intentionally buggy.
// It passes ESLint, but it still does the wrong thing at runtime.

// Bug 1: the class filter.
// The buttons send "Yoga" / "Pilates" / "Stretch", but each row stores
// "yoga" / "pilates" / "stretch". The strict comparison never matches,
// so every row is hidden. The old "active" class is also never removed.
const buttons = document.querySelectorAll(".filter-btn");
const items = document.querySelectorAll(".class-item");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.getAttribute("data-filter");
    button.classList.add("active");

    items.forEach((item) => {
      if (filter === "all" || item.getAttribute("data-category") === filter) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
    });
  });
});

// Bug 2: the mobile menu.
// The script toggles "active", but the stylesheet only shows the menu for
// ".nav-links.show". The toggle is also a <div>, so a keyboard cannot reach it.
const burger = document.querySelector(".hamburger");
const nav = document.getElementById("navLinks");

burger.addEventListener("click", () => {
  nav.classList.toggle("active");
});
