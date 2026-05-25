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

  const readFirstError = (value) => {
    if (Array.isArray(value)) return value.map(readFirstError).find(Boolean);
    if (value && typeof value === "object") {
      return Object.values(value).map(readFirstError).find(Boolean);
    }
    return value;
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

  const getApiErrorMessage = (err, fallbackMessage) => {
    const responseData = err.response?.data;
    const responseMessages = [
      readFirstError(responseData?.details),
      readFirstError(responseData?.errors),
      readFirstError(responseData?.error),
      readFirstError(responseData?.message),
      typeof responseData === "string" ? responseData : "",
    ]
      .filter(Boolean)
      .map(String);

    const specificMessage = responseMessages.find(
      (message) => !isGenericApiMessage(message),
    );

    if (specificMessage) return specificMessage;
    if (fallbackMessage && responseMessages.some(isGenericApiMessage)) {
      return fallbackMessage;
    }
    if (responseMessages.length) return responseMessages[0];
    if (err.response?.status && fallbackMessage) return fallbackMessage;

    return err.message || fallbackMessage;
  };

  const isSuccessResponse = (data) =>
    data == null || (data.result !== false && data.success !== false);

  const createResponseError = (response, fallbackMessage) => {
    const error = new Error(getApiErrorMessage({ response }, fallbackMessage));
    error.response = response;
    return error;
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
    try {
      isLoading.value = true;
      const res = await api.post("/categories", payload);
      if (!isSuccessResponse(res.data)) {
        throw createResponseError(res, createFallbackMessage);
      }

      Swal.fire("ជោគជ័យ", "ប្រភេទថ្មីត្រូវបានបង្កើត", "success");
      await fetchCategories();

      return true;
    } catch (err) {
      logger.error("Create Category Error:", err.response?.data || err);
      Swal.fire("កំហុស", getApiErrorMessage(err, createFallbackMessage), "error");
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // 3 update category (PUT /categories/{id}) (based on image 7)
  async function updateCategory(id, payload) {
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
