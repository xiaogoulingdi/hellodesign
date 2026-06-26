const root = document.documentElement;
const scrollShell = document.querySelector(".scroll-shell");
const loader = document.querySelector(".loader");
const bgCanvas = document.querySelector("#background-canvas");
const helloCanvas = document.querySelector("#hello-canvas");
const lightCanvas = document.querySelector("#light-canvas");
const bg = bgCanvas.getContext("2d", { alpha: true });
const hello = helloCanvas.getContext("2d", { alpha: true });
const light = lightCanvas.getContext("2d", { alpha: true });
const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, tx: window.innerWidth / 2, ty: window.innerHeight / 2 };
let soundOn = true;
let time = 0;
let scrollProgress = 0;

root.classList.add("dark");

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  for (const canvas of [bgCanvas, helloCanvas, lightCanvas]) {
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  }
  bg.setTransform(dpr, 0, 0, dpr, 0, 0);
  hello.setTransform(dpr, 0, 0, dpr, 0, 0);
  light.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawBackground() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dark = root.classList.contains("dark");
  bg.clearRect(0, 0, w, h);
  bg.fillStyle = dark ? "rgb(15,17,17)" : "rgb(251,250,244)";
  bg.fillRect(0, 0, w, h);

  const grid = Math.max(34, Math.min(72, w / 18));
  bg.globalAlpha = dark ? 0.13 : 0.09;
  bg.strokeStyle = dark ? "rgb(230,232,232)" : "rgb(54,54,48)";
  bg.lineWidth = 1;
  for (let x = -grid; x < w + grid; x += grid) {
    bg.beginPath();
    bg.moveTo(x + Math.sin(time * 0.001 + x) * 2, 0);
    bg.lineTo(x, h);
    bg.stroke();
  }
  for (let y = -grid; y < h + grid; y += grid) {
    bg.beginPath();
    bg.moveTo(0, y);
    bg.lineTo(w, y + Math.cos(time * 0.001 + y) * 2);
    bg.stroke();
  }
  bg.globalAlpha = 1;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function easeInOut(value) {
  return value * value * (3 - 2 * value);
}

function createHelloPath(scale, stretch) {
  const path = new Path2D();
  const sx = scale * stretch;
  const sy = scale;
  const move = (x, y) => path.moveTo(x * sx, y * sy);
  const curve = (a, b, c, d, e, f) => path.bezierCurveTo(a * sx, b * sy, c * sx, d * sy, e * sx, f * sy);

  move(-420, 92);
  curve(-396, -160, -268, -245, -238, -62);
  curve(-214, 88, -222, 146, -168, 132);
  curve(-120, 119, -132, -12, -82, -54);
  curve(-32, -96, 18, -58, -12, 2);
  curve(-42, 64, -88, 53, -66, 13);
  curve(-42, -31, 34, -51, 62, -14);
  curve(95, 30, 55, 88, 13, 72);
  curve(-7, 65, -1, 33, 53, 20);
  curve(101, 8, 127, 8, 142, -31);
  curve(166, -95, 189, -193, 256, -202);
  curve(326, -211, 288, -12, 244, 51);
  curve(211, 98, 177, 73, 194, 11);
  curve(211, -50, 285, -168, 349, -168);
  curve(407, -168, 387, 20, 333, 84);
  curve(305, 119, 280, 105, 299, 55);
  curve(335, -38, 454, -27, 452, 44);
  curve(449, 112, 332, 104, 338, 26);

  return path;
}

function drawTubePass(ctx, path, options) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = options.width;
  ctx.strokeStyle = options.stroke;
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.shadowBlur = options.blur ?? 0;
  ctx.shadowColor = options.shadow ?? "transparent";
  ctx.setLineDash(options.dash ?? []);
  ctx.lineDashOffset = options.dashOffset ?? 0;
  ctx.stroke(path);
  ctx.restore();
}

