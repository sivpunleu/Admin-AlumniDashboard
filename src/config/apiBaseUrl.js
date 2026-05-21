export const DEFAULT_API_BASE_URL = "https://ant-g2-ams.tt.linkpc.net/api/v1";

export const normalizeBaseUrl = (url) => {
  const value = String(url || "").trim();
  return value ? value.replace(/\/+$/, "") : "";
};

export const API_BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) || DEFAULT_API_BASE_URL;

export const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL.replace(/\/api\/.*$/i, "");
  }
})();

export const resolveApiAssetUrl = (path) => {
  if (!path) return "";

  const value = String(path).trim();
  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  const cleanPath = value.replace(/\\/g, "/").replace(/^\/+/, "");
  if (/^(api|storage|uploads|images)\//i.test(cleanPath)) {
    return `${API_ORIGIN}/${cleanPath}`;
  }

  return `${API_BASE_URL}/${cleanPath}`;
};
