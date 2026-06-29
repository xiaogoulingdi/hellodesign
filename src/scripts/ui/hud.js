import { siteConfig } from "../config/site.js";
import { createThemeState } from "../state/theme-state.js";

export function initHud({ root, state }) {
  const clock = document.querySelector("#clock");
  const pointer = document.querySelector("#pointer-readout");
  const pointerPixel = document.querySelector(".pointer-pixel");
  const themeToggle = document.querySelector("#theme-toggle");
  const soundToggle = document.querySelector("#sound-toggle");
  const soundtrack = document.querySelector("#soundtrack");
  const loader = document.querySelector(".loader");
  const loaderValue = document.querySelector(".loader__value");
  let lastPointerRipple = 0;

  const theme = createThemeState({
    root,
    button: themeToggle,
    defaultMode: siteConfig.defaultTheme
  });

  function updateClock() {
    const time = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: siteConfig.clockTimeZone
    }).format(new Date());
    clock.textContent = `GMT+8 CN ${time} 30°C`;
  }

  function setPointerReadout(x, y) {
    pointer.textContent = `${String(Math.round(x)).padStart(4, "0")} X ${String(Math.round(y)).padStart(4, "0")} Y`;
  }

  function setLoadProgress(progress) {
    const value = Math.round(Math.min(Math.max(progress, 0), 100));
    loader.style.setProperty("--loader-progress", `${value}%`);
    loaderValue.textContent = String(value).padStart(3, "0");
  }

  function completeLoad() {
    setLoadProgress(100);
    window.setTimeout(() => loader.classList.add("is-hidden"), 420);
  }

  window.addEventListener("pointermove", (event) => {
    const movement = Math.hypot(event.movementX || 0, event.movementY || 0);
    state.setPointer(event.clientX, event.clientY, movement);
    setPointerReadout(event.clientX, event.clientY);
    root.style.setProperty("--pointer-x", `${event.clientX}px`);
    root.style.setProperty("--pointer-y", `${event.clientY}px`);
    pointerPixel.hidden = false;

    const overHeroGlass = state.position < 2.9
      && event.clientX > window.innerWidth * 0.12
      && event.clientX < window.innerWidth * 0.9
      && event.clientY > window.innerHeight * 0.22
      && event.clientY < window.innerHeight * 0.72;
    if (overHeroGlass && movement > 5 && performance.now() - lastPointerRipple > 110) {
      state.addRipple?.(event.clientX, event.clientY, Math.min(1.25, 0.52 + movement / 42), "hello");
      lastPointerRipple = performance.now();
    }
  });

  document.documentElement.addEventListener("mouseleave", () => {
    root.style.setProperty("--pointer-x", "-20px");
    root.style.setProperty("--pointer-y", "-20px");
  });

  themeToggle.addEventListener("click", theme.next);

  soundToggle.addEventListener("click", async () => {
    if (soundtrack.paused) {
      try {
        await soundtrack.play();
        soundToggle.textContent = "SOUND[-]";
      } catch {
        soundToggle.textContent = "SOUND[!]";
      }
    } else {
      soundtrack.pause();
      soundToggle.textContent = "SOUND[\\]";
    }
  });

  document.querySelectorAll("[data-jump]").forEach((control) => {
    control.addEventListener("click", (event) => {
      event.preventDefault();
      state.setTarget(Number(control.dataset.jump));
    });
  });

  updateClock();
  setPointerReadout(state.pointer.x, state.pointer.y);
  setLoadProgress(4);
  window.setInterval(updateClock, 10000);

  return { theme, setLoadProgress, completeLoad };
}
