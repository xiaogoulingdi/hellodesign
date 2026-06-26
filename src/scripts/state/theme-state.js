const storageKey = "hellodesign.theme";

export function createThemeState({ root, button, defaultMode = "system" }) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const modes = ["system", "dark", "light"];
  let mode = localStorage.getItem(storageKey) || defaultMode;

  function resolvedMode() {
    return mode === "system" ? (media.matches ? "dark" : "light") : mode;
  }

  function label() {
    if (mode === "dark") return "THEME[D]";
    if (mode === "light") return "THEME[L]";
    return "THEME[A]";
  }

  function apply() {
    root.classList.toggle("dark", resolvedMode() === "dark");
    button.textContent = label();
    button.setAttribute("aria-label", `Theme: ${mode}`);
  }

  function next() {
    const current = modes.indexOf(mode);
    mode = modes[(current + 1) % modes.length];
    localStorage.setItem(storageKey, mode);
    apply();
  }

  media.addEventListener("change", () => {
    if (mode === "system") apply();
  });

  apply();

  return {
    get mode() {
      return mode;
    },
    get resolved() {
      return resolvedMode();
    },
    next
  };
}
