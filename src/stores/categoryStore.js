import { ref } from "vue";
import { defineStore } from "pinia";
import api from "@/API/api";
import Swal from "sweetalert2";
import logger from "@/utils/logger";
import { confirmDelete } from "@/utils/confirmDialog";
import {
  getCollectionItems,
  getPaginationMeta,
} from "@/utils/paginatedCollection";

export const CATEGORY_NAME_MAX_LENGTH = 50;
export const CATEGORY_DESCRIPTION_MAX_LENGTH = 200;

export const useCategoryStore = defineStore("category", () => {
  const categories = ref([]);
  const isLoading = ref(false);

  // ប៉ារ៉ាម៉ែត្រសម្រាប់ Pagination, Search, និង Sorting (តាមរូបភាពទី ២)
  const queryParams = ref({
    _page: 1,
    _per_page: 10,
    search: "",
    sortDir: "DESC",
    sortBy: "id",
  });

  const totalItems = ref(0);
  const totalPages = ref(1);
  const categoryInUseMessage =
    "មិនអាចលុបប្រភេទនេះបានទេ ព្រោះមានព្រឹត្តិការណ៍ដែលកំពុងប្រើប្រាស់។";
  const createFallbackMessage = "មិនអាចបង្កើតប្រភេទបានទេ";
  const updateFallbackMessage = "មិនអាចកែប្រែប្រភេទបានទេ";
  const deleteFallbackMessage = "មិនអាចលុបប្រភេទនេះបានទេ";
  const invalidInputFallbackMessage =
    "ព័ត៌មានដែលបានបញ្ចូលមិនត្រឹមត្រូវ។ សូមពិនិត្យម្តងទៀត។";
  const nameMaxLengthMessage =
    `ឈ្មោះប្រភេទមិនអាចលើស ${CATEGORY_NAME_MAX_LENGTH} តួអក្សរបានទេ។`;
  const descriptionMaxLengthMessage =
    `ការពិពណ៌នាប្រភេទមិនអាចលើស ${CATEGORY_DESCRIPTION_MAX_LENGTH} តួអក្សរបានទេ។`;

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

    if (
      lower.includes("description") &&
      (lower.includes("empty") ||
        lower.includes("blank") ||
        lower.includes("required"))
    ) {
      return "ការពិពណ៌នាមិនអាចទទេបានទេ។";
    }

    if (lower.includes("name") && (lower.includes("required") || lower.includes("empty"))) {
      return "សូមបញ្ចូលឈ្មោះប្រភេទ។";
    }

    if (
      lower.includes("category") &&
      (lower.includes("already") || lower.includes("exist") || lower.includes("taken"))
    ) {
      return text;
    }

    if (
      lower.includes("name") &&
      (lower.includes("already") || lower.includes("exist") || lower.includes("taken"))
    ) {
      return "ឈ្មោះប្រភេទនេះមានរួចហើយ។ សូមប្រើឈ្មោះផ្សេង។";
    }

    if (isGenericApiMessage(text)) {
      return fallbackMessage || invalidInputFallbackMessage;
    }

    if (hasKhmerText || !fallbackMessage) return text || fallbackMessage;

    return fallbackMessage || invalidInputFallbackMessage;
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

  const isDuplicateCategoryMessage = (message = "") => {
    const lower = String(message).trim().toLowerCase();
    return (
      lower.includes("category") &&
      (lower.includes("already") || lower.includes("exist") || lower.includes("taken"))
    );
  };

  const isSuccessResponse = (data) =>
    data == null || (data.result !== false && data.success !== false);

  const createResponseError = (response, fallbackMessage) => {
    const error = new Error(getApiErrorMessage({ response }, fallbackMessage));
    error.response = response;
    return error;
  };

  const getCategoryPayloadValidationMessage = (payload = {}) => {
    const name = String(payload.name || "").trim();
    const description = String(payload.description || "").trim();
    const messages = [];

    if (!name) {
      messages.push("សូមបញ្ចូលឈ្មោះប្រភេទ។");
    } else if (name.length > CATEGORY_NAME_MAX_LENGTH) {
      messages.push(nameMaxLengthMessage);
    }

    if (!description) {
      messages.push("ការពិពណ៌នាមិនអាចទទេបានទេ។");
    } else if (description.length > CATEGORY_DESCRIPTION_MAX_LENGTH) {
      messages.push(descriptionMaxLengthMessage);
    }

    return [...new Set(messages)].join("\n");
  };

  const showCategoryPayloadValidation = (payload) => {
    const message = getCategoryPayloadValidationMessage(payload);
    if (!message) return false;

    Swal.fire({
      title: "ព័ត៌មានមិនត្រឹមត្រូវ",
      text: message,
      icon: "warning",
    });
    return true;
  };
// function to determine if an error is due to a category being in use, based on HTTP status code and error message content, with support for multiple languages.
  function isCategoryInUseError(err) {
    const status = err.response?.status;
    const message = getApiErrorMessage(err, "").toLowerCase();

    return (
      status === 409 ||
      message.includes("in use") ||
      message.includes("used") ||
      message.includes("event") ||
      message.includes("foreign") ||
      message.includes("constraint") ||
      message.includes("ប្រើប្រាស់")
    );
  }

  const getDeleteCategoryMessage = (err) => {
    if (isCategoryInUseError(err)) return categoryInUseMessage;
    return getApiErrorMessage(err, deleteFallbackMessage);
  };

 // 1 fetch categories (GET /categories) with pagination, search, and sorting (based on image 1)
  async function fetchCategories() {
    try {
      isLoading.value = true;
      const res = await api.get("/categories", { params: queryParams.value });

      // រៀបចំទិន្នន័យតាម Response របស់ Backend
      const root = res.data ?? {};
      const payload = root.data ?? root;
      const meta = getPaginationMeta(root, payload);

      categories.value = getCollectionItems(root, payload);
      totalItems.value = Number(meta.total ?? categories.value.length);
      totalPages.value = Number(meta.pages ?? 1);
    } catch (err) {
      logger.error("Fetch Error:", err);
    } finally {
      isLoading.value = false;
    }
  }

  // 2 create category (POST /categories) (based on image 3)
  // check admin role
  async function createCategory(payload) {
    if (showCategoryPayloadValidation(payload)) return false;

    try {
      isLoading.value = true;
      const res = await api.post("/categories", payload);
      if (!isSuccessResponse(res.data)) {
        throw createResponseError(res, createFallbackMessage);
      }

      Swal.fire({
        title: "បង្កើតបានជោគជ័យ",
        text: `បានបង្កើតប្រភេទ "${payload.name}" រួចរាល់។`,
        icon: "success",
      });
      await fetchCategories();

      return true;
    } catch (err) {
      logger.error("Create Category Error:", err.response?.data || err);
      const message = getApiErrorMessage(err, createFallbackMessage);
      Swal.fire({
        title: isDuplicateCategoryMessage(message)
          ? message
          : "មិនអាចបង្កើតប្រភេទបានទេ",
        text: isDuplicateCategoryMessage(message) ? "" : message,
        icon: "error",
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // 3 update category (PUT /categories/{id}) (based on image 7)
  async function updateCategory(id, payload) {
    if (showCategoryPayloadValidation(payload)) return false;

    try {
      isLoading.value = true;
      const res = await api.put(`/categories/${id}`, payload);
      if (!isSuccessResponse(res.data)) {
        throw createResponseError(res, updateFallbackMessage);
      }

      Swal.fire("ជោគជ័យ", "ទិន្នន័យត្រូវបានកែប្រែ", "success");
      await fetchCategories();
      return true;
    } catch (err) {
      logger.error("Update Category Error:", err.response?.data || err);
      Swal.fire("កំហុស", getApiErrorMessage(err, updateFallbackMessage), "error");
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // 4 delete category (DELETE /categories/{id}) (based on image 4)
  async function deleteCategory(id) {
    const result = await confirmDelete({
      text: "ប្រភេទនេះនឹងត្រូវបានលុបចេញពីប្រព័ន្ធ។",
    });

    if (result.isConfirmed) {
      try {
        isLoading.value = true;
        const res = await api.delete(`/categories/${id}`);
        if (!isSuccessResponse(res.data)) {
          throw createResponseError(res, deleteFallbackMessage);
        }

        Swal.fire("ជោគជ័យ", "ប្រភេទត្រូវបានលុប", "success");
        await fetchCategories();
        return true;
      } catch (err) {
        logger.error("Delete Category Error:", err.response?.data || err);
        Swal.fire("កំហុស", getDeleteCategoryMessage(err), "error");
        return false;
      } finally {
        isLoading.value = false;
      }
    }

    return false;
  }

  return {
    categories,
    isLoading,
    queryParams,
    totalItems,
    totalPages,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
});
