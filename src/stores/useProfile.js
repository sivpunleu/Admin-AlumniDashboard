import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/API/api";
import { useAuthStore } from "@/stores/useAuth";
import Swal from "sweetalert2";

export const useProfileStore = defineStore("profile", () => {
  const profile = ref(null);
  const loading = ref(false);
  const errors = ref({});
  const profileEndpoints = ["auth/profile", "profile"];
  const avatarEndpoints = ["auth/profile/avatar", "profile/avatar"];

  const normalizePayload = (response) =>
    response?.data?.data || response?.data || null;

  const shouldTryNextEndpoint = (error) => {
    const status = error?.response?.status;
    return status === 404 || status === 405;
  };

  const requestFirstSuccess = async (requesters) => {
    let lastError = null;

    for (const [index, request] of requesters.entries()) {
      try {
        return await request();
      } catch (error) {
        lastError = error;
        const hasNextRequester = index < requesters.length - 1;

        if (!hasNextRequester || !shouldTryNextEndpoint(error)) {
          throw error;
        }
      }
    }

    throw lastError || new Error("No profile API endpoint succeeded");
  };

  const syncAuthUser = (profileData) => {
    const authStore = useAuthStore();
    if (profileData) authStore.setUser(profileData);
  };

  // --- ទាញយកទិន្នន័យកម្រងព័ត៌មាន ---
  const fetchProfile = async () => {
    loading.value = true;
    errors.value = {};

    try {
      const response = await requestFirstSuccess(
        profileEndpoints.map((endpoint) => () => api.get(endpoint)),
      );
      const profileData = normalizePayload(response);

      profile.value = profileData;
      syncAuthUser(profileData);
      return profileData;
    } catch (error) {
      errors.value = error.response?.data?.errors || {};
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // --- បង្ហោះរូបភាពតំណាង (Avatar) ---
  const uploadAvatar = async (fileOrBlob) => {
    loading.value = true;
    errors.value = {};

    const formData = new FormData();
    const file =
      fileOrBlob instanceof Blob && !(fileOrBlob instanceof File)
        ? new File([fileOrBlob], `avatar_${Date.now()}.jpg`, {
            type: "image/jpeg",
          })
        : fileOrBlob;

    formData.append("avatar", file);

    try {
      const response = await requestFirstSuccess(
        ["post", "put"].flatMap((method) =>
          avatarEndpoints.map(
            (endpoint) => () =>
              api[method](endpoint, formData, {
                headers: { "Content-Type": "multipart/form-data" },
              }),
          ),
        ),
      );

      const uploadedData = normalizePayload(response);
      profile.value = uploadedData;
      syncAuthUser(uploadedData);
      Swal.fire("ជោគជ័យ", "រូបភាពត្រូវបានបង្ហោះដោយជោគជ័យ។", "success");
      return uploadedData;
    } catch (error) {
      errors.value = error.response?.data?.errors || {};
      Swal.fire("កំហុស", "មិនអាចបង្ហោះរូបភាពបានទេ។", "error");
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // --- លុបរូបភាពតំណាង ---
  const deleteAvatar = async () => {
    const result = await Swal.fire({
      title: "តើអ្នកប្រាកដជាចង់លុបឬ?",
      text: "រូបភាពកម្រងព័ត៌មាននេះនឹងត្រូវលុបចេញពីប្រព័ន្ធ។",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "លុបចេញ",
      cancelButtonText: "បោះបង់",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return false;

    loading.value = true;
    errors.value = {};

    try {
      await requestFirstSuccess(
        ["delete", "post", "put"].flatMap((method) =>
          avatarEndpoints.map((endpoint) => () => api[method](endpoint)),
        ),
      );

      await fetchProfile();
      Swal.fire("ជោគជ័យ", "រូបភាពត្រូវបានលុបចេញហើយ។", "success");
      return true;
    } catch (error) {
      errors.value = error.response?.data?.errors || {};
      Swal.fire("កំហុស", "មិនអាចលុបរូបភាពបានទេ។", "error");
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // --- កែប្រែព័ត៌មានផ្ទាល់ខ្លួន ---
  const updateProfile = async (payload) => {
    loading.value = true;
    errors.value = {};

    try {
      const response = await requestFirstSuccess(
        profileEndpoints.map((endpoint) => () => api.put(endpoint, payload)),
      );
      const profileData = normalizePayload(response);

      if (profileData) {
        profile.value = profileData;
        syncAuthUser(profileData);
      }

      const refreshedProfile = await fetchProfile();
      Swal.fire("ជោគជ័យ", "ព័ត៌មានត្រូវបានរក្សាទុកដោយជោគជ័យ។", "success");
      return refreshedProfile || profileData;
    } catch (error) {
      errors.value = error.response?.data?.errors || {};
      Swal.fire("កំហុស", "មិនអាចរក្សាទុកព័ត៌មានបានទេ។", "error");
      throw error;
    } finally {
      loading.value = false;
    }
  };

  return {
    profile,
    loading,
    errors,
    fetchProfile,
    uploadAvatar,
    deleteAvatar,
    updateProfile,
  };
});
