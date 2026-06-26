export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function easeInOut(value) {
  return value * value * (3 - 2 * value);
}
