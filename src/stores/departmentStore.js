import { ref } from "vue";
import { defineStore } from "pinia";
import api from "@/API/api";
import Swal from "sweetalert2";
import logger from "@/utils/logger";

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
    "មិនអាចលុបទិន្នន័យនេះបានទេ ដេប៉ាតឺម៉ង់ត្រូវបានប្រើប្រាស់";

  function isDepartmentInUseError(err) {
    const status = err.response?.status;
    const message = String(
      err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "",
    ).toLowerCase();

    return (
      [409, 422].includes(status) ||
      message.includes("in use") ||
      message.includes("used") ||
      message.includes("foreign") ||
      message.includes("constraint") ||
      message.includes("ប្រើប្រាស់")
    );
  }

  // ១. ទាញយកទិន្នន័យ (GET /departments)
  async function fetchDepartments() {
    try {
      isLoading.value = true;
      const res = await api.get("/departments", { params: queryParams.value });
      const payload = res.data.data || res.data;
      departments.value = payload.items || payload;
      totalItems.value = payload.total || departments.value.length;
      totalPages.value = payload.last_page || 1;
    } catch (err) {
      logger.error("Fetch Error:", err);
    } finally {
      isLoading.value = false;
    }
  }

  async function createDepartment(payload) {
    try {
      isLoading.value = true;
      await api.post("/departments", payload);
      await fetchDepartments();
      Swal.fire("ជោគជ័យ", "ដេប៉ាតឺម៉ង់ថ្មីត្រូវបានបង្កើត", "success");
      return true;
    } catch (err) {
      Swal.fire("កំហុស", "មិនអាចបង្កើតបានទេ", "error");
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateDepartment(id, payload) {
    try {
      isLoading.value = true;
      const res = await api.put(`/departments/${id}`, payload);

      if (res.data) {
        await fetchDepartments();
        Swal.fire(
          "ជោគជ័យ",
          "ទិន្នន័យដេប៉ាតឺម៉ង់ត្រូវបានផ្លាស់ប្តូរ",
          "success",
        );
        return true;
      }

      return false;
    } catch (err) {
      logger.error("Update Error:", err);
      Swal.fire(
        "កំហុស",
        err.response?.data?.message || "មិនអាចកែប្រែទិន្នន័យបានទេ",
        "error",
      );
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeDepartment(id) {
    try {
      await api.delete(`/departments/${id}`);
      await fetchDepartments();
      Swal.fire("ជោគជ័យ", "ដេប៉ាតឺម៉ង់ត្រូវបានលុប", "success");
      return true;
    } catch (err) {
      logger.error("Delete Department Error:", err.response?.data || err);
      const message = isDepartmentInUseError(err)
        ? departmentInUseMessage
        : "មិនអាចលុបទិន្នន័យនេះបានទេ";
      Swal.fire("កំហុស", message, "error");
      return false;
    }
  }

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
