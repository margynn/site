const THEME_ORDER = ["dark", "light"];

function applyTheme(name) {
  document.documentElement.dataset.theme = name;
  localStorage.setItem("theme", name);
  const favicon = document.getElementById("favicon-svg");
  if (favicon) favicon.href = `/favicon-${name}.svg`;
}

// Cycle button
const cycleBtn = document.getElementById("theme-cycle");
if (cycleBtn) {
  cycleBtn.addEventListener("click", () => {
    const systemDefault = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const current = localStorage.getItem("theme") || systemDefault;
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
