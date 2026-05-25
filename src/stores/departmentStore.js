import { ref } from "vue";
import { defineStore } from "pinia";
import api from "@/API/api";
import Swal from "sweetalert2";
import logger from "@/utils/logger";
import {
  getCollectionItems,
  getPaginationMeta,
} from "@/utils/paginatedCollection";
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
    "មិនអាចលុបដេប៉ាតឺម៉ង់នេះបានទេ ព្រោះមានជំនាន់ ឬប្រវត្តិរូបដែលកំពុងប្រើប្រាស់។";
  const createFallbackMessage = "មិនអាចបង្កើតបានទេ";
  const updateFallbackMessage = "មិនអាចកែប្រែទិន្នន័យបានទេ";
  const deleteFallbackMessage = "មិនអាចលុបទិន្នន័យនេះបានទេ";

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
    try {
      isLoading.value = true;
      const res = await api.post("/departments", payload);
      if (!isSuccessResponse(res.data)) {
        throw createResponseError(res, createFallbackMessage);
      }

      await fetchDepartments();
      Swal.fire("ជោគជ័យ", "ដេប៉ាតឺម៉ង់ថ្មីត្រូវបានបង្កើត", "success");
      return true;
    } catch (err) {
      logger.error("Create Department Error:", err.response?.data || err);
      Swal.fire("កំហុស", getApiErrorMessage(err, createFallbackMessage), "error");
      return false;
    } finally {
      isLoading.value = false;
    }
  }
// 3. Update Department
  async function updateDepartment(id, payload) {
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
        getApiErrorMessage(err, updateFallbackMessage),
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
