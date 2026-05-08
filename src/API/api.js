import axios from "axios";
import { useAuthStore } from "@/stores/useAuth";

function normalizeBaseUrl(url) {
  if (!url) return url;
  // remove trailing slash
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

const defaultBase = "https://ant-g2-ams.tt.linkpc.net/api/v1";
const envBase =
  typeof import.meta !== "undefined"
    ? import.meta.env.VITE_API_BASE_URL
    : undefined;
const baseURL = normalizeBaseUrl(envBase) || defaultBase;

let api = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
  },
});
api.interceptors.request.use(
  (config) => {
    const isFormDataRequest =
      typeof FormData !== "undefined" && config.data instanceof FormData;

    if (isFormDataRequest) {
      // Allow the browser to inject multipart/form-data boundary automatically.
      if (typeof config.headers?.set === "function") {
        config.headers.set("Content-Type", undefined);
      } else if (config.headers) {
        delete config.headers["Content-Type"];
      }
    }

    // Try to get token from Pinia auth store first. If Pinia isn't
    // available yet (circular import during startup) fall back to
    // reading token from localStorage which is set on login.
    let token;
    try {
      const authStore = useAuthStore();
      token = authStore?.token?.value;
    } catch (e) {
      token = null;
    }

    if (!token) {
      token = localStorage.getItem("token");
    }

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
