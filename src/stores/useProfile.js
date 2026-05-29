import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/API/api";
import { useAuthStore } from "@/stores/useAuth";
import Swal from "sweetalert2";

export const useProfileStore = defineStore("profile", () => {
  const profile = ref(null);
  const loading = ref(false);
  const errors = ref({});
  const profileEndpoints = ["auth/profile"];
  const avatarEndpoints = ["auth/profile/avatar"];

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

    throw lastError || new Error("មិនអាចភ្ជាប់ទៅ API ព័ត៌មានគណនីបានទេ។");
  };

  const syncAuthUser = (profileData) => {
    const authStore = useAuthStore();
    if (profileData) authStore.setUser(profileData);
  };

  const profileUpdateFallbackMessage = "មិនអាចរក្សាទុកព័ត៌មានបានទេ។";
  const uploadAvatarFallbackMessage = "មិនអាចបង្ហោះរូបភាពបានទេ។";
  const deleteAvatarFallbackMessage = "មិនអាចលុបរូបភាពបានទេ។";
  const invalidInputFallbackMessage =
    "ព័ត៌មានដែលបានបញ្ចូលមិនត្រឹមត្រូវ។ សូមពិនិត្យម្តងទៀត។";

  const readFirstError = (value) => {
    if (Array.isArray(value)) return value.map(readFirstError).find(Boolean);
    if (value && typeof value === "object") {
      return Object.values(value).map(readFirstError).find(Boolean);
    }
    return value;
  };

  const collectErrorMessages = (value) => {
    if (Array.isArray(value)) return value.flatMap(collectErrorMessages);
    if (value && typeof value === "object") {
      return Object.values(value).flatMap(collectErrorMessages);
    }
    return typeof value === "string" && value.trim() ? [value.trim()] : [];
  };

  const isGenericApiMessage = (message = "") => {
    const normalized = String(message).trim().toLowerCase();
    return [
      "invalid input",
      "bad request",
      "validation error",
      "unprocessable entity",
      "request failed",
    ].includes(normalized);
  };

  const getCharacterLimit = (message, fallback = "") => {
    const text = String(message || "");
    const match =
      text.match(/(?:exceed|more than|max(?:imum)?|longer than)[^0-9]*(\d+)/i) ||
      text.match(/(\d+)\s*(?:characters|chars)/i);

    return match?.[1] || fallback;
  };

  const hasKhmerText = (message = "") => /[\u1780-\u17ff]/.test(String(message));

  const translateKnownApiMessage = (message, fallbackMessage = "") => {
    const text = String(message || "").trim();
    const lower = text.toLowerCase();

    if (!text) return fallbackMessage;

    if (
      (lower.includes("full name") ||
        lower.includes("fullname") ||
        lower.includes("full_name")) &&
      (lower.includes("must not exceed") ||
        lower.includes("not exceed") ||
        lower.includes("maximum") ||
        lower.includes("max"))
    ) {
      const limit = getCharacterLimit(text, "50");
      return `ឈ្មោះពេញមិនអាចលើស ${limit} តួអក្សរបានទេ។`;
    }

    if (
      (lower.includes("full name") ||
        lower.includes("fullname") ||
        lower.includes("full_name")) &&
      (lower.includes("required") || lower.includes("empty") || lower.includes("blank"))
    ) {
      return "សូមបញ្ចូលឈ្មោះពេញលេញ។";
    }

    if (
      (lower.includes("current job") ||
        lower.includes("currentjob") ||
        lower.includes("current_job")) &&
      (lower.includes("must not exceed") ||
        lower.includes("not exceed") ||
        lower.includes("maximum") ||
        lower.includes("max"))
    ) {
      const limit = getCharacterLimit(text, "100");
      return `ការងារបច្ចុប្បន្នមិនអាចលើស ${limit} តួអក្សរបានទេ។`;
    }

    if (
      lower.includes("bio") &&
      (lower.includes("must not exceed") ||
        lower.includes("not exceed") ||
        lower.includes("maximum") ||
        lower.includes("max"))
    ) {
      const limit = getCharacterLimit(text, "500");
      return `ជីវប្រវត្តិមិនអាចលើស ${limit} តួអក្សរបានទេ។`;
    }

    if (lower.includes("phone") && (lower.includes("invalid") || lower.includes("format"))) {
      return "លេខទូរស័ព្ទមិនត្រឹមត្រូវ។";
    }

    if (lower.includes("department") && (lower.includes("invalid") || lower.includes("not found"))) {
      return "ដេប៉ាតឺម៉ង់ដែលបានជ្រើសរើសមិនត្រឹមត្រូវ។";
    }

    if (lower.includes("generation") && (lower.includes("invalid") || lower.includes("not found"))) {
      return "ជំនាន់ដែលបានជ្រើសរើសមិនត្រឹមត្រូវ។";
    }

    if (lower.includes("permission") || lower.includes("forbidden") || lower.includes("unauthorized")) {
      return "អ្នកមិនមានសិទ្ធិគ្រប់គ្រាន់ដើម្បីធ្វើសកម្មភាពនេះទេ។";
    }

    if (isGenericApiMessage(text)) {
      return fallbackMessage || invalidInputFallbackMessage;
    }

    if (hasKhmerText(text)) return text;

    return fallbackMessage || invalidInputFallbackMessage;
  };

  const getApiErrorMessage = (error, fallbackMessage) => {
    const responseData = error.response?.data;
    const responseMessages = [
      readFirstError(responseData?.details),
      readFirstError(responseData?.errors),
      readFirstError(responseData?.error),
      readFirstError(responseData?.ts),
      readFirstError(responseData?.msg),
      readFirstError(responseData?.data),
      readFirstError(responseData?.message),
      typeof responseData === "string" ? responseData : "",
      ...collectErrorMessages(responseData),
    ]
      .filter(Boolean)
      .map(String);

    const specificMessages = responseMessages.filter(
      (message) => !isGenericApiMessage(message),
    );
    const translatedMessages = [
      ...new Set(
        specificMessages
          .map((message) => translateKnownApiMessage(message, fallbackMessage))
          .filter(Boolean),
      ),
    ];

    if (translatedMessages.length) return translatedMessages.join("\n");
    if (fallbackMessage && responseMessages.some(isGenericApiMessage)) return fallbackMessage;
    if (responseMessages.length) return translateKnownApiMessage(responseMessages[0], fallbackMessage);
    if (error.response?.status && fallbackMessage) return fallbackMessage;

    return translateKnownApiMessage(error.message, fallbackMessage);
  };

  const isSuccessResponse = (data) =>
    data == null || (data.result !== false && data.success !== false);

  const createResponseError = (response, fallbackMessage) => {
    const error = new Error(getApiErrorMessage({ response }, fallbackMessage));
    error.response = response;
    return error;
  };

  const normalizeErrorField = (field) => {
    const fieldMap = {
      fullName: "fullname",
      full_name: "fullname",
      current_job: "currentJob",
      department_id: "departmentId",
      generation_id: "generationId",
    };

    return fieldMap[field] || field;
  };

  const getErrorFieldFromMessage = (message) => {
    const lower = String(message || "").toLowerCase();

    if (
      lower.includes("full name") ||
      lower.includes("fullname") ||
      lower.includes("full_name")
    ) {
      return "fullname";
    }
    if (lower.includes("phone")) return "phone";
    if (
      lower.includes("current job") ||
      lower.includes("currentjob") ||
      lower.includes("current_job")
    ) {
      return "currentJob";
    }
    if (lower.includes("bio")) return "bio";
    if (lower.includes("department")) return "departmentId";
    if (lower.includes("generation")) return "generationId";

    return "";
  };

  const getApiFieldErrors = (error) => {
    const responseData = error.response?.data || {};
    const responseErrors = responseData.errors;
    const fieldErrors = {};

    if (responseErrors && typeof responseErrors === "object" && !Array.isArray(responseErrors)) {
      Object.entries(responseErrors).forEach(([field, value]) => {
        const message = readFirstError(value);
        if (!message || isGenericApiMessage(message)) return;

        fieldErrors[normalizeErrorField(field)] = translateKnownApiMessage(message);
      });
    }

    collectErrorMessages(responseData.details).forEach((message) => {
      if (!message || isGenericApiMessage(message)) return;

      const field = getErrorFieldFromMessage(message);
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = translateKnownApiMessage(message);
      }
    });

    return fieldErrors;
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
      errors.value = getApiFieldErrors(error);
      Swal.fire("កំហុស", getApiErrorMessage(error, uploadAvatarFallbackMessage), "error");
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
      errors.value = getApiFieldErrors(error);
      Swal.fire("កំហុស", getApiErrorMessage(error, deleteAvatarFallbackMessage), "error");
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
      const sanitizedPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== null && value !== undefined && value !== ""),
      );
      const response = await api.put("auth/profile", sanitizedPayload);
      if (!isSuccessResponse(response.data)) {
        throw createResponseError(response, profileUpdateFallbackMessage);
      }

      const profileData = normalizePayload(response);

      if (profileData) {
        profile.value = profileData;
        syncAuthUser(profileData);
      }

      const refreshedProfile = await fetchProfile();
      Swal.fire("ជោគជ័យ", "ព័ត៌មានត្រូវបានរក្សាទុកដោយជោគជ័យ។", "success");
      return refreshedProfile || profileData;
    } catch (error) {
      errors.value = getApiFieldErrors(error);
      Swal.fire("កំហុស", getApiErrorMessage(error, profileUpdateFallbackMessage), "error");
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
