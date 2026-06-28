import { stickerConfig } from "../config/stickers.js";
import { clamp, inverseLerp, lerp, smoothstep } from "../utils/math.js";

export function createStickerLayer({ container, state }) {
  const stickers = stickerConfig.map((token) => {
    const image = new Image();
    image.className = "sticker";
    image.alt = "";
    image.decoding = "async";
    image.src = token.src;
    image.style.setProperty("--sticker-size", `${token.size}px`);
    container.append(image);
    return { image, token };
  });

  const ready = Promise.all(
    stickers.map(({ image }) =>
      image.decode().catch(() => undefined)
    )
  );

  function renderSticker(entry, progress, mode) {
    const { image, token } = entry;
    const local = smoothstep(clamp((progress - token.delay) / Math.max(0.1, 1 - token.delay)));
    if (local <= 0.001) {
      image.style.opacity = "0";
      return;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const xBase = token.x * w - token.size / 2;
    const drift = token.drift * Math.sin(local * Math.PI);
    const startY = -token.size * (1.5 + (token.index % 4) * 0.35);
    const endY = mode === "hero"
      ? h * (0.22 + ((token.index * 0.19) % 0.62))
      : h * (0.18 + ((token.index * 0.23) % 0.88));
    const bob = Math.sin(state.time * 0.0012 + token.index * 1.7) * 9 * local;
    const x = xBase + drift + Math.sin(state.time * 0.0004 + token.index) * 7;
    const y = lerp(startY, endY, local) + bob;
    const rotation = token.rotation + (1 - local) * (token.index % 2 ? -220 : 220);
    const fadeOut = mode === "hero" ? 1 - smoothstep(inverseLerp(2.35, 2.8, state.position)) : 1;

    image.style.setProperty("--sticker-x", `${x.toFixed(2)}px`);
    image.style.setProperty("--sticker-y", `${y.toFixed(2)}px`);
    image.style.setProperty("--sticker-r", `${rotation.toFixed(2)}deg`);
    image.style.opacity = String(clamp(local * 1.35) * fadeOut);
  }

  function render() {
    const heroProgress = inverseLerp(0.32, 1.55, state.position);
    const contactProgress = inverseLerp(14.38, 16.65, state.position);
    const mode = contactProgress > 0 ? "contact" : "hero";

    stickers.forEach((entry, index) => {
      const progress = mode === "contact"
        ? contactProgress * entry.token.speed
        : index < 8
          ? heroProgress * entry.token.speed
          : 0;
      renderSticker(entry, progress, mode);
    });
  }

  return { ready, render };
}
