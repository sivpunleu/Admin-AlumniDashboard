import { ref } from "vue";
import { defineStore } from "pinia";
import api from "@/API/api";
import Swal from "sweetalert2";
import logger from "@/utils/logger";
import { confirmDelete } from "@/utils/confirmDialog";

export const useDepartmentStore = defineStore("department", () => {
  const departments = ref([]);
  const isLoading = ref(false);

  // ប៉ារ៉ាម៉ែត្រសម្រាប់ Pagination & Search (យោងតាមរូបភាព image_108a85.png)
  const queryParams = ref({
    _page: 1,
    _per_page: 10,
    search: "",
    sortDir: "DESC",
    sortBy: "id",
  });

  const totalItems = ref(0);
  const totalPages = ref(1);

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

  // ២. បង្កើតថ្មី (POST /departments) - យោងតាមរូបភាព image_108abd.png
  async function createDepartment(payload) {
    try {
      isLoading.value = true;
      await api.post("/departments", payload);
      await Swal.fire("ជោគជ័យ", "ដេប៉ាតឺម៉ង់ថ្មីត្រូវបានបង្កើត", "success");
      await fetchDepartments();
    } catch (err) {
      Swal.fire("កំហុស", "មិនអាចបង្កើតបានទេ", "error");
    } finally {
      isLoading.value = false;
    }
  }

  // ៣. កែប្រែ (PUT /departments/{id}) - យោងតាមរូបភាព image_108ac3.png
  // src/stores/departmentStore.js

  async function updateDepartment(id, payload) {
    try {
      isLoading.value = true;

      // បញ្ជូនទៅកាន់ Endpoint: /departments/{id} ជាមួយ Method PUT
      // ឧទាហរណ៍ payload: { name: "Achectic 1", description: "Achectic" }
      const res = await api.put(`/departments/${id}`, payload);

      if (res.data) {
        await Swal.fire({
          title: "ធ្វើបច្ចុប្បន្នភាពជោគជ័យ",
          text: "ទិន្នន័យដេប៉ាតឺម៉ង់ត្រូវបានផ្លាស់ប្តូរ",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        // ទាញយកទិន្នន័យថ្មីមកបង្ហាញក្នុងតារាងឡើងវិញ
        await fetchDepartments();
      }
    } catch (err) {
      logger.error("Update Error:", err);
      Swal.fire(
        "កំហុស",
        err.response?.data?.message || "មិនអាចកែប្រែទិន្នន័យបានទេ",
        "error",
      );
    } finally {
      isLoading.value = false;
    }
  }

  // ៤. លុប (DELETE /departments/{id}) - យោងតាមរូបភាព image_108add.png
  async function deleteDepartment(id) {
    const result = await confirmDelete({
      text: "ដេប៉ាតឺម៉ង់នេះនឹងត្រូវបានលុបចេញពីប្រព័ន្ធ។",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/departments/${id}`);
        Swal.fire("ជោគជ័យ", "ដេប៉ាតឺម៉ង់ត្រូវបានលុប", "success");
        await fetchDepartments();
      } catch (err) {
        Swal.fire("កំហុស", "មិនអាចលុបទិន្នន័យនេះបានទេ", "error");
      }
    }
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
    deleteDepartment,
  };
});
