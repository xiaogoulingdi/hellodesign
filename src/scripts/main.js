import { siteConfig } from "./config/site.js";
import { createTimelineState } from "./state/timeline-state.js";
import { createSceneLayer } from "./layers/scene-layer.js";
import { createFxLayer } from "./layers/fx-layer.js";
import { createWebglLayer } from "./layers/webgl-layer.js";
import { createStickerLayer } from "./layers/sticker-layer.js";
import { initHud } from "./ui/hud.js";

const root = document.documentElement;
const state = createTimelineState({ totalScroll: siteConfig.totalScroll });
const hud = initHud({ root, state });
const sceneLayer = createSceneLayer({ state });
const fxLayer = createFxLayer({
  canvas: document.querySelector("#fx-canvas"),
  state
});
const webglLayer = createWebglLayer({
  canvas: document.querySelector("#webgl-canvas"),
  state,
  onProgress(progress) {
    hud.setLoadProgress(12 + progress * 72);
  }
});
const stickerLayer = createStickerLayer({
  container: document.querySelector("#sticker-layer"),
  state
});

Promise.all([webglLayer.ready, stickerLayer.ready, document.fonts.ready])
  .then(() => hud.completeLoad())
  .catch((error) => {
    console.error("Some visual assets failed to load", error);
    hud.completeLoad();
  });

let previous = performance.now();

function frame(now) {
  const deltaSeconds = (now - previous) / 1000;
  previous = now;
  state.update(now, deltaSeconds);
  sceneLayer.render();
  fxLayer.render();
  webglLayer.render();
  stickerLayer.render();
  requestAnimationFrame(frame);
}

sceneLayer.render();
requestAnimationFrame(frame);
