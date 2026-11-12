import { test } from "node:test";
import assert from "node:assert/strict";
import { fitScale, frameSize, splitPercent } from "../site/src/frame-math.js";

test("fitScale shrinks a 1280px page into the available width", () => {
  assert.equal(fitScale(640, 1280), 0.5);
});

test("fitScale never enlarges past 1 and guards bad input", () => {
  assert.equal(fitScale(1600, 1280), 1);
  assert.equal(fitScale(0, 1280), 1);
  assert.equal(fitScale(500, 0), 1);
});

test("frameSize includes the 1px border on both sides", () => {
  assert.deepEqual(frameSize(375, 667, 1), { width: 377, height: 669 });
  assert.deepEqual(frameSize(1280, 800, 0.5), { width: 642, height: 402 });
});

test("splitPercent maps the pointer to 0-100 inside the thumb insets", () => {
  assert.equal(splitPercent(22, 644, 22), 0);
  assert.equal(splitPercent(322, 644, 22), 50);
  assert.equal(splitPercent(622, 644, 22), 100);
  assert.equal(splitPercent(-50, 644, 22), 0);
  assert.equal(splitPercent(900, 644, 22), 100);
  assert.equal(splitPercent(10, 20, 22), 50);
});
