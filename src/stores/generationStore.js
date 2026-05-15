import { ref } from "vue";
import api from "@/API/api";
import Swal from "sweetalert2";
import logger from "@/utils/logger";
import { useAuthStore } from "@/stores/useAuth";
import { confirmDelete } from "@/utils/confirmDialog";

/* ================= ស្ថានភាពទូទៅ (STATE) ================= */
export const generations = ref([]);
export const generationDetails = ref(null);
export const isLoading = ref(false);
export const searchQuery = ref("");

/* ================= ជំនួយសិទ្ធិ (ADMIN ROLE CHECK) ================= */
export const requireAdmin = (callback) => {
  const auth = useAuthStore();
  const userRole = auth.user?.role?.name || auth.user?.role || "";
  const isAdmin = ["admin", "administrator"].includes(
    String(userRole).toLowerCase(),
  );

  if (isAdmin) {
    callback();
  } else {
    Swal.fire({
      title: "Permission Denied",
      text: "អ្នកមិនមានសិទ្ធិគ្រប់គ្រាន់ដើម្បីអនុវត្តសកម្មភាពនេះទេ!",
      icon: "error",
      confirmButtonColor: "#216477",
    });
  }
};

/* ================= សកម្មភាពចម្បង (ACTIONS) ================= */

/**
 * ១. ទាញយកបញ្ជីជំនាន់ (Get Generations List)
 */
export const fetchGenerations = async () => {
  try {
    isLoading.value = true;
    const res = await api.get("/generations");
    if (res.data?.result) {
      // គាំទ្រទាំង format data.items ឬ data ផ្ទាល់
      generations.value = res.data.data.items || res.data.data;
    }
  } catch (err) {
    logger.error("Fetch Error:", err);
    Swal.fire("Error", "មិនអាចទាញទិន្នន័យបញ្ជីជំនាន់បានទេ", "error");
  } finally {
    isLoading.value = false;
  }
};

/**
 * ១.១ ទាញយកព័ត៌មានលម្អិតតាម ID (Get Generation Details)
 */
export const fetchGenerationDetails = async (id) => {
  try {
    isLoading.value = true;
    generationDetails.value = null;

    const res = await api.get(`/generations/${id}`);
    const payload = res.data?.data ?? res.data;
    const record = payload?.item ?? payload?.items?.[0] ?? payload;

    if (res.data?.result || res.data?.success || record) {
      generationDetails.value = record;
    }
  } catch (err) {
    logger.error("Fetch Details Error:", err);
    Swal.fire("Error", "មិនអាចទាញព័ត៌មានលម្អិតនៃជំនាន់នេះបានទេ", "error");
  } finally {
    isLoading.value = false;
  }
};

/**
 * ២. បង្កើតជំនាន់ថ្មី (Create Generation - យោងតាម image_aa9596.png)
 */
