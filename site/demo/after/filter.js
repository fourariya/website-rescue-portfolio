/**
 * Pure helpers for the class filter (unit-tested in tests/filter.test.js).
 */

/** Normalise a category value so "Yoga ", "yoga" and "YOGA" compare equal. */
export function normalizeCategory(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

/** True when an item with `itemCategory` should show under `filter`. */
export function matchesCategory(itemCategory, filter) {
  const wanted = normalizeCategory(filter);
  return (
    wanted === "" ||
    wanted === "all" ||
    normalizeCategory(itemCategory) === wanted
  );
}

/** Count how many categories in `categories` match `filter`. */
export function countMatches(categories, filter) {
  return categories.filter((category) => matchesCategory(category, filter))
    .length;
}
