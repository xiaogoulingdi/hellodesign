import { stickerConfig } from "../config/stickers.js";
import { clamp, easeInOut } from "../utils/math.js";

function drawArrow(ctx) {
  ctx.beginPath();
  ctx.moveTo(-44, -45);
  ctx.bezierCurveTo(-8, -28, 34, -9, 56, 8);
  ctx.bezierCurveTo(65, 15, 62, 28, 48, 32);
  ctx.lineTo(13, 42);
  ctx.lineTo(-12, 64);
  ctx.bezierCurveTo(-22, 73, -38, 64, -35, 49);
  ctx.lineTo(-26, 17);
  ctx.closePath();

  const arrowGradient = ctx.createLinearGradient(-42, -42, 48, 58);
  arrowGradient.addColorStop(0, "#276fff");
  arrowGradient.addColorStop(0.58, "#194bd6");
  arrowGradient.addColorStop(1, "#1232a8");
  ctx.fillStyle = arrowGradient;
  ctx.fill();

  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(151,184,255,.78)";
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,.38)";
  ctx.beginPath();
  ctx.moveTo(-31, -30);
  ctx.bezierCurveTo(-2, -16, 28, -3, 45, 10);
  ctx.stroke();
}

function drawSmile(ctx, token) {
  ctx.fillStyle = token.color;
  ctx.beginPath();
  ctx.arc(0, 0, token.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,255,255,.65)";
  ctx.stroke();

  ctx.strokeStyle = "rgba(10,20,45,.8)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, token.radius * 0.62, 0.35, Math.PI * 1.55);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-18, 6);
  ctx.quadraticCurveTo(14, 32, 48, 7);
  ctx.stroke();
}

export function renderStickers(ctx, state) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const progress = easeInOut(state.scrollProgress);
  const drop = clamp((progress - 0.42) / 0.58, 0, 1);
  const fall = easeInOut(drop);

  if (drop <= 0) return;

  stickerConfig.forEach((token, index) => {
    const bob = Math.sin(state.time * 0.0012 + index * 1.7) * 10;
    const x = w * token.x + (fall - 0.45) * (index - 1) * 90;
    const startY = -token.radius * (2.4 + index * 0.6);
    const endY = h * token.y - 110 + index * 42;
    const y = startY + (endY - startY) * fall + bob * drop;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(token.rotation + (1 - fall) * (index % 2 ? -0.8 : 0.8) + Math.sin(state.time * 0.0009 + index) * 0.08);
    ctx.globalAlpha = clamp(drop * 1.25, 0, 0.95);
    ctx.shadowColor = "rgba(60,90,255,.45)";
    ctx.shadowBlur = 18;

    if (token.type === "arrow") {
      drawArrow(ctx);
    } else {
      drawSmile(ctx, token);
    }

    ctx.restore();
  });
}
