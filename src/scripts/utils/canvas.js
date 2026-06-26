export function configureCanvas(canvas, context, width, height, dpr) {
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function drawTextPass(ctx, text, options) {
  ctx.save();
  ctx.font = options.font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.shadowBlur = options.blur ?? 0;
  ctx.shadowColor = options.shadow ?? "transparent";
  ctx.setLineDash(options.dash ?? []);
  ctx.lineDashOffset = options.dashOffset ?? 0;

  if (options.stroke) {
    ctx.lineWidth = options.width ?? 1;
    ctx.strokeStyle = options.stroke;
    ctx.strokeText(text, options.x ?? 0, options.y ?? 0);
  }

  if (options.fill) {
    ctx.fillStyle = options.fill;
    ctx.fillText(text, options.x ?? 0, options.y ?? 0);
  }

  ctx.restore();
}
