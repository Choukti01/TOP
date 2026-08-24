import { createApp } from "vue";

import { createPinia } from "pinia";

import App from "./App.vue";

import router from "./router";
import { markTopSessionAnonymous } from "./lib/auth";

const app = createApp(App);

app.use(createPinia());

app.use(router);

window.addEventListener("top-auth-expired", () => {
  markTopSessionAnonymous();
  const current = router.currentRoute.value;
  if (current.path !== "/join") void router.push({ path: "/join", query: { next: current.fullPath } });
});

app.mount("#app");
