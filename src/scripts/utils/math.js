export function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

export function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

export function inverseLerp(from, to, value) {
  if (from === to) return 0;
  return clamp((value - from) / (to - from));
}

export function smoothstep(value) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

export function smootherstep(value) {
  const t = clamp(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function damp(current, target, speed, deltaSeconds) {
  return lerp(current, target, 1 - Math.exp(-speed * deltaSeconds));
}

export function seeded(index, salt = 0) {
  const value = Math.sin(index * 91.737 + salt * 37.17) * 43758.5453;
  return value - Math.floor(value);
}
