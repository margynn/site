function copyText(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

document.querySelectorAll(".copy-button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const code = btn.closest(".code-title").nextElementSibling.querySelector("code").innerText.trim();
    copyText(code);
    btn.textContent = "Copied";
    setTimeout(() => { btn.textContent = "Copy"; }, 1500);
  });
});
