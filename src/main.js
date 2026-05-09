import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "@/stores/useAuth";
import { useProfileStore } from "@/stores/useProfile";

const app = createApp(App);

app.use(createPinia());
app.use(router);

// Restore auth state (set Authorization header) if token exists on startup
const auth = useAuthStore();
auth.checkAuth();
const profileStore = useProfileStore();
if (auth.isLogined) {
  profileStore.fetchProfile().catch(() => {});
}

app.mount("#app");
//bootstrap
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
//icons
import "bootstrap-icons/font/bootstrap-icons.css";
// sweet alert
import "sweetalert2/dist/sweetalert2.min.css";
// app styles
import "./assets/main.css";
