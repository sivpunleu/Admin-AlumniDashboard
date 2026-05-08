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

  const syncAuthUser = (profileData) => {
    const authStore = useAuthStore();
    if (profileData) authStore.setUser(profileData);
  };

  const fetchProfile = async () => {
    loading.value = true;
    try {
      let profileData = null;
      for (const endpoint of profileEndpoints) {
        try {
          const res = await api.get(endpoint);
          profileData = normalizePayload(res);
          break;
        } catch (e) {
          continue;
        }
      }
      profile.value = profileData;
      syncAuthUser(profileData);
      return profileData;
    } finally {
      loading.value = false;
    }
  };

  // កែសម្រួលឱ្យទទួលយកទាំង File និង Blob (សម្រាប់ Cropper)
  const uploadAvatar = async (fileOrBlob) => {
    loading.value = true;
    const formData = new FormData();

    // ប្រសិនបើជា Blob (ពី Cropper) យើងត្រូវកំណត់ឈ្មោះឱ្យវា
    const file =
      fileOrBlob instanceof Blob && !(fileOrBlob instanceof File)
        ? new File([fileOrBlob], `avatar_${Date.now()}.jpg`, {
            type: "image/jpeg",
          })
        : fileOrBlob;

    formData.append("avatar", file);

    try {
      let response = null;
      // សាកល្បងជាមួយ POST រួចសាកជាមួយ PUT (តាមស្ដង់ដារ API ខុសៗគ្នា)
      for (const method of ["post", "put"]) {
        for (const endpoint of avatarEndpoints) {
          try {
            response = await api[method](endpoint, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            if (response) break;
          } catch (e) {
            continue;
          }
        }
        if (response) break;
      }

      const uploadedData = normalizePayload(response);
      profile.value = uploadedData;
      syncAuthUser(uploadedData);
      return uploadedData;
    } catch (error) {
      Swal.fire("កំហុស", "មិនអាចបង្ហោះរូបភាពបានទេ", "error");
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const deleteAvatar = async () => {
    const result = await Swal.fire({
      title: "Delete avatar?",
      text: "រូបភាពកម្រងរូបនឹងត្រូវលុបចេញពីប្រព័ន្ធ។",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return false;

    loading.value = true;
    try {
      let response = null;
      for (const method of ["delete", "post", "put"]) {
        for (const endpoint of avatarEndpoints) {
          try {
            response = await api[method](endpoint);
            if (response) break;
          } catch (e) {
            continue;
          }
        }
        if (response) break;
      }

      await fetchProfile();
      Swal.fire("ជោគជ័យ", "រូបភាពត្រូវបានលុប", "success");
      return true;
    } catch (error) {
      Swal.fire("កំហុស", "មិនអាចលុបរូបភាពបានទេ", "error");
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const updateProfile = async (payload) => {
    loading.value = true;
    try {
      let response = null;
      for (const endpoint of profileEndpoints) {
        try {
          response = await api.put(endpoint, payload);
          break;
        } catch (e) {
          continue;
        }
      }
      const profileData = normalizePayload(response);
      if (profileData) {
        profile.value = profileData;
        syncAuthUser(profileData);
      }

      const refreshedProfile = await fetchProfile();
      Swal.fire("ជោគជ័យ", "ព័ត៌មានត្រូវបានរក្សាទុក", "success");
      return refreshedProfile || profileData;
    } catch (error) {
      Swal.fire("កំហុស", "ការរក្សាទុកបរាជ័យ", "error");
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
