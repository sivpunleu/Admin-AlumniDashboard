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

  const requestFirstSuccess = async (requesters) => {
    let lastError = null;

    for (const request of requesters) {
      try {
        return await request();
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("No profile API endpoint succeeded");
  };

  const syncAuthUser = (profileData) => {
    const authStore = useAuthStore();
    if (profileData) authStore.setUser(profileData);
  };

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
          avatarEndpoints.map((endpoint) => () =>
            api[method](endpoint, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            }),
          ),
        ),
      );

      const uploadedData = normalizePayload(response);
      profile.value = uploadedData;
      syncAuthUser(uploadedData);
      return uploadedData;
    } catch (error) {
      errors.value = error.response?.data?.errors || {};
      Swal.fire("Error", "Unable to upload avatar.", "error");
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const deleteAvatar = async () => {
    const result = await Swal.fire({
      title: "Delete avatar?",
      text: "This avatar will be removed from the system.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
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
      Swal.fire("Success", "Avatar deleted.", "success");
      return true;
    } catch (error) {
      errors.value = error.response?.data?.errors || {};
      Swal.fire("Error", "Unable to delete avatar.", "error");
      throw error;
    } finally {
      loading.value = false;
    }
  };

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
      Swal.fire("Success", "Profile saved.", "success");
      return refreshedProfile || profileData;
    } catch (error) {
      errors.value = error.response?.data?.errors || {};
      Swal.fire("Error", "Unable to save profile.", "error");
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
