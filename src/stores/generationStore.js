import { ref } from "vue";
import api from "@/API/api";
import Swal from "sweetalert2";
import logger from "@/utils/logger";
import { useAuthStore } from "@/stores/useAuth";
import { confirmDelete } from "@/utils/confirmDialog";
import { fetchPaginatedCollection } from "@/utils/paginatedCollection";

/* ================= (STATE) ================= */
export const generations = ref([]);
export const generationDetails = ref(null);
export const isLoading = ref(false);
export const searchQuery = ref("");

const generationListSortParams = {
  sortBy: "id",
  sortDir: "DESC",
};

const isSuccessResponse = (data) =>
  data == null || (data.result !== false && data.success !== false);

const generationInUseMessage = "ជំនាន់នេះកំពុងប្រើប្រាស់ មិនអាចលុបបានឡើយទេ";
const fetchFallbackMessage = "មិនអាចទាញទិន្នន័យបញ្ជីជំនាន់បានទេ";
const fetchDetailsFallbackMessage = "មិនអាចទាញព័ត៌មានលម្អិតនៃជំនាន់នេះបានទេ";
const createFallbackMessage = "មិនអាចបង្កើតជំនាន់ថ្មីបានទេ";
const updateFallbackMessage = "មិនអាចកែប្រែព័ត៌មានជំនាន់បានទេ";
const deleteFallbackMessage = "មិនអាចលុបជំនាន់នេះបានទេ";

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

const translateKnownApiMessage = (message, fallbackMessage = "") => {
  const text = String(message || "").trim();
  const lower = text.toLowerCase();

  if (lower.includes("start year") && lower.includes("end year")) {
    return "ឆ្នាំចាប់ផ្តើមត្រូវតែតូចជាងឆ្នាំបញ្ចប់។";
  }

  if (isGenericApiMessage(text)) {
    return fallbackMessage || "ព័ត៌មានដែលបានបញ្ចូលមិនត្រឹមត្រូវ។ សូមពិនិត្យម្តងទៀត។";
  }

  return text || fallbackMessage;
};

export const getApiErrorMessage = (err, fallbackMessage) => {
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

  const specificMessage = responseMessages.find(
    (message) => !isGenericApiMessage(message),
  );

  if (specificMessage) return translateKnownApiMessage(specificMessage, fallbackMessage);
  if (fallbackMessage && responseMessages.some(isGenericApiMessage)) {
    return fallbackMessage;
  }
  if (responseMessages.length) {
    return translateKnownApiMessage(responseMessages[0], fallbackMessage);
  }
  if (err.response?.status && fallbackMessage) return fallbackMessage;

  return translateKnownApiMessage(err.message, fallbackMessage);
};

const createResponseError = (response, fallbackMessage) => {
  const error = new Error(getApiErrorMessage({ response }, fallbackMessage));
  error.response = response;
  return error;
};

const assertSuccessResponse = (response, fallbackMessage) => {
  if (!isSuccessResponse(response.data)) {
    throw createResponseError(response, fallbackMessage);
  }
};

const isGenerationInUseError = (err) => {
  const status = err.response?.status;
  const message = getApiErrorMessage(err, "").toLowerCase();

  return (
    status === 409 ||
    message.includes("in use") ||
    message.includes("used") ||
    message.includes("profile") ||
    message.includes("alumni") ||
    message.includes("foreign") ||
    message.includes("constraint") ||
    message.includes("ប្រើប្រាស់")
  );
};

const getDeleteGenerationMessage = (err) => {
  if (isGenerationInUseError(err)) return generationInUseMessage;
  return getApiErrorMessage(err, deleteFallbackMessage);
};

const escapeHtml = (value = "") =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getGenerationIdNumber = (generation) => {
  const id = Number(generation?.id ?? generation?._id ?? 0);
  return Number.isFinite(id) ? id : 0;
};

const sortGenerationsByIdDesc = (items = []) =>
  [...items].sort((a, b) => {
    const idDiff = getGenerationIdNumber(b) - getGenerationIdNumber(a);
    if (idDiff) return idDiff;

    return String(b?.id ?? b?._id ?? "").localeCompare(
      String(a?.id ?? a?._id ?? ""),
      undefined,
      { numeric: true },
    );
  });

/* ================= (ADMIN ROLE CHECK) ================= */
export const requireAdmin = (callback) => {
  const auth = useAuthStore();
  const userRole = auth.user?.role?.name || auth.user?.role || "";
  const isAdmin = ["admin", "administrator"].includes(
    String(userRole).toLowerCase(),
  );

  if (isAdmin) {
    return callback();
  }

  Swal.fire({
    title: "សិទ្ធិមិនគ្រប់គ្រាន់",
    text: "អ្នកមិនមានសិទ្ធិគ្រប់គ្រាន់ដើម្បីអនុវត្តសកម្មភាពនេះទេ!",
    icon: "error",
    confirmButtonColor: "#216477",
  });
  return false;
};

