import { ref } from "vue";
import { defineStore } from "pinia";
import api from "@/API/api";
import Swal from "sweetalert2";
import logger from "@/utils/logger";
import { confirmDelete } from "@/utils/confirmDialog";

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

  // --- ១. ទាញយកបញ្ជី Category (GET /categories) ---
  async function fetchCategories() {
    try {
      isLoading.value = true;
      const res = await api.get("/categories", { params: queryParams.value });

      // រៀបចំទិន្នន័យតាម Response របស់ Backend
      const payload = res.data.data || res.data;
      categories.value = payload.items || payload;
      totalItems.value = payload.total || categories.value.length;
      totalPages.value = payload.last_page || 1;
    } catch (err) {
      logger.error("Fetch Error:", err);
    } finally {
      isLoading.value = false;
    }
  }

  // --- ២. បង្កើតថ្មី (POST /categories) --- (តាមរូបភាពទី ៣)
  // check admin role
  async function createCategory(payload) {
    try {
      isLoading.value = true;
      await api.post("/categories", payload);
      Swal.fire("ជោគជ័យ", "ប្រភេទថ្មីត្រូវបានបង្កើត", "success");
      await fetchCategories();

      return true;
    } catch (err) {
      Swal.fire("កំហុស", "មិនអាចបង្កើតបានទេ", "error");
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // --- ៣. ធ្វើបច្ចុប្បន្នភាព (PUT /categories/{id}) --- (តាមរូបភាពទី ៧)
  async function updateCategory(id, payload) {
    try {
      isLoading.value = true;
      await api.put(`/categories/${id}`, payload);
      Swal.fire("ជោគជ័យ", "ទិន្នន័យត្រូវបានកែប្រែ", "success");
      await fetchCategories();
      return true;
    } catch (err) {
      Swal.fire("កំហុស", "ការកែប្រែបរាជ័យ", "error");
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // --- ៤. លុប (DELETE /categories/{id}) --- (តាមរូបភាពទី ៤)
  async function deleteCategory(id) {
    const result = await confirmDelete({
      text: "ប្រភេទនេះនឹងត្រូវបានលុបចេញពីប្រព័ន្ធ។",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/categories/${id}`);
        Swal.fire("ជោគជ័យ", "ប្រភេទត្រូវបានលុប", "success");
        await fetchCategories();
      } catch (err) {
        Swal.fire("កំហុស", "មិនអាចលុបទិន្នន័យនេះបានទេ", "error");
      }
    }
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
