import { clamp, damp } from "../utils/math.js";

export function createTimelineState({ totalScroll }) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let touchY = null;
  let lastPosition = 0;

  const state = {
    totalScroll,
    target: 0,
    position: 0,
    velocity: 0,
    direction: 1,
    time: 0,
    delta: 1 / 60,
    pointer: {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      nx: 0,
      ny: 0,
      speed: 0
    },
    setTarget(value) {
      this.target = clamp(value, 0, totalScroll);
    },
    addScroll(deltaY) {
      const normalized = deltaY / Math.max(window.innerHeight, 540);
      this.direction = Math.sign(deltaY) || this.direction;
      this.setTarget(this.target + normalized * 1.06);
    },
    setPointer(x, y, movement = 0) {
      this.pointer.x = x;
      this.pointer.y = y;
      this.pointer.nx = (x / window.innerWidth) * 2 - 1;
      this.pointer.ny = -((y / window.innerHeight) * 2 - 1);
      this.pointer.speed = Math.min(1, movement / 42);
    },
    update(now, deltaSeconds) {
      this.time = now;
      this.delta = Math.min(deltaSeconds, 0.05);
      this.position = reducedMotion
        ? this.target
        : damp(this.position, this.target, 8.5, this.delta);
      this.velocity = damp(
        this.velocity,
        (this.position - lastPosition) / Math.max(this.delta, 0.001),
        10,
        this.delta
      );
      this.pointer.speed = damp(this.pointer.speed, 0, 5, this.delta);
      lastPosition = this.position;
    }
  };

  window.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      state.addScroll(event.deltaY);
    },
    { passive: false }
  );

  window.addEventListener(
    "touchstart",
    (event) => {
      touchY = event.touches[0]?.clientY ?? null;
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    (event) => {
      const nextY = event.touches[0]?.clientY;
      if (touchY === null || nextY === undefined) return;
      event.preventDefault();
      state.addScroll((touchY - nextY) * 2.4);
      touchY = nextY;
    },
    { passive: false }
  );

  window.addEventListener("keydown", (event) => {
    const step = event.key === "PageDown" || event.key === "PageUp" ? 0.9 : 0.36;
    if (["ArrowDown", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      state.setTarget(state.target + step);
    }
    if (["ArrowUp", "PageUp"].includes(event.key)) {
      event.preventDefault();
      state.setTarget(state.target - step);
    }
    if (event.key === "Home") state.setTarget(0);
    if (event.key === "End") state.setTarget(totalScroll);
  });

  return state;
}
