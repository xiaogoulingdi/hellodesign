import { clamp } from "../utils/math.js";

export function createAppState({ root, scrollShell }) {
  return {
    root,
    scrollShell,
    time: 0,
    soundOn: true,
    scrollProgress: 0,
    pointer: {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      tx: window.innerWidth / 2,
      ty: window.innerHeight / 2
    },
    updateFrame(now) {
      this.time = now;
      const scrollRange = Math.max(scrollShell.scrollHeight - scrollShell.clientHeight, 1);
      this.scrollProgress = clamp(
        scrollShell.scrollTop / Math.min(scrollRange, window.innerHeight * 1.1),
        0,
        1
      );
      this.pointer.x += (this.pointer.tx - this.pointer.x) * 0.08;
      this.pointer.y += (this.pointer.ty - this.pointer.y) * 0.08;
    },
    setPointer(x, y) {
      this.pointer.tx = x;
      this.pointer.ty = y;
    },
    isDark() {
      return root.classList.contains("dark");
    }
  };
}
