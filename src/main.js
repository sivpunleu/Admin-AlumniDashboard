import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import api from "@/API/api";
import { useAuthStore } from "@/stores/useAuth";
import { useProfileStore } from "@/stores/useProfile";
import Swal from "sweetalert2";

const app = createApp(App);

app.use(createPinia());
app.use(router);

// Restore auth state (set Authorization header) if token exists on startup
const auth = useAuthStore();
let isHandlingUnauthorized = false;

const hasBearerToken = (headers = {}) => {
  const authorization = typeof headers.get === "function"
    ? headers.get("Authorization")
    : headers.Authorization || headers.authorization;

  return String(authorization || "").startsWith("Bearer ");
};

const isPublicAuthRequest = (url = "") => [
  "auth/login",
  "auth/forget-password",
  "auth/reset-password",
  "auth/change-password",
  "auth/change-email",
  "auth/verify-change-email",
  "/otp/send",
  "/otp/verify",
].some((endpoint) => String(url).includes(endpoint));

const collectResponseMessages = (value) => {
  if (Array.isArray(value)) return value.flatMap(collectResponseMessages);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectResponseMessages);
  }
  return typeof value === "string" && value.trim() ? [value.trim()] : [];
};

const isChangeEmailInvalidPassword = (url = "", responseData) => {
  if (!String(url).includes("auth/admin/change-email")) return false;

  const message = collectResponseMessages(responseData).join(" ").toLowerCase();
  return (
    message.includes("password") &&
    (message.includes("invalid") ||
      message.includes("incorrect") ||
      message.includes("wrong"))
  );
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const config = error.config || {};

    if (
      status === 401 &&
      hasBearerToken(config.headers) &&
      !auth.sessionRefreshing &&
      !isPublicAuthRequest(config.url) &&
      !isChangeEmailInvalidPassword(config.url, error.response?.data)
    ) {
      error.isSessionExpired = true;

      if (!isHandlingUnauthorized) {
        isHandlingUnauthorized = true;
        auth.clearAuth();

        if (router.currentRoute.value.name !== "login") {
          await router.replace({ name: "login" }).catch(() => {});
        }

        await Swal.fire({
          icon: "warning",
          title: "Session ផុតកំណត់",
          text: "សូមចូលគណនីឡើងវិញ។",
          confirmButtonColor: "#216477",
        });

        setTimeout(() => {
          isHandlingUnauthorized = false;
        }, 2500);
      }
    }

    return Promise.reject(error);
  },
);

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
