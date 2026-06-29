import { stickerConfig } from "../config/stickers.js";
import { clamp, inverseLerp, lerp, seeded, smoothstep } from "../utils/math.js";

export function createStickerLayer({ container, state }) {
  const bornAt = performance.now();
  state.stickers = stickerConfig.map((token) => ({
    src: token.src,
    index: token.index,
    size: token.size,
    x: 0,
    y: -token.size * 2,
    cx: 0,
    cy: -token.size,
    rotation: token.rotation,
    scale: 1,
    opacity: 0,
    visible: false
  }));
  const stickers = stickerConfig.map((token) => {
    const image = new Image();
    image.className = "sticker";
    image.alt = "";
    image.decoding = "async";
    image.src = token.src;
    image.style.setProperty("--sticker-size", `${token.size}px`);
    container.append(image);
    return {
      image,
      token
    };
  });

  const ready = Promise.all(
    stickers.map(({ image }) =>
      image.decode().catch(() => undefined)
    )
  );

  function renderSticker(entry, progress, mode) {
    const { image, token } = entry;
    const timeProgress = clamp((state.time - bornAt) / 3200);
    const introProgress = mode === "hero" ? Math.max(progress, timeProgress) : progress;
    const intro = smoothstep(clamp((introProgress - token.delay) / Math.max(0.1, 1 - token.delay)));
    const sceneFade = mode === "hero"
      ? 1 - smoothstep(inverseLerp(2.55, 3.0, state.position))
      : smoothstep(inverseLerp(14.75, 15.25, state.position));
    const opacity = clamp(intro * 1.25) * sceneFade;
    const shared = state.stickers[token.index];
    if (opacity <= 0.001) {
      image.style.opacity = "0";
      if (shared) {
        shared.opacity = 0;
        shared.visible = false;
      }
      return;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const t = state.time * 0.001;
    const cycle = mode === "hero"
      ? 8.4 + seeded(token.index, 10) * 4.2
      : 7.2 + seeded(token.index, 11) * 4.8;
    const phase = (t / cycle + token.delay + seeded(token.index, mode === "hero" ? 12 : 13) * 0.72) % 1;
    const easedFall = phase * phase * (3 - 2 * phase);
    const startY = -token.size * (1.8 + seeded(token.index, 2) * 1.4);
    const endY = h + token.size * (1.1 + seeded(token.index, 3));
    const lane = (token.x + (mode === "contact" ? seeded(token.index, 5) * 0.18 : 0)) % 1;
    const xBase = lane * w - token.size / 2;
    const sway = Math.sin(t * (0.82 + seeded(token.index, 8) * 0.54) + token.index * 1.9) * token.drift * 0.56;
    const flutter = Math.sin(t * (2.1 + seeded(token.index, 9) * 0.8) + token.index) * 13;
    const y = lerp(startY, endY, easedFall);
    const x = xBase + sway + flutter;

    const rotation = token.rotation
      + Math.sin(t * (1.25 + seeded(token.index, 4)) + token.index) * 18
      + phase * (token.index % 2 ? -96 : 96);
    const scale = 0.88 + intro * 0.12;

    if (shared) {
      shared.x = x;
      shared.y = y;
      shared.cx = x + token.size * scale * 0.5;
      shared.cy = y + token.size * scale * 0.5;
      shared.rotation = rotation;
      shared.scale = scale;
      shared.opacity = opacity;
      shared.visible = true;
    }

    image.style.setProperty("--sticker-x", `${x.toFixed(2)}px`);
    image.style.setProperty("--sticker-y", `${y.toFixed(2)}px`);
    image.style.setProperty("--sticker-r", `${rotation.toFixed(2)}deg`);
    image.style.setProperty("--sticker-scale", scale.toFixed(3));
    image.style.opacity = String(opacity);
  }

  function render() {
    const heroProgress = inverseLerp(0.05, 1.75, state.position);
    const contactProgress = inverseLerp(14.75, 16.65, state.position);
    const mode = contactProgress > 0 ? "contact" : "hero";

    stickers.forEach((entry, index) => {
      const progress = mode === "contact"
        ? contactProgress * entry.token.speed
        : index < 12
          ? heroProgress * entry.token.speed
          : 0;
      renderSticker(entry, progress, mode);
    });
  }

  return { ready, render };
}