export const handleCreate = async () => {
  requireAdmin(async () => {
    const { value: formValues } = await Swal.fire({
      title: "Create New Generation",
      html: `
        <div class="text-start">
          <label class="small fw-bold">Generation Name</label>
          <input id="swal-name" class="swal2-input m-0 w-100" placeholder="e.g. ANT">

          <div class="row mt-3">
            <div class="col-6">
              <label class="small fw-bold">Start Year</label>
              <input id="swal-start" class="swal2-input m-0 w-100" type="number" placeholder="2025">
            </div>
            <div class="col-6">
              <label class="small fw-bold">End Year</label>
              <input id="swal-end" class="swal2-input m-0 w-100" type="number" placeholder="2025">
            </div>
          </div>

          <label class="small fw-bold mt-3">Department ID</label>
          <input id="swal-dept" class="swal2-input m-0 w-100" type="number" placeholder="e.g. 2">

          <label class="small fw-bold mt-3">Description</label>
          <textarea id="swal-desc" class="swal2-textarea m-0 w-100" placeholder="Description"></textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Create",
      confirmButtonColor: "#216477",
      preConfirm: () => {
        const name = document.getElementById("swal-name").value;
        const startYear = document.getElementById("swal-start").value;
        const endYear = document.getElementById("swal-end").value;
        const departmentId = document.getElementById("swal-dept").value;
        const description = document.getElementById("swal-desc").value;

        if (!name || !startYear || !endYear || !departmentId) {
          Swal.showValidationMessage("សូមបំពេញ Name, Years និង Department ID");
          return null;
        }

        return {
          name,
          description,
          startYear: parseInt(startYear),
          endYear: parseInt(endYear),
          departmentId: parseInt(departmentId),
        };
      },
    });

    if (formValues) {
      try {
        isLoading.value = true;
        const response = await api.post("/generations", formValues);
        if (response.data?.result) {
          await fetchGenerations();
          Swal.fire("ជោគជ័យ", "បង្កើតជំនាន់ថ្មីបានជោគជ័យ", "success");
        }
      } catch (err) {
        Swal.fire(
          "បរាជ័យ",
          err.response?.data?.message || "Error 400: Bad Request",
          "error",
        );
      } finally {
        isLoading.value = false;
      }
    }
  });
};

/**
 * ៣. កែប្រែព័ត៌មាន (Update Generation - យោងតាម image_aa951f.png)
 */
export const handleUpdate = async (gen) => {
  requireAdmin(async () => {
    const { value: formValues } = await Swal.fire({
      title: "Update Generation",
      html: `
        <div class="text-start">
          <label class="small fw-bold">Generation Name</label>
          <input id="swal-name" class="swal2-input m-0 w-100" value="${gen.name || ""}">

          <div class="row mt-3">
            <div class="col-6">
              <label class="small fw-bold">Start Year</label>
              <input id="swal-start" class="swal2-input m-0 w-100" type="number" value="${gen.startYear || ""}">
            </div>
            <div class="col-6">
              <label class="small fw-bold">End Year</label>
              <input id="swal-end" class="swal2-input m-0 w-100" type="number" value="${gen.endYear || ""}">
            </div>
          </div>

          <label class="small fw-bold mt-3">Description</label>
          <textarea id="swal-desc" class="swal2-textarea m-0 w-100">${gen.description || ""}</textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update",
      confirmButtonColor: "#216477",
      preConfirm: () => {
        const name = document.getElementById("swal-name").value;
        const startYear = document.getElementById("swal-start").value;
        const endYear = document.getElementById("swal-end").value;

        if (!name) {
          Swal.showValidationMessage("ឈ្មោះមិនអាចទទេបានទេ");
          return null;
        }

        return {
          name,
          description: document.getElementById("swal-desc").value,
          startYear: parseInt(startYear),
          endYear: parseInt(endYear),
        };
      },
    });

    if (formValues) {
      try {
        isLoading.value = true;
        // ប្រើ PUT ទៅកាន់ /generations/{id}
        const response = await api.put(`/generations/${gen.id}`, formValues);
        if (response.data?.result) {
          await fetchGenerations();
          Swal.fire("ជោគជ័យ", "ព័ត៌មានត្រូវបានកែប្រែ", "success");
        }
      } catch (err) {
        Swal.fire(
          "បរាជ័យ",
          err.response?.data?.message || "Error 400: Bad Request",
          "error",
        );
      } finally {
        isLoading.value = false;
      }
    }
  });
};

/**
 * ៤. លុបជំនាន់ (Delete Generation)
 */
export const handleDelete = async (id) => {
  requireAdmin(async () => {
    const result = await confirmDelete({
      text: "ជំនាន់នេះនឹងត្រូវបានលុបចេញពីប្រព័ន្ធ។",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/generations/${id}`);
        await fetchGenerations();
        Swal.fire("Deleted!", "លុបទិន្នន័យបានជោគជ័យ", "success");
      } catch (err) {
        Swal.fire("Error", "មិនអាចលុបទិន្នន័យនេះបានទេ", "error");
      }
    }
  });
};
