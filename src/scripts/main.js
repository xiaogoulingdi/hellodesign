import { configureCanvas } from "./utils/canvas.js";
import { createAppState } from "./state/app-state.js";
import { createBackgroundLayer } from "./layers/background-layer.js";
import { createHelloLayer } from "./layers/hello-layer.js";
import { createLightLayer } from "./layers/light-layer.js";
import { initHud, initRevealObserver } from "./ui/hud.js";

const root = document.documentElement;
const scrollShell = document.querySelector(".scroll-shell");
const loader = document.querySelector(".loader");

const layers = [
  createBackgroundLayer({ canvas: document.querySelector("#background-canvas") }),
  createHelloLayer({ canvas: document.querySelector("#hello-canvas") }),
  createLightLayer({ canvas: document.querySelector("#light-canvas") })
];

const state = createAppState({ root, scrollShell });

function resizeCanvases() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  layers.forEach((layer) => {
    configureCanvas(layer.canvas, layer.ctx, window.innerWidth, window.innerHeight, dpr);
  });
}

function render(now) {
  state.updateFrame(now);
  layers.forEach((layer) => layer.render(state));
  document.querySelectorAll(".thumb").forEach((thumb, index) => {
    thumb.style.setProperty("--spin", `${(now * 0.03 + index * 31) % 360}deg`);
  });
  requestAnimationFrame(render);
}

initHud({ root, state, scrollShell, loader });
initRevealObserver(scrollShell);

resizeCanvases();
window.addEventListener("resize", resizeCanvases);
requestAnimationFrame(render);
