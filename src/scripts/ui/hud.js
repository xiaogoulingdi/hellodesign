import { siteConfig } from "../config/site.js";
import { createThemeState } from "../state/theme-state.js";

export function initHud({ root, state, scrollShell, loader }) {
  const clock = document.querySelector("#clock");
  const pointer = document.querySelector("#pointer");
  const themeToggle = document.querySelector("#theme-toggle");
  const soundToggle = document.querySelector("#sound-toggle");

  const theme = createThemeState({
    root,
    button: themeToggle,
    defaultMode: siteConfig.defaultTheme
  });

  function updateClock() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: siteConfig.clockTimeZone
    }).format(new Date());
    clock.textContent = `GMT+8 CN ${parts}`;
  }

  function setPointerReadout(x, y) {
    pointer.textContent = `${String(Math.round(x)).padStart(4, "0")} X ${String(Math.round(y)).padStart(4, "0")} Y`;
  }

  window.addEventListener("pointermove", (event) => {
    state.setPointer(event.clientX, event.clientY);
    setPointerReadout(event.clientX, event.clientY);

    document.querySelectorAll(".thumb").forEach((thumb) => {
      const rect = thumb.getBoundingClientRect();
      thumb.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      thumb.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  });

  themeToggle.addEventListener("click", () => {
    theme.next();
  });

  soundToggle.addEventListener("click", () => {
    state.soundOn = !state.soundOn;
    soundToggle.textContent = state.soundOn ? "SOUND[|]" : "SOUND[ ]";
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      scrollShell.scrollTo({ top: target.offsetTop, behavior: "smooth" });
    });
  });

  updateClock();
  setInterval(updateClock, 10000);
  setTimeout(() => loader.classList.add("is-hidden"), 1350);
  window.addEventListener("load", () => {
    setTimeout(() => loader.classList.add("is-hidden"), 250);
  });
}

export function initRevealObserver(scrollShell) {
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
}
