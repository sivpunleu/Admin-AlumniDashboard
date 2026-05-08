import { defineStore } from "pinia";
import api from "@/API/api";
import { ref, computed } from "vue";
import swal from "sweetalert2";
import router from "@/router";
import { useProfileStore } from "@/stores/useProfile";

export const useAuthStore = defineStore("auth", () => {
  // --- State ---
  const token = ref(localStorage.getItem("token") || null);
  const user = ref(JSON.parse(localStorage.getItem("user")) || null);
  const loading = ref(false);
  const errors = ref({})
  // --- Getters ---
  const isLogined = computed(() => !!token.value);
  const getUser = computed(() => user.value);

  /**
   * ឆែកថាតើអ្នកប្រើប្រាស់ជា Admin ឬទេ (សម្រាប់ប្រើក្នុង requireAdmin)
   */
  const isAdmin = computed(() => {
    if (!user.value) return false;
    const roleName =
      user.value.role?.name || user.value.role || user.value.userRole || "";
    return ["admin", "administrator"].includes(String(roleName).toLowerCase());
  });

  // Backend login route confirmed from live API probes.
  const loginEndpoint = "auth/login";

  // --- Actions ---

  /**
   * Sync user payload from other stores (e.g. profile store)
   */
  const setUser = (userData) => {
    user.value = userData || null;
    localStorage.setItem("user", JSON.stringify(user.value));
  };

  /**
   * មុខងារ Login
   */
  const login = async (credentials) => {
    loading.value = true;
    errors.value = {};
    try {
      const response = await api.post(loginEndpoint, credentials);

      // Debug: log raw response for troubleshooting login payload shapes
      // Remove or disable in production.
      // eslint-disable-next-line no-console
      console.debug("[auth.login] raw response:", response);

      // យកទិន្នន័យ — ស្រាវជ្រាវច្រើននូវរចនាសម្ព័ន្ធ (token / access_token / data)
      const responseData = response?.data || {};
      const payload = responseData.data || responseData || {};

      // Support common token field names: token, access_token
      const userToken =
        payload.token ||
        payload.access_token ||
        responseData.token ||
        responseData.access_token ||
        (payload?.data && (payload.data.token || payload.data.access_token)) ||
        null;

      // Support common user locations
      const userData =
        payload.user ||
        responseData.user ||
        (payload?.data && payload.data.user) ||
        payload ||
        null;

      if (!userToken) {
        // eslint-disable-next-line no-console
        console.error("[auth.login] token not found in response", responseData);
        throw new Error("Token not found");
      }

      // រក្សាទុកក្នុង State និង LocalStorage
      token.value = userToken;
      user.value = userData;
      localStorage.setItem("token", userToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // កំណត់ Header សម្រាប់ Request បន្ទាប់ៗ
      api.defaults.headers.common["Authorization"] = `Bearer ${userToken}`;

      return response.data;
    } catch (error) {
      if (error.response?.status === 422) {
        errors.value = error.response.data.errors;
      } else if (error.response?.status === 401) {
        swal.fire({
          icon: "error",
          title: "បរាជ័យ",
          text: "អ៊ីមែល ឬលេខសម្ងាត់មិនត្រឹមត្រូវ!",
        });
      } else {
        swal.fire({
          icon: "error",
          title: "កំហុស",
          text: "មិនអាចទាក់ទងម៉ាស៊ីនមេបានទេ",
        });
      }
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * មុខងារ Logout
   */
  const logout = () => {
    const profileStore = useProfileStore();
    swal
      .fire({
        title: "ចាកចេញ?",
        text: "អ្នកនឹងត្រូវចាកចេញពីប្រព័ន្ធ!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "បាទ ចាកចេញ",
        cancelButtonText: "បោះបង់",
        confirmButtonColor: "#d33",
      })
      .then((result) => {
        if (result.isConfirmed) {
          // សម្អាតទិន្នន័យ
          token.value = null;
          user.value = null;
          if (profileStore) profileStore.profile = null;

          localStorage.removeItem("token");
          localStorage.removeItem("user");
          delete api.defaults.headers.common["Authorization"];

          swal
            .fire({
              icon: "success",
              title: "ជោគជ័យ",
              timer: 1000,
              showConfirmButton: false,
            })
            .then(() => {
              router.push({ name: "login" });
            });
        }
      });
  };

  /**
   * ប្រើសម្រាប់ហៅក្នុង main.js ដើម្បីរក្សាសិទ្ធិពេល Refresh page
   */
  const checkAuth = () => {
    if (token.value) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token.value}`;
    }
  };

  return {
    token,
    user,
    loading,
    errors,
    isLogined,
    isAdmin,
    getUser,
    setUser,
    login,
    logout,
    checkAuth,
  };
});
