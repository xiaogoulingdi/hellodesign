import { configureCanvas } from "../utils/canvas.js";
import { clamp, inverseLerp, lerp, seeded, smoothstep } from "../utils/math.js";

function rgba(color, alpha) {
  return `rgba(${color},${alpha})`;
}

export function createFxLayer({ canvas, state }) {
  const ctx = canvas.getContext("2d", { alpha: true });
  const trail = Array.from({ length: 14 }, () => ({ x: -100, y: -100, strength: 0 }));
  let lastCell = "";

  function resize() {
    configureCanvas(
      canvas,
      ctx,
      window.innerWidth,
      window.innerHeight,
      Math.min(window.devicePixelRatio || 1, 2)
    );
  }

  function updatePointerTrail() {
    const cell = `${Math.floor(state.pointer.x / 16)}:${Math.floor(state.pointer.y / 16)}`;
    if (cell !== lastCell) {
      for (let index = trail.length - 1; index > 0; index -= 1) {
        trail[index].x = trail[index - 1].x;
        trail[index].y = trail[index - 1].y;
        trail[index].strength = trail[index - 1].strength * 0.9;
      }
      trail[0].x = state.pointer.x;
      trail[0].y = state.pointer.y;
      trail[0].strength = 1;
      lastCell = cell;
    }
    trail.forEach((point, index) => {
      point.strength *= index === 0 ? 0.95 : 0.91;
    });
  }

  function drawPointerEffect(dark) {
    updatePointerTrail();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const radius = Math.max(w, h) * 0.28;
    const glow = ctx.createRadialGradient(
      state.pointer.x,
      state.pointer.y,
      0,
      state.pointer.x,
      state.pointer.y,
      radius
    );
    glow.addColorStop(0, dark ? "rgba(45,78,255,.20)" : "rgba(42,68,220,.12)");
    glow.addColorStop(0.34, dark ? "rgba(104,67,255,.08)" : "rgba(0,80,255,.04)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#c0fe04";
    for (const point of trail) {
      if (point.strength < 0.03) continue;
      ctx.globalAlpha = point.strength * 0.34;
      const x = Math.floor(point.x / 16) * 16;
      const y = Math.floor(point.y / 16) * 16;
      ctx.fillRect(x + 6, y + 6, 4, 4);
    }
    ctx.globalAlpha = 1;
  }

  function drawHalftone(opacity, dark) {
    if (opacity <= 0.001) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.save();
    ctx.globalAlpha = opacity * (dark ? 0.42 : 0.24);
    ctx.fillStyle = dark ? "rgba(160,178,255,.62)" : "rgba(26,39,130,.42)";
    for (let y = 3; y < h; y += 6) {
      for (let x = 3; x < w; x += 6) {
        const wave = Math.sin(x * 0.024 + y * 0.018 + state.time * 0.0018);
        if (wave > 0.34) ctx.fillRect(x, y, 1.2, 1.2);
      }
    }
    ctx.restore();
  }

  function drawHyperSpace(progress, dark) {
    if (progress <= 0.001) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const centerX = w * 0.5;
    const centerY = h * 0.51;
    const maxRadius = Math.hypot(w, h) * 0.78;
    const palette = dark
      ? ["78,249,255", "32,169,255", "103,79,255", "239,49,255"]
      : ["0,85,255", "32,118,205", "93,57,205", "8,25,60"];
    const stagePulse = 0.5 + 0.5 * Math.sin(state.time * 0.0015);

    ctx.save();
    ctx.globalCompositeOperation = dark ? "screen" : "multiply";
    ctx.lineCap = "butt";

    for (let index = 0; index < 280; index += 1) {
      const angle = seeded(index, 1) * Math.PI * 2;
      const base = seeded(index, 2);
      const travel = (progress * 2.8 + base + state.time * 0.00008) % 1;
      const startRadius = lerp(18, maxRadius * 0.55, travel * travel);
      const length = lerp(32, maxRadius * 0.34, travel) * (0.55 + seeded(index, 3));
      const endRadius = Math.min(maxRadius, startRadius + length);
      const squash = 0.74 + seeded(index, 5) * 0.24;
      const x1 = centerX + Math.cos(angle) * startRadius;
      const y1 = centerY + Math.sin(angle) * startRadius * squash;
      const x2 = centerX + Math.cos(angle) * endRadius;
      const y2 = centerY + Math.sin(angle) * endRadius * squash;
      const alpha = clamp(progress * 1.4) * lerp(0.25, 0.95, travel);
      ctx.strokeStyle = rgba(palette[index % palette.length], alpha);
      ctx.lineWidth = 1.4 + seeded(index, 4) * 3.2 + stagePulse * 0.6;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const core = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius * 0.24);
    core.addColorStop(0, dark ? "rgba(100,128,255,.22)" : "rgba(0,80,255,.11)");
    core.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function render() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dark = document.documentElement.classList.contains("dark");
    ctx.clearRect(0, 0, w, h);

    const halftoneIn = smoothstep(inverseLerp(0.7, 1.8, state.position));
    const halftoneOut = 1 - smoothstep(inverseLerp(8.2, 9.3, state.position));
    drawHalftone(Math.min(halftoneIn, halftoneOut), dark);

    const hyperIn = smoothstep(inverseLerp(8.55, 9.3, state.position));
    const hyperOut = 1 - smoothstep(inverseLerp(14.45, 15.05, state.position));
    drawHyperSpace(Math.min(hyperIn, hyperOut), dark);

    if (state.position < 8.7 || state.position > 14.2) drawPointerEffect(dark);
  }

  resize();
  window.addEventListener("resize", resize);
  return { canvas, ctx, render, resize };
}
