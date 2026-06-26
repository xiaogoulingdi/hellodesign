export function createBackgroundLayer({ canvas }) {
  const ctx = canvas.getContext("2d", { alpha: true });

  function render(state) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dark = state.isDark();

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = dark ? "rgb(15,17,17)" : "rgb(251,250,244)";
    ctx.fillRect(0, 0, w, h);

    const grid = Math.max(34, Math.min(72, w / 18));
    ctx.globalAlpha = dark ? 0.13 : 0.09;
    ctx.strokeStyle = dark ? "rgb(230,232,232)" : "rgb(54,54,48)";
    ctx.lineWidth = 1;

    for (let x = -grid; x < w + grid; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x + Math.sin(state.time * 0.001 + x) * 2, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = -grid; y < h + grid; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + Math.cos(state.time * 0.001 + y) * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  return { canvas, ctx, render };
}
