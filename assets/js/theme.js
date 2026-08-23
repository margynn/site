const THEMES = {
  dark:  { background: "#1a2132", foreground: "#c9d1d9", accent: "#58a6ff", gradientEnd: "#090d1e" },
  light: { background: "#f5f0e8", foreground: "#1a1a1a", accent: "#b85c45", gradientEnd: "#e0dbd2" },
};
const THEME_ORDER = ["dark", "light"];

function applyTheme(name) {
  const t = THEMES[name];
  if (!t) return;
  const r = document.documentElement;
  r.style.setProperty("--background", t.background);
  r.style.setProperty("--foreground", t.foreground);
  r.style.setProperty("--accent", t.accent);
  r.style.setProperty("--gradient-end", t.gradientEnd);
  r.dataset.theme = name;
  localStorage.setItem("theme", name);
}

// Cycle button
const cycleBtn = document.getElementById("theme-cycle");
if (cycleBtn) {
  cycleBtn.addEventListener("click", () => {
    const current = localStorage.getItem("theme") || "dark";
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
