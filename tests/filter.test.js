import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countMatches,
  matchesCategory,
  normalizeCategory,
} from "../site/demo/after/filter.js";

const categories = [
  "yoga",
  "pilates",
  "stretch",
  "yoga",
  "pilates",
  "stretch",
  "yoga",
];

test("the BEFORE comparison is the bug: a strict compare of 'Yoga' with 'yoga' never matches", () => {
  const buggy = (itemCategory, filter) =>
    filter === "all" || itemCategory === filter;
  assert.equal(categories.filter((c) => buggy(c, "Yoga")).length, 0);
  assert.equal(categories.filter((c) => buggy(c, "Pilates")).length, 0);
});

test("the AFTER filter matches regardless of case and spacing", () => {
  assert.equal(matchesCategory("yoga", "Yoga"), true);
  assert.equal(matchesCategory(" Pilates ", "pilates"), true);
  assert.equal(matchesCategory("stretch", "Yoga"), false);
});

test("'all' and an empty filter show every class", () => {
  assert.equal(countMatches(categories, "all"), categories.length);
  assert.equal(countMatches(categories, ""), categories.length);
});

test("filter counts match the demo schedule", () => {
  assert.equal(countMatches(categories, "Yoga"), 3);
  assert.equal(countMatches(categories, "Pilates"), 2);
  assert.equal(countMatches(categories, "Stretch"), 2);
});

test("normalizeCategory handles missing values", () => {
  assert.equal(normalizeCategory(undefined), "");
  assert.equal(normalizeCategory(null), "");
});
