import { createApp } from "vue";

import { createPinia } from "pinia";

import App from "./App.vue";

import router from "./router";
import { markTopSessionAnonymous } from "./lib/auth";

const app = createApp(App);

app.use(createPinia());

app.use(router);

// U+2197 can be presented as an emoji by iOS when a component font has no glyph.
// TOP uses its text presentation everywhere so the mark stays precise on every device.
function keepDirectionalMarksAsText(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) {
    const current = root.nodeValue ?? "";
    const normalized = current.replace(/\u2197(?!\uFE0E)/g, "\u2197\uFE0E");
    if (normalized !== current) root.nodeValue = normalized;
    return;
  }

  for (const child of root.childNodes) keepDirectionalMarksAsText(child);
}

window.addEventListener("top-auth-expired", () => {
  markTopSessionAnonymous();
  const current = router.currentRoute.value;
  if (current.path !== "/join") void router.push({ path: "/join", query: { next: current.fullPath } });
});

app.mount("#app");

keepDirectionalMarksAsText(document.body);
new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "characterData") keepDirectionalMarksAsText(mutation.target);
    else for (const node of mutation.addedNodes) keepDirectionalMarksAsText(node);
  }
}).observe(document.body, { childList: true, characterData: true, subtree: true });
