export function createLightLayer({ canvas }) {
  const ctx = canvas.getContext("2d", { alpha: true });

  function render(state) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dark = state.isDark();
    const hue = dark ? "255,255,255" : "0,0,0";
    const lime = "192,254,4";
    const radius = Math.max(w, h) * 0.44;

    ctx.clearRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(state.pointer.x, state.pointer.y, 0, state.pointer.x, state.pointer.y, radius);
    glow.addColorStop(0, `rgba(${lime},${dark ? 0.26 : 0.2})`);
    glow.addColorStop(0.24, `rgba(${hue},${dark ? 0.12 : 0.06})`);
    glow.addColorStop(0.72, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(state.pointer.x, state.pointer.y);
    ctx.rotate(Math.sin(state.time * 0.00026) * 0.65);

    for (let i = 0; i < 7; i += 1) {
      const p = i / 6;
      const size = 80 + p * 430;
      ctx.strokeStyle = `rgba(${lime},${0.06 - p * 0.045})`;
      ctx.lineWidth = 1 + p * 5;
      ctx.strokeRect(-size * 0.6, -size * 0.38, size * 1.2, size * 0.76);
    }

    ctx.restore();

    const noiseCount = Math.floor((w * h) / 22000);
    ctx.fillStyle = dark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)";

    for (let i = 0; i < noiseCount; i += 1) {
      const x = (Math.sin(i * 91.7 + state.time * 0.0008) * 0.5 + 0.5) * w;
      const y = (Math.cos(i * 47.3 + state.time * 0.0006) * 0.5 + 0.5) * h;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return { canvas, ctx, render };
}
