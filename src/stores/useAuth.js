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

export const useAuthStore = defineStore("auth", () => {
  const token = ref(getStoredToken() || null);
  const user = ref(getStoredUser());
  const loading = ref(false);
  const errors = ref({});

  const isLogined = computed(() => !!token.value);
  const getUser = computed(() => user.value);

  // Function ជំនួយសម្រាប់ឆែកថាជា Admin ឬទេ
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

      // --- លក្ខខណ្ឌសំខាន់: បើមិនមែន Admin មិនឱ្យចូល ---
      if (!checkIsAdmin(userData)) {
        swal.fire({
          icon: "error",
          title: "សិទ្ធិមិនគ្រប់គ្រាន់",
          text: "គណនីនេះសម្រាប់តែ Admin ទេ។ អ្នកមិនអាចចូលប្រើប្រាស់បានឡើយ!",
        });
        throw new Error("Unauthorized: Not an admin");
      }

      // បើផ្ទៀងផ្ទាត់ជោគជ័យ ទើបឱ្យ Save ទិន្នន័យ
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
      } else if (error.response?.status === 401) {
        swal.fire({
          icon: "error",
          title: "បរាជ័យ",
          text: "អ៊ីមែល ឬលេខសម្ងាត់មិនត្រឹមត្រូវ!",
        });
      }
      throw error; // បោះ Error ទៅឱ្យ Component ចាប់បន្ត
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
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
          clearAuth();
          router.push({ name: "login" });
        }
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
  };
});
