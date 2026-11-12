/**
 * Pure helpers for the scaled demo frames (unit-tested in tests/frame-math.test.js).
 */

/** Scale that fits a `viewportWidth` page into `available` CSS pixels, never above 1. */
export function fitScale(available, viewportWidth) {
  if (!(viewportWidth > 0) || !(available > 0)) return 1;
  return Math.min(1, available / viewportWidth);
}

/** Rendered frame size (including its 1px border on each side) for a scaled viewport. */
export function frameSize(viewportWidth, viewportHeight, scale) {
  return {
    width: Math.round(viewportWidth * scale + 2),
    height: Math.round(viewportHeight * scale + 2),
  };
}

/**
 * Map a pointer x offset inside the compare stage to the 0-100 split value,
 * matching the CSS: split = inset + (width - 2 * inset) * pos / 100.
 */
export function splitPercent(x, width, inset) {
  const track = width - 2 * inset;
  if (!(track > 0)) return 50;
  const pos = ((x - inset) / track) * 100;
  return Math.min(100, Math.max(0, pos));
}
