const isProd = process.env.NODE_ENV === "production";

function maskSensitive(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  const cloned = Array.isArray(obj) ? [] : {};

  const sensitiveRE = /password|pass|token|secret|authorization|auth/i;

  for (const key of Object.keys(obj)) {
    try {
      const val = obj[key];
      if (val && typeof val === "object") {
        cloned[key] = maskSensitive(val);
      } else if (sensitiveRE.test(key)) {
        cloned[key] = "[REDACTED]";
      } else {
        cloned[key] = val;
      }
    } catch (e) {
      cloned[key] = "[UNSERIALIZABLE]";
    }
  }
  return cloned;
}

function safeArgs(args) {
  return args.map((a) => {
    if (a && typeof a === "object") return maskSensitive(a);
    return a;
  });
}

export default {
  debug: (...args) => {
    if (isProd) return;
    console.debug("[DEBUG]", ...safeArgs(args));
  },
  info: (...args) => {
    if (isProd) return;
    console.info("[INFO]", ...safeArgs(args));
  },
  warn: (...args) => {
    console.warn("[WARN]", ...safeArgs(args));
  },
  error: (...args) => {
    console.error("[ERROR]", ...safeArgs(args));
  },
};
