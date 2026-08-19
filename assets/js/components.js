// Tabs
document.querySelectorAll("[data-tabs]").forEach((container) => {
  const panels = Array.from(container.querySelectorAll("[data-tab]"));
  if (!panels.length) return;

  const nav = document.createElement("div");
  nav.className = "tabs__nav";

  panels.forEach((panel, i) => {
    const btn = document.createElement("button");
    btn.className = "tabs__btn" + (i === 0 ? " tabs__btn--active" : "");
    btn.textContent = panel.dataset.tab;
    btn.addEventListener("click", () => {
      panels.forEach((p) => (p.hidden = true));
      container.querySelectorAll(".tabs__btn").forEach((b) => b.classList.remove("tabs__btn--active"));
      panel.hidden = false;
      btn.classList.add("tabs__btn--active");
    });
    nav.appendChild(btn);
    if (i > 0) panel.hidden = true;
  });

  container.prepend(nav);
});

// Spoiler
document.querySelectorAll(".spoiler").forEach((el) => {
  const reveal = () => el.classList.toggle("spoiler--revealed");
  el.addEventListener("click", reveal);
  el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") reveal(); });
});