/* ================ (ACTIONS) ================= */

/**
 * 1 fetch list of generations (GET /generations) and handle loading state and errors with SweetAlert
 */
export const fetchGenerations = async () => {
  try {
    isLoading.value = true;
    const items = await fetchPaginatedCollection(api, "/generations", {
      params: generationListSortParams,
    });
    generations.value = sortGenerationsByIdDesc(items);
  } catch (err) {
    logger.error("Fetch Error:", err);
    generations.value = [];
    Swal.fire("កំហុស", getApiErrorMessage(err, fetchFallbackMessage), "error");
  } finally {
    isLoading.value = false;
  }
};

/**
 * 1. fetch details of a generation by id (GET /generations/{id}) and handle loading state and errors with SweetAlert
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
    Swal.fire(
      "កំហុស",
      getApiErrorMessage(err, fetchDetailsFallbackMessage),
      "error",
    );
  } finally {
    isLoading.value = false;
  }
};

/**
 * 2. create generation with input from a form in a SweetAlert modal, and handle API response with success and error messages
 */
export const handleCreate = async () => {
  return requireAdmin(async () => {
    const { value: formValues } = await Swal.fire({
      title: "Create New Generation",
      html:
        '<div class="text-start">' +
        '<label class="small fw-bold">Generation Name</label>' +
        '<input id="swal-name" class="swal2-input m-0 w-100" placeholder="e.g. ANT">' +
        '<div class="row mt-3">' +
        '<div class="col-6">' +
        '<label class="small fw-bold">Start Year</label>' +
        '<input id="swal-start" class="swal2-input m-0 w-100" type="number" placeholder="2025">' +
        "</div>" +
        '<div class="col-6">' +
        '<label class="small fw-bold">End Year</label>' +
        '<input id="swal-end" class="swal2-input m-0 w-100" type="number" placeholder="2025">' +
        "</div>" +
        "</div>" +
        '<label class="small fw-bold mt-3">Department ID</label>' +
        '<input id="swal-dept" class="swal2-input m-0 w-100" type="number" placeholder="e.g. 2">' +
        '<label class="small fw-bold mt-3">Description</label>' +
        '<textarea id="swal-desc" class="swal2-textarea m-0 w-100" placeholder="Description"></textarea>' +
        "</div>",
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

        const parsedStartYear = parseInt(startYear, 10);
        const parsedEndYear = parseInt(endYear, 10);

        if (!Number.isInteger(parsedStartYear) || !Number.isInteger(parsedEndYear)) {
          Swal.showValidationMessage("សូមបញ្ចូលឆ្នាំឱ្យបានត្រឹមត្រូវ");
          return null;
        }

        if (parsedStartYear >= parsedEndYear) {
          Swal.showValidationMessage("ឆ្នាំចាប់ផ្តើមត្រូវតែតូចជាងឆ្នាំបញ្ចប់");
          return null;
        }

        return {
          name,
          description,
          startYear: parsedStartYear,
          endYear: parsedEndYear,
          departmentId: parseInt(departmentId, 10),
        };
      },
    });

    if (formValues) {
      try {
        isLoading.value = true;
        const response = await api.post("/generations", formValues);
        assertSuccessResponse(response, createFallbackMessage);
        await fetchGenerations();
        Swal.fire("ជោគជ័យ", "បង្កើតជំនាន់ថ្មីបានជោគជ័យ", "success");
        return true;
      } catch (err) {
        logger.error("Generation create failed", err.response?.data || err);
        Swal.fire("បរាជ័យ", getApiErrorMessage(err, createFallbackMessage), "error");
        return false;
      } finally {
        isLoading.value = false;
      }
    }

    return false;
  });
};

/**
 * 3. editable fields with pre-filled data and update generation by id with payload
 */
