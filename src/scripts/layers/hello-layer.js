import { siteConfig } from "../config/site.js";
import { drawTextPass } from "../utils/canvas.js";
import { easeInOut } from "../utils/math.js";
import { renderStickers } from "./sticker-layer.js";

function drawTextHalftone(ctx, text, font, width, height, state, progress) {
  const mask = document.createElement("canvas");
  mask.width = Math.ceil(width);
  mask.height = Math.ceil(height);
  const maskCtx = mask.getContext("2d");

  maskCtx.font = font;
  maskCtx.textAlign = "center";
  maskCtx.textBaseline = "middle";
  maskCtx.fillStyle = "#fff";
  maskCtx.fillText(text, width / 2, height / 2);

  const pixels = maskCtx.getImageData(0, 0, mask.width, mask.height).data;

  ctx.save();
  ctx.translate(-width / 2, -height / 2);
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = "rgba(214, 224, 255, 0.82)";

  const step = 7;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const alpha = pixels[(Math.floor(y) * mask.width + Math.floor(x)) * 4 + 3];
      const wave = Math.sin(x * 0.035 + y * 0.025 + state.time * 0.002 + progress * 4);
      if (alpha > 18 && wave > -0.1) {
        ctx.beginPath();
        ctx.arc(x, y, 0.65 + Math.max(wave, 0) * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

export function createHelloLayer({ canvas }) {
  const ctx = canvas.getContext("2d", { alpha: true });

  function render(state) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const progress = easeInOut(state.scrollProgress);
    const mouseX = state.pointer.x / w - 0.5 || 0;
    const mouseY = state.pointer.y / h - 0.5 || 0;
    const dark = state.isDark();

    ctx.clearRect(0, 0, w, h);
    ctx.save();

    const scale = Math.min(w / 1120, h / 640) * (1.08 - progress * 0.16);
    const stretch = 1 + Math.sin(progress * Math.PI) * 0.28;
    const x = w * (0.55 - progress * 0.12) + mouseX * 26;
    const y = h * (0.47 - progress * 0.29) + mouseY * 18;

    ctx.translate(x, y);
    ctx.rotate(-0.04 + progress * 0.18 + mouseX * 0.025);

    const text = siteConfig.hello.text;
    const fontSize = siteConfig.hello.fontScale * scale;
    const font = `${siteConfig.hello.fontWeight} ${fontSize}px ${siteConfig.hello.fontFamily}`;
    const body = ctx.createLinearGradient(-470 * scale, -210 * scale, 450 * scale, 130 * scale);
    body.addColorStop(0, "#4d7cff");
    body.addColorStop(0.22, "#1c32c8");
    body.addColorStop(0.52, "#3038d7");
    body.addColorStop(0.78, "#171e95");
    body.addColorStop(1, "#273fea");

    const rim = ctx.createLinearGradient((state.pointer.x - x) * 0.42, -220 * scale, (state.pointer.x - x) * 0.42 + 120 * scale, 120 * scale);
    rim.addColorStop(0, "rgba(255,255,255,.96)");
    rim.addColorStop(0.22, "rgba(164,196,255,.72)");
    rim.addColorStop(0.5, "rgba(85,103,255,.22)");
    rim.addColorStop(1, "rgba(255,255,255,.08)");

    ctx.scale(stretch, 1);
    drawTextPass(ctx, text, {
      font,
      width: 35 * scale,
      stroke: dark ? "rgba(3, 9, 54, .62)" : "rgba(12, 18, 90, .26)",
      fill: "rgba(18, 25, 132, .28)",
      blur: 34 * scale,
      shadow: "rgba(38, 67, 255, .65)"
    });
    drawTextPass(ctx, text, {
      font,
      width: 23 * scale,
      stroke: body,
      fill: body,
      blur: 16 * scale,
      shadow: "rgba(91, 116, 255, .72)"
    });
    drawTextPass(ctx, text, {
      font,
      width: 13 * scale,
      stroke: "rgba(20, 29, 150, .48)",
      fill: "rgba(27, 35, 177, .64)",
      alpha: 0.68
    });
    drawTextHalftone(ctx, text, font, 980 * scale, 360 * scale, state, progress);
    drawTextPass(ctx, text, {
      font,
      width: 5.5 * scale,
      stroke: rim,
      blur: 10 * scale,
      shadow: "rgba(255,255,255,.88)",
      alpha: 0.95,
      x: -10 * scale,
      y: -23 * scale,
      dash: [48 * scale, 44 * scale],
      dashOffset: -state.time * 0.045 - progress * 260
    });
    drawTextPass(ctx, text, {
      font,
      width: 2.2 * scale,
      stroke: "rgba(255,255,255,.88)",
      blur: 6 * scale,
      shadow: "rgba(255,255,255,.9)",
      alpha: 0.8,
      x: 16 * scale,
      y: -56 * scale,
      dash: [36 * scale, 120 * scale],
      dashOffset: -state.time * 0.09 + mouseX * 100
    });

    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = dark ? "screen" : "multiply";
    const flare = ctx.createRadialGradient(state.pointer.x, state.pointer.y, 0, state.pointer.x, state.pointer.y, Math.max(w, h) * 0.34);
    flare.addColorStop(0, dark ? "rgba(121,146,255,.22)" : "rgba(30,54,190,.12)");
    flare.addColorStop(0.38, "rgba(85,105,255,.05)");
    flare.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = flare;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    renderStickers(ctx, state);
  }

  return { canvas, ctx, render };
}