function drawTextPass(ctx, text, options) {
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

function drawTextHalftone(ctx, text, font, width, height, progress) {
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
      const wave = Math.sin(x * 0.035 + y * 0.025 + time * 0.002 + progress * 4);
      if (alpha > 18 && wave > -0.1) {
        ctx.beginPath();
        ctx.arc(x, y, 0.65 + Math.max(wave, 0) * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function drawHalftone(ctx, path, scale, stretch, progress) {
  ctx.save();
  ctx.clip(path);
  ctx.globalAlpha = 0.26;
  const step = 7 * scale;
  const radius = 1.15 * scale;
  const minX = -455 * scale * stretch;
  const maxX = 475 * scale * stretch;
  const minY = -235 * scale;
  const maxY = 155 * scale;
  ctx.fillStyle = "rgba(206, 214, 255, 0.8)";
  for (let y = minY; y < maxY; y += step) {
    for (let x = minX; x < maxX; x += step) {
      const wave = Math.sin(x * 0.018 + y * 0.027 + time * 0.002 + progress * 5);
      if (wave > 0.35) {
        ctx.beginPath();
        ctx.arc(x, y, radius * (0.45 + wave * 0.45), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function drawFloatingTokens(ctx, w, h, progress) {
  const drop = clamp((progress - 0.42) / 0.58, 0, 1);
  const fall = easeInOut(drop);
  const tokens = [
    { x: 0.43, y: 0.73, r: 52, a: -0.55, color: "#d8d0b4" },
    { x: 0.83, y: 0.73, r: 58, a: 0.42, color: "#1f58e7" },
    { x: 0.21, y: 0.94, r: 55, a: -0.18, color: "#f2a72c" }
  ];
  if (drop <= 0) return;
  tokens.forEach((token, index) => {
    const bob = Math.sin(time * 0.0012 + index * 1.7) * 10;
    const x = w * token.x + (fall - 0.45) * (index - 1) * 90;
    const startY = -token.r * (2.4 + index * 0.6);
    const endY = h * token.y - 110 + index * 42;
    const y = startY + (endY - startY) * fall + bob * drop;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(token.a + (1 - fall) * (index % 2 ? -0.8 : 0.8) + Math.sin(time * 0.0009 + index) * 0.08);
    ctx.globalAlpha = clamp(drop * 1.25, 0, 0.95);
    ctx.shadowColor = "rgba(60,90,255,.45)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = token.color;
    if (index === 1) {
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
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, token.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(255,255,255,.65)";
      ctx.stroke();
      ctx.strokeStyle = "rgba(10,20,45,.8)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, token.r * 0.62, 0.35, Math.PI * 1.55);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-18, 6);
      ctx.quadraticCurveTo(14, 32, 48, 7);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawHello() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dark = root.classList.contains("dark");
  const progress = easeInOut(scrollProgress);
  const mouseX = (pointer.x / w - 0.5) || 0;
  const mouseY = (pointer.y / h - 0.5) || 0;

  hello.clearRect(0, 0, w, h);
  hello.save();
  const scale = Math.min(w / 1120, h / 640) * (1.08 - progress * 0.16);
  const stretch = 1 + Math.sin(progress * Math.PI) * 0.28;
  const x = w * (0.55 - progress * 0.12) + mouseX * 26;
  const y = h * (0.47 - progress * 0.29) + mouseY * 18;
  hello.translate(x, y);
  hello.rotate((-0.04 + progress * 0.18) + mouseX * 0.025);

  const text = "hello";
  const fontSize = 365 * scale;
  const font = `900 ${fontSize}px "Brush Script MT", "Segoe Script", "Snell Roundhand", cursive`;
  const body = hello.createLinearGradient(-470 * scale, -210 * scale, 450 * scale, 130 * scale);
  body.addColorStop(0, "#4d7cff");
  body.addColorStop(0.22, "#1c32c8");
  body.addColorStop(0.52, "#3038d7");
  body.addColorStop(0.78, "#171e95");
  body.addColorStop(1, "#273fea");

  const rim = hello.createLinearGradient((pointer.x - x) * 0.42, -220 * scale, (pointer.x - x) * 0.42 + 120 * scale, 120 * scale);
  rim.addColorStop(0, "rgba(255,255,255,.96)");
  rim.addColorStop(0.22, "rgba(164,196,255,.72)");
  rim.addColorStop(0.5, "rgba(85,103,255,.22)");
  rim.addColorStop(1, "rgba(255,255,255,.08)");

  hello.scale(stretch, 1);
  drawTextPass(hello, text, {
    font,
    width: 35 * scale,
    stroke: dark ? "rgba(3, 9, 54, .62)" : "rgba(12, 18, 90, .26)",
    fill: "rgba(18, 25, 132, .28)",
    blur: 34 * scale,
    shadow: "rgba(38, 67, 255, .65)"
  });
  drawTextPass(hello, text, {
    font,
    width: 23 * scale,
    stroke: body,
    fill: body,
    blur: 16 * scale,
    shadow: "rgba(91, 116, 255, .72)"
  });
  drawTextPass(hello, text, {
    font,
    width: 13 * scale,
    stroke: "rgba(20, 29, 150, .48)",
    fill: "rgba(27, 35, 177, .64)",
    alpha: 0.68
  });
  drawTextHalftone(hello, text, font, 980 * scale, 360 * scale, progress);
  drawTextPass(hello, text, {
    font,
    width: 5.5 * scale,
    stroke: rim,
    blur: 10 * scale,
    shadow: "rgba(255,255,255,.88)",
    alpha: 0.95,
    x: -10 * scale,
    y: -23 * scale,
    dash: [48 * scale, 44 * scale],
    dashOffset: -time * 0.045 - progress * 260
  });
  drawTextPass(hello, text, {
    font,
    width: 2.2 * scale,
    stroke: "rgba(255,255,255,.88)",
    blur: 6 * scale,
    shadow: "rgba(255,255,255,.9)",
    alpha: 0.8,
    x: 16 * scale,
    y: -56 * scale,
    dash: [36 * scale, 120 * scale],
    dashOffset: -time * 0.09 + mouseX * 100
  });
  hello.restore();

  hello.save();
  hello.globalCompositeOperation = dark ? "screen" : "multiply";
  const flare = hello.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, Math.max(w, h) * 0.34);
  flare.addColorStop(0, dark ? "rgba(121,146,255,.22)" : "rgba(30,54,190,.12)");
  flare.addColorStop(0.38, "rgba(85,105,255,.05)");
  flare.addColorStop(1, "rgba(0,0,0,0)");
  hello.fillStyle = flare;
  hello.fillRect(0, 0, w, h);
  hello.restore();

  drawFloatingTokens(hello, w, h, progress);
}

function drawLight() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dark = root.classList.contains("dark");
  pointer.x += (pointer.tx - pointer.x) * 0.08;
  pointer.y += (pointer.ty - pointer.y) * 0.08;
  light.clearRect(0, 0, w, h);

  const hue = dark ? "255,255,255" : "0,0,0";
  const lime = "192,254,4";
  const radius = Math.max(w, h) * 0.44;
  const glow = light.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, radius);
  glow.addColorStop(0, `rgba(${lime},${dark ? 0.26 : 0.2})`);
  glow.addColorStop(0.24, `rgba(${hue},${dark ? 0.12 : 0.06})`);
  glow.addColorStop(0.72, "rgba(0,0,0,0)");
  light.fillStyle = glow;
  light.fillRect(0, 0, w, h);

  light.save();
  light.translate(pointer.x, pointer.y);
  light.rotate(Math.sin(time * 0.00026) * 0.65);
  for (let i = 0; i < 7; i += 1) {
    const p = i / 6;
    const size = 80 + p * 430;
    light.strokeStyle = `rgba(${lime},${0.06 - p * 0.045})`;
    light.lineWidth = 1 + p * 5;
    light.strokeRect(-size * 0.6, -size * 0.38, size * 1.2, size * 0.76);
  }
  light.restore();

  const noiseCount = Math.floor((w * h) / 22000);
  light.fillStyle = dark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)";
  for (let i = 0; i < noiseCount; i += 1) {
    const x = (Math.sin(i * 91.7 + time * 0.0008) * 0.5 + 0.5) * w;
    const y = (Math.cos(i * 47.3 + time * 0.0006) * 0.5 + 0.5) * h;
    light.fillRect(x, y, 1, 1);
  }
}

function frame(now) {
  time = now;
  const scrollRange = Math.max(scrollShell.scrollHeight - scrollShell.clientHeight, 1);
  scrollProgress = clamp(scrollShell.scrollTop / Math.min(scrollRange, window.innerHeight * 1.1), 0, 1);
  drawBackground();
  drawHello();
  drawLight();
  document.querySelectorAll(".thumb").forEach((thumb, index) => {
    thumb.style.setProperty("--spin", `${(now * 0.03 + index * 31) % 360}deg`);
  });
  requestAnimationFrame(frame);
}

function updateClock() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai"
  }).format(new Date());
  document.querySelector("#clock").textContent = `GMT+8 CN ${parts}`;
}

function setPointerReadout(x, y) {
  document.querySelector("#pointer").textContent = `${String(Math.round(x)).padStart(4, "0")} X ${String(Math.round(y)).padStart(4, "0")} Y`;
}

window.addEventListener("pointermove", (event) => {
  pointer.tx = event.clientX;
  pointer.ty = event.clientY;
  setPointerReadout(event.clientX, event.clientY);
  document.querySelectorAll(".thumb").forEach((thumb) => {
    const rect = thumb.getBoundingClientRect();
    thumb.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    thumb.style.setProperty("--my", `${event.clientY - rect.top}px`);
  });
});

window.addEventListener("resize", resizeCanvas);

document.querySelector("#theme-toggle").addEventListener("click", () => {
  root.classList.toggle("dark");
  document.querySelector("#theme-toggle").textContent = root.classList.contains("dark") ? "THEME[D]" : "THEME[A]";
});

document.querySelector("#sound-toggle").addEventListener("click", () => {
  soundOn = !soundOn;
  document.querySelector("#sound-toggle").textContent = soundOn ? "SOUND[|]" : "SOUND[ ]";
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    scrollShell.scrollTo({ top: target.offsetTop, behavior: "smooth" });
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  },
  { root: scrollShell, threshold: 0.1 }
);

document.querySelectorAll(".reveal").forEach((el, index) => {
  el.style.transitionDelay = `${Math.min(index * 42, 620)}ms`;
  observer.observe(el);
});

resizeCanvas();
updateClock();
setInterval(updateClock, 10000);
requestAnimationFrame(frame);

setTimeout(() => loader.classList.add("is-hidden"), 1350);

window.addEventListener("load", () => {
  setTimeout(() => loader.classList.add("is-hidden"), 250);
});
