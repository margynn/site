// Select-all scoped to highlight block
document.addEventListener("keydown", (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.key !== "a") return;
  const node = window.getSelection()?.anchorNode;
  if (!node) return;
  const pre = (node.nodeType === 1 ? node : node.parentElement)?.closest(".highlight pre");
  if (!pre) return;
  e.preventDefault();
  const range = document.createRange();
  range.selectNodeContents(pre);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
});

// Spoiler
document.querySelectorAll(".spoiler").forEach((el) => {
  const reveal = () => el.classList.toggle("spoiler--revealed");
  el.addEventListener("click", reveal);
  el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") reveal(); });
});
