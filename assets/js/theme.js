const THEMES = {
  warm:  { background: "#f5f0e6", foreground: "#1a170f", accent: "#b8860b" },
  night: { background: "#0d1117", foreground: "#c9d1d9", accent: "#58a6ff" },
  ocean: { background: "#001916", foreground: "#cdfff2", accent: "#00ffb3" },
};
const THEME_ORDER = ["warm", "night", "ocean"];

function applyTheme(name) {
  const t = THEMES[name];
  if (!t) return;
  const r = document.documentElement;
  r.style.setProperty("--background", t.background);
  r.style.setProperty("--foreground", t.foreground);
  r.style.setProperty("--accent", t.accent);
  localStorage.setItem("theme", name);
}

// Cycle button
const cycleBtn = document.getElementById("theme-cycle");
if (cycleBtn) {
  cycleBtn.addEventListener("click", () => {
    const current = localStorage.getItem("theme") || "warm";
    const idx = THEME_ORDER.indexOf(current);
    applyTheme(THEME_ORDER[(idx + 1) % THEME_ORDER.length]);
  });
}

// Language preference — save on explicit switch
document.querySelectorAll("[data-lang-switch]").forEach((a) => {
  a.addEventListener("click", () => localStorage.setItem("lang", a.dataset.langSwitch));
});

// Redirect from default language root to preferred language
if (window.location.pathname === "/") {
  const pref = localStorage.getItem("lang");
  if (pref && pref !== "en") window.location.replace("/" + pref + "/");
}
