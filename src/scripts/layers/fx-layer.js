import { configureCanvas } from "../utils/canvas.js";
import { clamp, inverseLerp, lerp, seeded, smoothstep } from "../utils/math.js";

function rgba(color, alpha) {
  return `rgba(${color},${alpha})`;
}

export function createFxLayer({ canvas, state }) {
  const ctx = canvas.getContext("2d", { alpha: true });
  const trail = Array.from({ length: 18 }, () => ({ x: -100, y: -100, strength: 0, speed: 0 }));
  let lastCell = "";
  let lastTrailX = state.pointer.x;
  let lastTrailY = state.pointer.y;

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
      const distance = Math.hypot(state.pointer.x - lastTrailX, state.pointer.y - lastTrailY);
      const samples = Math.min(5, Math.max(1, Math.ceil(distance / 34)));
      for (let sample = 0; sample < samples; sample += 1) {
        for (let index = trail.length - 1; index > 0; index -= 1) {
          trail[index].x = trail[index - 1].x;
          trail[index].y = trail[index - 1].y;
          trail[index].strength = trail[index - 1].strength * 0.9;
          trail[index].speed = trail[index - 1].speed * 0.94;
        }
        const t = (sample + 1) / samples;
        trail[0].x = lerp(lastTrailX, state.pointer.x, t);
        trail[0].y = lerp(lastTrailY, state.pointer.y, t);
        trail[0].strength = 1 - sample * 0.08;
        trail[0].speed = clamp(state.pointer.speed + distance / 420);
      }
      lastTrailX = state.pointer.x;
      lastTrailY = state.pointer.y;
      lastCell = cell;
    }
    trail.forEach((point, index) => {
      point.strength *= index === 0 ? 0.95 : 0.91;
      point.speed *= 0.9;
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

    const visibleBlocks = Math.round(lerp(5, 13, clamp(state.pointer.speed * 1.25)));
    for (let index = 0; index < visibleBlocks; index += 1) {
      const point = trail[index];
      if (point.strength < 0.03) continue;
      const jitter = index > 4 ? ((index % 3) - 1) * 4 * clamp(point.speed + state.pointer.speed) : 0;
      const size = Math.round(lerp(4, 8, clamp(point.speed * 1.4))) - (index > 7 ? 1 : 0);
      const x = Math.floor((point.x + jitter) / 16) * 16;
      const y = Math.floor((point.y - jitter * 0.45) / 16) * 16;
      ctx.globalAlpha = point.strength * lerp(0.28, 0.72, clamp(point.speed + state.pointer.speed * 0.35));
      ctx.fillStyle = index % 4 === 0 ? "rgba(177,240,255,1)" : "#c0fe04";
      ctx.fillRect(x + 5, y + 5, Math.max(3, size), Math.max(3, size));
    }
    ctx.globalAlpha = 1;
  }

  function drawRipples(dark) {
    const now = state.time;
    if (!state.ripples?.length) return;

    ctx.save();
    ctx.globalCompositeOperation = dark ? "screen" : "multiply";
    for (const ripple of state.ripples) {
      const age = (now - ripple.born) / 1000;
      if (age < 0 || age > 1.8) continue;
      const life = 1 - age / 1.8;
      const strength = ripple.strength * life;
      const radius = 18 + age * (ripple.source === "hello" ? 210 : 145);
      const rings = ripple.source === "hello" ? 4 : 3;

      for (let ring = 0; ring < rings; ring += 1) {
        const r = radius + ring * 18;
        const alpha = strength * (0.32 - ring * 0.055);
        if (alpha <= 0) continue;
        ctx.lineWidth = Math.max(1, 2.4 - ring * 0.28);
        ctx.strokeStyle = dark
          ? rgba(ripple.source === "hello" ? "166,238,255" : "192,254,4", alpha)
          : rgba(ripple.source === "hello" ? "12,80,220" : "0,80,255", alpha * 0.72);
        ctx.beginPath();
        for (let step = 0; step <= 96; step += 1) {
          const a = (step / 96) * Math.PI * 2;
          const wobble = Math.sin(a * 9 + age * 15 + ring) * (3.5 + ripple.strength * 3);
          const x = ripple.x + Math.cos(a) * (r + wobble);
          const y = ripple.y + Math.sin(a) * (r + wobble * 0.74);
          if (step === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      if (ripple.source === "hello") {
        ctx.globalAlpha = strength * 0.16;
        ctx.fillStyle = dark ? "#bff7ff" : "#1b4dff";
        for (let index = 0; index < 34; index += 1) {
          const angle = seeded(index, 21) * Math.PI * 2;
          const d = radius * (0.22 + seeded(index, 22) * 0.68);
          const x = Math.floor((ripple.x + Math.cos(angle) * d) / 8) * 8;
          const y = Math.floor((ripple.y + Math.sin(angle) * d * 0.72) / 8) * 8;
          ctx.fillRect(x, y, 2, 2);
        }
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
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
        let rippleLift = 0;
        if (state.ripples?.length) {
          for (const ripple of state.ripples) {
            const age = (state.time - ripple.born) / 1000;
            if (age < 0 || age > 1.35) continue;
            const radius = 22 + age * 190;
            const d = Math.hypot(x - ripple.x, (y - ripple.y) * 1.18);
            rippleLift += Math.sin((d - radius) * 0.11) * smoothstep(1 - Math.abs(d - radius) / 80) * ripple.strength * (1 - age / 1.35);
          }
        }
        const wave = Math.sin(x * 0.024 + y * 0.018 + state.time * 0.0018 + rippleLift * 1.8);
        if (wave + rippleLift * 0.35 > 0.34) ctx.fillRect(x + rippleLift * 2.4, y, 1.2, 1.2);
      }
    }
    ctx.restore();
  }

  function drawHyperSpace(progress, dark, phase = 0) {
    if (progress <= 0.001) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const centerX = w * 0.5;
    const centerY = h * 0.51;
    const maxRadius = Math.hypot(w, h) * 0.78;
    const arrowIntro = smoothstep(inverseLerp(0, 0.24, phase)) * (1 - smoothstep(inverseLerp(0.42, 0.56, phase)));
    const reveal = smoothstep(inverseLerp(0.11, 0.32, phase));
    const textCore = reveal * (1 - smoothstep(inverseLerp(0.7, 0.82, phase)));
    const arrowOutro = smoothstep(inverseLerp(0.72, 0.83, phase));
    const burst = clamp(progress * (0.82 + arrowIntro * 0.8 + arrowOutro * 0.45));
    const palette = dark
      ? ["78,249,255", "32,169,255", "103,79,255", "239,49,255"]
      : ["0,85,255", "32,118,205", "93,57,205", "8,25,60"];
    const stagePulse = 0.5 + 0.5 * Math.sin(state.time * 0.0015);

    ctx.save();
    ctx.globalCompositeOperation = dark ? "screen" : "multiply";
    ctx.lineCap = "butt";

    for (let index = 0; index < 340; index += 1) {
      const angle = seeded(index, 1) * Math.PI * 2;
      const base = seeded(index, 2);
      const travel = (progress * 2.9 + base + state.time * 0.0001 + arrowOutro * 0.22) % 1;
      const startRadius = lerp(6, maxRadius * 0.58, travel * travel);
      const length = lerp(42, maxRadius * 0.42, travel) * (0.52 + seeded(index, 3)) * (1 + arrowIntro * 0.65);
      const endRadius = Math.min(maxRadius, startRadius + length);
      const squash = 0.74 + seeded(index, 5) * 0.24;
      const x1 = centerX + Math.cos(angle) * startRadius;
      const y1 = centerY + Math.sin(angle) * startRadius * squash;
      const x2 = centerX + Math.cos(angle) * endRadius;
      const y2 = centerY + Math.sin(angle) * endRadius * squash;
      const alpha = burst * lerp(0.18, 0.9, travel) * (0.54 + textCore * 0.46);
      ctx.strokeStyle = rgba(palette[index % palette.length], alpha);
      ctx.lineWidth = 1.3 + seeded(index, 4) * 3.6 + stagePulse * 0.6 + arrowIntro * 2.8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const coreRadius = maxRadius * lerp(0.18, 0.3, Math.max(arrowIntro, arrowOutro));
    const core = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);
    core.addColorStop(0, dark ? rgba("120,150,255", 0.18 + arrowIntro * 0.22) : rgba("0,80,255", 0.09 + arrowIntro * 0.1));
    core.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, w, h);

    const arrowSize = lerp(Math.min(w, h) * 0.08, Math.min(w, h) * 0.58, arrowIntro)
      + lerp(0, Math.min(w, h) * 0.18, arrowOutro);
    const spin = arrowOutro * Math.PI * 1.15 + Math.sin(state.time * 0.001) * 0.08;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-0.55 + spin);
    ctx.globalCompositeOperation = dark ? "screen" : "multiply";
    ctx.globalAlpha = (arrowIntro * (1 - reveal * 0.42) + arrowOutro * 0.72) * (dark ? 0.72 : 0.44);
    ctx.fillStyle = dark ? "#45dfff" : "#174cff";
    ctx.strokeStyle = dark ? "#d8fbff" : "#07168f";
    ctx.lineWidth = Math.max(2, arrowSize * 0.055);
    ctx.beginPath();
    ctx.moveTo(arrowSize * 0.56, 0);
    ctx.lineTo(-arrowSize * 0.38, -arrowSize * 0.42);
    ctx.lineTo(-arrowSize * 0.18, 0);
    ctx.lineTo(-arrowSize * 0.38, arrowSize * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (arrowIntro > 0.02) {
      ctx.globalAlpha = arrowIntro * (1 - reveal * 0.25) * (dark ? 0.18 : 0.1);
      ctx.lineWidth = Math.max(1, arrowSize * 0.018);
      for (let index = 0; index < 5; index += 1) {
        ctx.beginPath();
        ctx.arc(0, 0, arrowSize * (0.28 + index * 0.11), -0.65, 0.82);
        ctx.stroke();
      }
    }
    ctx.restore();
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
    drawRipples(dark);

    const hyperPhase = inverseLerp(8.45, 14.9, state.position);
    const hyperIn = smoothstep(inverseLerp(8.35, 9.05, state.position));
    const hyperOut = 1 - smoothstep(inverseLerp(14.5, 15.05, state.position));
    drawHyperSpace(Math.min(hyperIn, hyperOut), dark, hyperPhase);

    if (state.position < 8.7 || state.position > 14.2) drawPointerEffect(dark);
  }

  resize();
  window.addEventListener("resize", resize);
  return { canvas, ctx, render, resize };
}
