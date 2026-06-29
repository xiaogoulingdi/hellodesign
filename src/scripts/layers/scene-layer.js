import { siteConfig } from "../config/site.js";
import { clamp, inverseLerp, lerp, smoothstep } from "../utils/math.js";

function fadeWindow(position, start, end, edge = 0.42) {
  const fadeIn = smoothstep(inverseLerp(start, start + edge, position));
  const fadeOut = 1 - smoothstep(inverseLerp(end - edge, end, position));
  return clamp(Math.min(fadeIn, fadeOut));
}

function setSceneState(element, opacity, y = 0, scale = 1) {
  element.style.setProperty("--scene-opacity", opacity.toFixed(4));
  element.style.setProperty("--scene-y", `${y.toFixed(2)}px`);
  element.style.setProperty("--scene-scale", scale.toFixed(4));
  element.classList.toggle("is-active", opacity > 0.015);
  element.setAttribute("aria-hidden", opacity > 0.015 ? "false" : "true");
}

export function createSceneLayer({ state }) {
  const root = document.documentElement;
  const scenes = Object.fromEntries(
    [...document.querySelectorAll("[data-scene]")].map((element) => [element.dataset.scene, element])
  );
  const workGrid = document.querySelector(".work-grid");
  const hyperHeadline = document.querySelector(".hyper-headline");
  const principles = document.querySelector(".principles");
  const signature = document.querySelector(".signature");
  const meter = document.querySelector(".scroll-meter");
  let hyperStage = "";

  signature.querySelectorAll("path").forEach((path) => {
    path.style.setProperty("--path-length", String(Math.ceil(path.getTotalLength())));
  });

  function setHyperText(lines) {
    const key = lines.join("|");
    if (key === hyperStage) return;
    hyperStage = key;
    hyperHeadline.replaceChildren(
      ...lines.map((line) => {
        const span = document.createElement("span");
        span.textContent = line;
        return span;
      })
    );
  }

  function render() {
    const p = state.position;
    const ranges = siteConfig.scenes;

    const heroOpacity = 1 - smoothstep(inverseLerp(0.82, 1.58, p));
    setSceneState(scenes.hero, heroOpacity, lerp(0, -80, smoothstep(p / ranges.hero[1])));

    const manifestoOpacity = fadeWindow(p, ...ranges.manifesto, 0.52);
    const manifestoProgress = smoothstep(inverseLerp(ranges.manifesto[0], ranges.manifesto[1], p));
    setSceneState(scenes.manifesto, manifestoOpacity, lerp(80, -48, manifestoProgress));
    signature.style.setProperty("--signature-progress", clamp(manifestoProgress * 1.8).toFixed(4));

    const workOpacity = fadeWindow(p, ...ranges.work, 0.4);
    const workProgress = smoothstep(inverseLerp(ranges.work[0], ranges.work[1], p));
    setSceneState(scenes.work, workOpacity, 0);
    workGrid.style.setProperty("--work-y", `${lerp(92, -238, workProgress).toFixed(2)}vh`);

    const hyperOpacity = fadeWindow(p, ...ranges.hyper, 0.48);
    const hyperProgress = inverseLerp(ranges.hyper[0], ranges.hyper[1], p);
    setSceneState(scenes.hyper, hyperOpacity, 0, lerp(0.97, 1, hyperOpacity));

    let headlineOpacity = 1;
    let principlesOpacity = 0;
    if (hyperProgress < 0.22) {
      setHyperText(["INNOVATE", "WITH", "PURPOSE"]);
      headlineOpacity = smoothstep(inverseLerp(0.06, 0.2, hyperProgress));
    } else if (hyperProgress < 0.58) {
      setHyperText(["INNOVATE", "WITH A", "HUMAN TOUCH"]);
      headlineOpacity = smoothstep(inverseLerp(0.22, 0.34, hyperProgress));
    } else if (hyperProgress < 0.76) {
      headlineOpacity = 1 - smoothstep(inverseLerp(0.58, 0.66, hyperProgress));
      principlesOpacity = smoothstep(inverseLerp(0.62, 0.7, hyperProgress));
    } else {
      setHyperText(["FUTURE-FIRST", "ALWAYS"]);
      headlineOpacity = smoothstep(inverseLerp(0.78, 0.86, hyperProgress));
      principlesOpacity = 1 - headlineOpacity;
    }
    hyperHeadline.style.opacity = headlineOpacity.toFixed(3);
    principles.style.setProperty("--principles-opacity", principlesOpacity.toFixed(3));
    principles.classList.toggle("is-visible", principlesOpacity > 0.01);

    const contactOpacity = p > 16.7 ? 1 : fadeWindow(p, ...ranges.contact, 0.58);
    const contactProgress = smoothstep(inverseLerp(ranges.contact[0], ranges.contact[1], p));
    setSceneState(scenes.contact, contactOpacity, lerp(70, 0, contactProgress));

    const blueScene = p < 3.15 || p > 13.95;
    root.style.setProperty(
      "--scene-background",
      blueScene ? "var(--deep-blue)" : "var(--background)"
    );
    meter.style.setProperty("--scroll-meter-y", `${(p / state.totalScroll) * 100}%`);
  }

  return { render };
}