export const handleUpdate = async (gen) => {
  return requireAdmin(async () => {
    const safeName = escapeHtml(gen.name || "");
    const safeStartYear = escapeHtml(gen.startYear || "");
    const safeEndYear = escapeHtml(gen.endYear || "");
    const safeDescription = escapeHtml(gen.description || "");

    const { value: formValues } = await Swal.fire({
      title: "Update Generation",
      html:
        '<div class="text-start">' +
        '<label class="small fw-bold">Generation Name</label>' +
        '<input id="swal-name" class="swal2-input m-0 w-100" value="' +
        safeName +
        '">' +
        '<div class="row mt-3">' +
        '<div class="col-6">' +
        '<label class="small fw-bold">Start Year</label>' +
        '<input id="swal-start" class="swal2-input m-0 w-100" type="number" value="' +
        safeStartYear +
        '">' +
        "</div>" +
        '<div class="col-6">' +
        '<label class="small fw-bold">End Year</label>' +
        '<input id="swal-end" class="swal2-input m-0 w-100" type="number" value="' +
        safeEndYear +
        '">' +
        "</div>" +
        "</div>" +
        '<label class="small fw-bold mt-3">Description</label>' +
        '<textarea id="swal-desc" class="swal2-textarea m-0 w-100">' +
        safeDescription +
        "</textarea>" +
        "</div>",
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

        const parsedStartYear = parseInt(startYear, 10);
        const parsedEndYear = parseInt(endYear, 10);

        if (!Number.isInteger(parsedStartYear) || !Number.isInteger(parsedEndYear)) {
          Swal.showValidationMessage("សូមបញ្ចូលឆ្នាំឱ្យបានត្រឹមត្រូវ");
          return null;
        }

        if (parsedStartYear >= parsedEndYear) {
          Swal.showValidationMessage("ឆ្នាំចាប់ផ្តើមត្រូវតែតូចជាងឆ្នាំបញ្ចប់");
          return null;
        }

        return {
          name,
          description: document.getElementById("swal-desc").value,
          startYear: parsedStartYear,
          endYear: parsedEndYear,
        };
      },
    });

    if (formValues) {
      try {
        isLoading.value = true;
        // ប្រើ PUT ទៅកាន់ /generations/{id}
        const response = await api.put(`/generations/${gen.id}`, formValues);
        assertSuccessResponse(response, updateFallbackMessage);
        await fetchGenerations();
        Swal.fire("ជោគជ័យ", "ព័ត៌មានត្រូវបានកែប្រែ", "success");
        return true;
      } catch (err) {
        logger.error("Generation update failed", err.response?.data || err);
        Swal.fire("បរាជ័យ", getApiErrorMessage(err, updateFallbackMessage), "error");
        return false;
      } finally {
        isLoading.value = false;
      }
    }

    return false;
  });
};

const normalizeGenerationUpdatePayload = (payload = {}) => {
  const updatePayload = {};
  const startYear = payload.startYear ?? payload.start_year;
  const endYear = payload.endYear ?? payload.end_year;

  if (payload.name !== undefined) updatePayload.name = payload.name;
  if (payload.description !== undefined)
    updatePayload.description = payload.description;
  if (startYear !== undefined) updatePayload.startYear = Number(startYear);
  if (endYear !== undefined) updatePayload.endYear = Number(endYear);

  return updatePayload;
};

export const createGeneration = async (payload) => {
  return requireAdmin(async () => {
    try {
      isLoading.value = true;
      const response = await api.post("/generations", payload);
      assertSuccessResponse(response, createFallbackMessage);
      await fetchGenerations();
      Swal.fire("ជោគជ័យ", "បង្កើតជំនាន់ថ្មីបានជោគជ័យ", "success");
      return response;
    } catch (err) {
      logger.error("Generation create failed (store)", err.response?.data || err);
      Swal.fire("បរាជ័យ", getApiErrorMessage(err, createFallbackMessage), "error");
      throw err;
    } finally {
      isLoading.value = false;
    }
  });
};

/**
 * Update generation by id with payload (used by views)
 */
export const updateGeneration = async (id, payload) => {
  return requireAdmin(async () => {
    try {
      isLoading.value = true;
      const updatePayload = normalizeGenerationUpdatePayload(payload);
      logger.info("Updating generation (store) payload", updatePayload);
      const res = await api.put(`/generations/${id}`, updatePayload);
      assertSuccessResponse(res, updateFallbackMessage);
      await fetchGenerations();
      Swal.fire("ជោគជ័យ", "ព័ត៌មានត្រូវបានកែប្រែ", "success");
      return res;
    } catch (err) {
      const resp = err.response?.data || err;
      logger.error("Generation update failed (store)", resp);
      Swal.fire("បរាជ័យ", getApiErrorMessage(err, updateFallbackMessage), "error");
      throw err;
    } finally {
      isLoading.value = false;
    }
  });
};

/**
 * ៤. លុបជំនាន់ (Delete Generation)
 */
export const handleDelete = async (id) => {
  return requireAdmin(async () => {
    const result = await confirmDelete({
      text: "ជំនាន់នេះនឹងត្រូវបានលុបចេញពីប្រព័ន្ធ។",
    });

    if (result.isConfirmed) {
      try {
        isLoading.value = true;
        const response = await api.delete(`/generations/${id}`);
        assertSuccessResponse(response, deleteFallbackMessage);
        await fetchGenerations();
        Swal.fire("ជោគជ័យ", "លុបទិន្នន័យបានជោគជ័យ", "success");
        return true;
      } catch (err) {
        logger.error("Generation delete failed", err.response?.data || err);
        Swal.fire("កំហុស", getDeleteGenerationMessage(err), "error");
        return false;
      } finally {
        isLoading.value = false;
      }
    }

    return false;
  });
};
