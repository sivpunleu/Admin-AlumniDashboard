import { defineStore } from "pinia";
import api from "@/API/api";
import { ref, computed } from "vue";
import swal from "sweetalert2";
import router from "@/router";
import { useProfileStore } from "@/stores/useProfile";

const getStoredToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

const getActiveStorage = () =>
  localStorage.getItem("token") ? localStorage : sessionStorage;

const getStoredUser = () => {
  const storage = getActiveStorage();
  const storedUser = storage.getItem("user");
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    return null;
  }
};

const clearStoredAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
};

const persistAuth = (userToken, userData, remember) => {
  const storage = remember ? localStorage : sessionStorage;

  clearStoredAuth();
  storage.setItem("token", userToken);
  storage.setItem("user", JSON.stringify(userData));
};

const readFirstError = (value) => {
  if (Array.isArray(value)) return value[0];
  return value;
};

const createAuthError = (error, fallbackMessage) => {
  const responseErrors = error.response?.data?.errors || {};
  const fieldErrors = Object.fromEntries(
    Object.entries(responseErrors).map(([field, value]) => [
      field,
      readFirstError(value),
    ]),
  );

  return {
    message:
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      fallbackMessage,
    fieldErrors,
    status: error.response?.status || error.status || null,
    originalError: error,
  };
};

const extractResetToken = (responseData) => {
  const payload = responseData?.data || responseData || {};
  return payload.token || payload.resetToken || payload.reset_token || "";
};

const isUnverifiedAccountError = (error) => {
  const message = String(error.response?.data?.message || "").toLowerCase();
  return (
    error.response?.status === 401 &&
    (message.includes("verify") ||
      message.includes("verified") ||
      message.includes("otp"))
  );
};

export const useAuthStore = defineStore("auth", () => {
  const token = ref(getStoredToken() || null);
  const user = ref(getStoredUser());
  const loading = ref(false);
  const errors = ref({});

  const isLogined = computed(() => !!token.value);
  const getUser = computed(() => user.value);

  const checkIsAdmin = (userData) => {
    if (!userData) return false;
    const roleName =
      userData.role?.name || userData.role || userData.userRole || "";
    return ["admin", "administrator"].includes(String(roleName).toLowerCase());
  };

  const isAdmin = computed(() => checkIsAdmin(user.value));

  const clearAuth = () => {
    const profileStore = useProfileStore();
    token.value = null;
    user.value = null;
    if (profileStore) profileStore.profile = null;
    clearStoredAuth();
    delete api.defaults.headers.common["Authorization"];
  };

  const login = async (credentials, { remember = false } = {}) => {
    loading.value = true;
    errors.value = {};
    try {
      const response = await api.post("auth/login", credentials);
      const responseData = response?.data || {};
      const payload = responseData.data || responseData || {};

      // ទាញយក Token និង User Data
      const userToken =
        payload.token || payload.access_token || responseData.token || null;
      const userData =
        payload.user || responseData.user || (payload.email ? payload : null);

      if (!userToken) throw new Error("មិនអាចរកឃើញ Token ពីម៉ាស៊ីនមេឡើយ");


      if (!checkIsAdmin(userData)) {
        swal.fire({
          icon: "error",
          title: "សិទ្ធិមិនគ្រប់គ្រាន់",
          text: "គណនីនេះសម្រាប់តែ Admin ទេ។ សូមប្រើគណនី Admin ដើម្បីចូល។",
          timer: 1600,
        });
        throw new Error("Unauthorized: Not an admin");
      }


      token.value = userToken;
      user.value = userData;
      persistAuth(userToken, userData, remember);
      api.defaults.headers.common["Authorization"] = `Bearer ${userToken}`;

      const profileStore = useProfileStore();
      if (profileStore) {
        await profileStore.fetchProfile();
      }

      return response.data;
    } catch (error) {
      if (error.response?.status === 422) {
        errors.value = error.response.data.errors;
      } else if (isUnverifiedAccountError(error)) {
        const result = await swal.fire({
          icon: "warning",
          title: "គណនីមិនទាន់បានផ្ទៀងផ្ទាត់",
          text: "គណនីរបស់អ្នកមិនទាន់បាន verify ទេ។ សូមបញ្ចូល OTP ដើម្បីផ្ទៀងផ្ទាត់គណនី។",
          showCancelButton: true,
          confirmButtonText: "ទៅ Verify គណនី",
          cancelButtonText: "បិទ",
          confirmButtonColor: "#216477",
        });

        if (result.isConfirmed) {
          await router.push({
            name: "verify-account",
            query: { email: credentials.email || "" },
          });
        }
      } else if (error.response?.status === 401) {
        await swal.fire({
          icon: "error",
          title: "បរាជ័យ",
          text: "អ៊ីមែល ឬលេខសម្ងាត់មិនត្រឹមត្រូវ!",
        });
      }
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      const response = await api.post("auth/forget-password", { email });
      return {
        data: response?.data || {},
        token: extractResetToken(response?.data),
      };
    } catch (error) {
      throw createAuthError(
        error,
        "មិនអាចផ្ញើតំណកំណត់ពាក្យសម្ងាត់ឡើងវិញបានទេ។",
      );
    }
  };

  const resetPassword = async ({ token, newPassword }) => {
    try {
      const response = await api.post("auth/reset-password", {
        token,
        newPassword,
      });

      return response?.data || {};
    } catch (error) {
      throw createAuthError(error, "មិនអាចកំណត់ពាក្យសម្ងាត់ឡើងវិញបានទេ។");
    }
  };

  const sendVerificationOtp = async (email) => {
    try {
      const response = await api.post("/otp/send", { email });
      const responseData = response?.data || {};
      if (responseData.result === false) {
        throw new Error(responseData.message || "មិនអាចផ្ញើ OTP បានទេ។");
      }
      return responseData;
    } catch (error) {
      throw createAuthError(error, "មិនអាចផ្ញើ OTP បានទេ។");
    }
  };

  const verifyAccount = async ({ email, code }) => {
    try {
      const response = await api.post("/otp/verify", { email, code });
      const responseData = response?.data || {};
      if (responseData.result === false) {
        throw new Error(responseData.message || "មិនអាចផ្ទៀងផ្ទាត់គណនីបានទេ។");
      }
      return responseData;
    } catch (error) {
      throw createAuthError(error, "មិនអាចផ្ទៀងផ្ទាត់គណនីបានទេ។");
    }
  };

  const logout = async () => {
    const result = await swal.fire({
      title: "ចាកចេញ?",
      text: "អ្នកនឹងត្រូវចាកចេញពីប្រព័ន្ធ!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "បាទ ចាកចេញ",
      cancelButtonText: "បោះបង់",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    clearAuth();
    await router.push({ name: "login" });
    await swal.fire({
      icon: "success",
      title: "ចាកចេញជោគជ័យ",
      text: "អ្នកបានចាកចេញពីប្រព័ន្ធរួចរាល់។",
      timer: 1600,
      showConfirmButton: false,
    });
  };

  const checkAuth = () => {
    if (token.value) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token.value}`;
    }
  };

  const setUser = (userData) => {
    user.value = userData || null;
    if (userData) {
      getActiveStorage().setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
    }
  };

  return {
    token,
    user,
    getUser,
    loading,
    errors,
    isLogined,
    isAdmin,
    checkIsAdmin,
    clearAuth,
    login,
    logout,
    checkAuth,
    setUser,
    requestPasswordReset,
    resetPassword,
    sendVerificationOtp,
    verifyAccount,
  };
});
