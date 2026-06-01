import { ref } from "vue";
import { defineStore } from "pinia";
import api from "@/API/api";
import Swal from "sweetalert2";
import logger from "@/utils/logger";
import {
  getCollectionItems,
  getPaginationMeta,
} from "@/utils/paginatedCollection";

export const DEPARTMENT_NAME_MAX_LENGTH = 50;
export const DEPARTMENT_DESCRIPTION_MAX_LENGTH = 200;

// This store manages the state and actions related to departments, including fetching with pagination, creating, updating, and deleting departments, along with comprehensive error handling and user feedback through SweetAlert2.
export const useDepartmentStore = defineStore("department", () => {
  const departments = ref([]);
  const isLoading = ref(false);

  const queryParams = ref({
    _page: 1,
    _per_page: 10,
    search: "",
    sortDir: "DESC",
    sortBy: "id",
  });

  const totalItems = ref(0);
  const totalPages = ref(1);
  const departmentInUseMessage =
    "មិនអាចលុបដេប៉ាតឺម៉ង់នេះបានទេ ព្រោះកំពុងត្រូវបានប្រើប្រាស់។";
  const createFallbackMessage = "មិនអាចបង្កើតបានទេ";
  const updateFallbackMessage = "មិនអាចកែប្រែទិន្នន័យបានទេ";
  const deleteFallbackMessage = "មិនអាចលុបទិន្នន័យនេះបានទេ";
  const invalidInputFallbackMessage =
    "ព័ត៌មានដែលបានបញ្ចូលមិនត្រឹមត្រូវ។ សូមពិនិត្យម្តងទៀត។";
  const nameMaxLengthMessage =
    `ឈ្មោះដេប៉ាតឺម៉ង់មិនអាចលើស ${DEPARTMENT_NAME_MAX_LENGTH} តួអក្សរបានទេ។`;
  const descriptionMaxLengthMessage =
    `ការពិពណ៌នាដេប៉ាតឺម៉ង់មិនអាចលើស ${DEPARTMENT_DESCRIPTION_MAX_LENGTH} តួអក្សរបានទេ។`;
  const payloadTooLongMessage =
    "ឈ្មោះ ឬការពិពណ៌នាដេប៉ាតឺម៉ង់វែងពេក។ សូមកាត់បន្ថយអត្ថបទហើយសាកល្បងម្តងទៀត។";

  const readFirstError = (value) => {
    if (Array.isArray(value)) return value.map(readFirstError).find(Boolean);
    if (value && typeof value === "object") {
      return Object.values(value).map(readFirstError).find(Boolean);
    }
    return value;
  };

  const collectErrorMessages = (value) => {
    if (Array.isArray(value)) {
      return value.flatMap(collectErrorMessages);
    }

    if (value && typeof value === "object") {
      return Object.values(value).flatMap(collectErrorMessages);
    }

    return typeof value === "string" && value.trim() ? [value.trim()] : [];
  };
// error handling function to extract meaningful messages from API errors, with support for nested structures and fallback messages based on HTTP status codes.
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

  const isTooLongApiMessage = (message = "") => {
    const normalized = String(message).trim().toLowerCase();
    return (
      normalized.includes("must not exceed") ||
      normalized.includes("too long") ||
      normalized.includes("value too long") ||
      normalized.includes("data too long") ||
      normalized.includes("string data right truncation") ||
      normalized.includes("truncated") ||
      normalized.includes("max length") ||
      normalized.includes("maximum length") ||
      normalized.includes("exceeds")
    );
  };

  const isInternalServerApiMessage = (message = "") => {
    const normalized = String(message).trim().toLowerCase();
    return (
      normalized.includes("internal server error") ||
      normalized.includes("status code 500")
    );
  };

  const translateKnownApiMessage = (message, fallbackMessage = "") => {
    const text = String(message || "").trim();
    const lower = text.toLowerCase();
    const hasKhmerText = /[\u1780-\u17ff]/.test(text);

    if (lower.includes("name") && isTooLongApiMessage(lower)) {
      return nameMaxLengthMessage;
    }

    if (lower.includes("description") && isTooLongApiMessage(lower)) {
      return descriptionMaxLengthMessage;
    }

    if (isTooLongApiMessage(lower)) {
      return payloadTooLongMessage;
    }

    if (
      lower.includes("description") &&
      (lower.includes("empty") ||
        lower.includes("cannot be empty") ||
        lower.includes("must not be empty") ||
        lower.includes("must not be blank") ||
        lower.includes("required"))
    ) {
      return "ការពិពណ៌នាមិនអាចទទេបានទេ។";
    }

    if (lower.includes("name") && (lower.includes("required") || lower.includes("empty"))) {
      return "សូមបញ្ចូលឈ្មោះដេប៉ាតឺម៉ង់។";
    }

    if (
      lower.includes("name") &&
      (lower.includes("already") || lower.includes("exist") || lower.includes("taken"))
    ) {
      return "ឈ្មោះដេប៉ាតឺម៉ង់នេះមានរួចហើយ។ សូមប្រើឈ្មោះផ្សេង។";
    }

    if (isGenericApiMessage(text)) {
      return fallbackMessage || invalidInputFallbackMessage;
    }

    if (isInternalServerApiMessage(text)) {
      return fallbackMessage || invalidInputFallbackMessage;
    }

    if (hasKhmerText || !fallbackMessage) return text || fallbackMessage;

    return fallbackMessage || invalidInputFallbackMessage;
  };

  const getDepartmentPayloadValidationMessage = (payload = {}) => {
    const name = String(payload.name || "").trim();
    const description = String(payload.description || "").trim();
    const messages = [];

    if (!name) {
      messages.push("សូមបញ្ចូលឈ្មោះដេប៉ាតឺម៉ង់។");
    } else if (name.length > DEPARTMENT_NAME_MAX_LENGTH) {
      messages.push(nameMaxLengthMessage);
    }

    if (!description) {
      messages.push("ការពិពណ៌នាមិនអាចទទេបានទេ។");
    } else if (description.length > DEPARTMENT_DESCRIPTION_MAX_LENGTH) {
      messages.push(descriptionMaxLengthMessage);
    }

    return [...new Set(messages)].join("\n");
  };

  const showDepartmentPayloadValidation = (payload) => {
    const message = getDepartmentPayloadValidationMessage(payload);
    if (!message) return false;

    Swal.fire({
      title: "ព័ត៌មានមិនត្រឹមត្រូវ",
      text: message,
      icon: "warning",
    });
    return true;
  };

  const getDepartmentMutationErrorMessage = (err, fallbackMessage, payload) => {
    const payloadValidationMessage = getDepartmentPayloadValidationMessage(payload);
    if (payloadValidationMessage) return payloadValidationMessage;

    const message = getApiErrorMessage(err, fallbackMessage);
    const status = Number(err.response?.status || 0);
    const rawMessage = collectErrorMessages(err.response?.data).join(" ");
    const isNearLimit =
      String(payload?.name || "").trim().length >= DEPARTMENT_NAME_MAX_LENGTH ||
      String(payload?.description || "").trim().length >= DEPARTMENT_DESCRIPTION_MAX_LENGTH;

    if (
      status >= 500 &&
      isNearLimit &&
      (isInternalServerApiMessage(message) || isInternalServerApiMessage(rawMessage))
    ) {
      return payloadTooLongMessage;
    }

    return message;
  };

  const getApiErrorMessage = (err, fallbackMessage) => {
    const responseData = err.response?.data;
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
    if (fallbackMessage && responseMessages.some(isGenericApiMessage)) {
      return fallbackMessage;
    }
    if (responseMessages.length) {
      return translateKnownApiMessage(responseMessages[0], fallbackMessage);
    }
    if (err.response?.status && fallbackMessage) return fallbackMessage;

    return translateKnownApiMessage(err.message, fallbackMessage);
  };

  const isSuccessResponse = (data) =>
    data == null || (data.result !== false && data.success !== false);

  const createResponseError = (response, fallbackMessage) => {
    const error = new Error(getApiErrorMessage({ response }, fallbackMessage));
    error.response = response;
    return error;
  };

  function isDepartmentInUseError(err) {
    const status = err.response?.status;
    const message = getApiErrorMessage(err, "").toLowerCase();

    return (
      status === 409 ||
      message.includes("in use") ||
      message.includes("used") ||
      message.includes("foreign") ||
      message.includes("constraint") ||
      message.includes("ប្រើប្រាស់")
    );
  }

  const getDeleteDepartmentMessage = (err) => {
    if (isDepartmentInUseError(err)) return departmentInUseMessage;
    return getApiErrorMessage(err, deleteFallbackMessage);
  };

  // 1. Fetch Departments with Pagination and Search
  async function fetchDepartments() {
    try {
      isLoading.value = true;
      const res = await api.get("/departments", { params: queryParams.value });
      const root = res.data ?? {};
      const payload = root.data ?? root;
      const meta = getPaginationMeta(root, payload);

      departments.value = getCollectionItems(root, payload);
      totalItems.value = Number(meta.total ?? departments.value.length);
      totalPages.value = Number(meta.pages ?? 1);
    } catch (err) {
      logger.error("Fetch Error:", err);
    } finally {
      isLoading.value = false;
    }
  }
// 2 . Create Department
  async function createDepartment(payload) {
    if (showDepartmentPayloadValidation(payload)) return false;

    try {
      isLoading.value = true;
      const res = await api.post("/departments", payload);
      if (!isSuccessResponse(res.data)) {
        throw createResponseError(res, createFallbackMessage);
      }

      await fetchDepartments();
      Swal.fire({
        title: "បង្កើតបានជោគជ័យ",
        text: `បានបង្កើតដេប៉ាតឺម៉ង់ "${payload.name}" រួចរាល់។`,
        icon: "success",
      });
      return true;
    } catch (err) {
      logger.error("Create Department Error:", err.response?.data || err);
      Swal.fire({
        title: "មិនអាចបង្កើតដេប៉ាតឺម៉ង់បានទេ",
        text: getDepartmentMutationErrorMessage(err, createFallbackMessage, payload),
        icon: "error",
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  }
// 3. Update Department
  async function updateDepartment(id, payload) {
    if (showDepartmentPayloadValidation(payload)) return false;

    try {
      isLoading.value = true;
      const res = await api.put(`/departments/${id}`, payload);
      if (!isSuccessResponse(res.data)) {
        throw createResponseError(res, updateFallbackMessage);
      }

      await fetchDepartments();
      Swal.fire(
        "ជោគជ័យ",
        "ទិន្នន័យដេប៉ាតឺម៉ង់ត្រូវបានផ្លាស់ប្តូរ",
        "success",
      );
      return true;
    } catch (err) {
      logger.error("Update Error:", err);
      Swal.fire(
        "កំហុស",
        getDepartmentMutationErrorMessage(err, updateFallbackMessage, payload),
        "error",
      );
      return false;
    } finally {
      isLoading.value = false;
    }
  }
// 4. Delete Department with Confirmation and Specific Error Handling
  async function removeDepartment(id) {
    try {
      isLoading.value = true;
      const res = await api.delete(`/departments/${id}`);
      if (!isSuccessResponse(res.data)) {
        throw createResponseError(res, deleteFallbackMessage);
      }

      await fetchDepartments();
      Swal.fire("ជោគជ័យ", "ដេប៉ាតឺម៉ង់ត្រូវបានលុប", "success");
      return true;
    } catch (err) {
      logger.error("Delete Department Error:", err.response?.data || err);
      Swal.fire("កំហុស", getDeleteDepartmentMessage(err), "error");
      return false;
    } finally {
      isLoading.value = false;
    }
  }
  // 5. Delete Department with Confirmation Dialog

  async function deleteDepartment(id) {
    const result = await Swal.fire({
      title: "តើអ្នកប្រាកដទេ?",
      text: "ដេប៉ាតឺម៉ង់នេះនឹងត្រូវបានលុបចេញពីប្រព័ន្ធ។",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "បាទ លុប",
      cancelButtonText: "បោះបង់",
      reverseButtons: true,
      focusCancel: true,
    });

    if (result.isConfirmed) {
      return removeDepartment(id);
    }

    return false;
  }

  return {
    departments,
    isLoading,
    queryParams,
    totalItems,
    totalPages,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    removeDepartment,
    deleteDepartment,
  };
});
