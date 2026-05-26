import { ref } from "vue";
import { defineStore } from "pinia";
import api from "@/API/api";
import Swal from "sweetalert2";
import { confirmDelete } from "@/utils/confirmDialog";
import logger from "@/utils/logger";

export const EVENT_THUMBNAIL_MAX_SIZE_BYTES = 1024 * 1024;
export const EVENT_THUMBNAIL_MAX_SIZE_LABEL = "1MB";

export const useEventStore = defineStore("event", () => {
  const events = ref([]);
  const participants = ref([]);
  const selectedEvent = ref(null);
  const isLoading = ref(false);

  const queryParams = ref({
    _page: 1,
    _per_page: 10,
    search: "",
    sortDir: "DESC",
    sortBy: "id",
  });

  const paginationMeta = ref({});
  const totalItems = ref(0);
  const totalPages = ref(1);

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

    if (
      lower.includes("thumbnail") &&
      (lower.includes("1mb") || lower.includes("not exceed") || lower.includes("too large"))
    ) {
      return `រូបភាពតំណាងមិនអាចលើស ${EVENT_THUMBNAIL_MAX_SIZE_LABEL} បានទេ។ សូមជ្រើសរើសរូបភាពដែលមានទំហំតូចជាងនេះ។`;
    }

    if (
      lower.includes("thumbnail") &&
      (lower.includes("default") || lower.includes("not found") || lower.includes("no thumbnail"))
    ) {
      return "មិនមានរូបភាពតំណាងដែលអាចលុបបានទេ។ ប្រព័ន្ធកំពុងប្រើរូបភាពលំនាំដើមរួចហើយ។";
    }

    if (lower.includes("thumbnail") && (lower.includes("type") || lower.includes("format"))) {
      return "សូមជ្រើសរើសឯកសាររូបភាពត្រឹមត្រូវសម្រាប់រូបភាពតំណាង។";
    }

    if (isGenericApiMessage(text)) {
      return fallbackMessage || "ព័ត៌មានដែលបានបញ្ចូលមិនត្រឹមត្រូវ។ សូមពិនិត្យម្តងទៀត។";
    }

    return text || fallbackMessage;
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

  const showThumbnailSizeError = () =>
    Swal.fire({
      title: "រូបភាពធំពេក",
      text: `រូបភាពតំណាងអាចមានទំហំអតិបរមា ${EVENT_THUMBNAIL_MAX_SIZE_LABEL} ប៉ុណ្ណោះ។ សូមបង្រួមរូបភាព ឬជ្រើសរើសឯកសារផ្សេង។`,
      icon: "error",
    });

  // 1 fetch events (GET /events) with pagination, search, and sorting (based on image 1)
  async function fetchEvents() {
    try {
      isLoading.value = true;
      const res = await api.get("/events", { params: queryParams.value });
      const payload = res.data.data || res.data;
      const meta = payload.meta || payload || {};
      events.value = payload.items || payload;
      paginationMeta.value = meta;
      totalItems.value = Number(
        meta.total ||
          meta.totalItems ||
          meta.total_items ||
          events.value.length ||
          0,
      );
      totalPages.value = Number(
        meta.last_page ||
          meta.lastPage ||
          meta.totalPages ||
          meta.total_pages ||
          1,
      );
    } catch (err) {
      logger.error(err);
    } finally {
      isLoading.value = false;
    }
  }
  // add fetchEvent function (GET /events/{id})

  async function fetchEvent(id) {
    try {
      isLoading.value = true;
      const res = await api.get(`/events/${id}`);
      selectedEvent.value = res.data.data || res.data;
      return selectedEvent.value;
    } catch (err) {
      selectedEvent.value = null;
      logger.error(err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }
// add create event function (POST /events) and update event function (PUT /events/{id})
  async function createEvent(payload) {
    try {
      isLoading.value = true;
      await api.post("/events", payload);
      await fetchEvents();
      Swal.fire("ជោគជ័យ", "ព្រឹត្តិការណ៍ត្រូវបានបង្កើត", "success");
      return true;
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        "មិនអាចបង្កើតព្រឹត្តិការណ៍បានទេ។ សូមពិនិត្យព័ត៌មានម្តងទៀត។",
      );
      Swal.fire("កំហុស", message, "error");
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateEvent(id, payload) {
    try {
      isLoading.value = true;
      await api.put(`/events/${id}`, payload);
      await fetchEvents();
      Swal.fire("ជោគជ័យ", "បានកែប្រែទិន្នន័យ", "success");
      return true;
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        "មិនអាចកែប្រែព្រឹត្តិការណ៍បានទេ។ សូមពិនិត្យសិទ្ធិ និងព័ត៌មានម្តងទៀត។",
      );
      Swal.fire("កំហុស", message, "error");
      return false;
    } finally {
      isLoading.value = false;
    }
  }
// add delete event function with confirmation dialog (DELETE /events/{id})
  async function deleteEvent(id) {
    const result = await confirmDelete({
      text: "ព្រឹត្តិការណ៍នេះនឹងត្រូវបានលុបចេញពីប្រព័ន្ធ។",
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/events/${id}`);
        await fetchEvents();
        Swal.fire("លុបរួចរាល់", "", "success");
      } catch (err) {
        Swal.fire("កំហុស", getApiErrorMessage(err, "មិនអាចលុបព្រឹត្តិការណ៍បានទេ"), "error");
      }
    }
  }

  // 2 upload thumbnail for event (POST /events/{id}/thumbnail) and delete thumbnail (DELETE /events/{id}/thumbnail)
  async function uploadThumbnail(id, file) {
    if (!file) return false;

    if (!file.type?.startsWith("image/")) {
      Swal.fire({
        title: "ប្រភេទឯកសារមិនត្រឹមត្រូវ",
        text: "សូមជ្រើសរើសឯកសាររូបភាពសម្រាប់រូបភាពតំណាង។",
        icon: "error",
      });
      return false;
    }

    if (file.size > EVENT_THUMBNAIL_MAX_SIZE_BYTES) {
      await showThumbnailSizeError();
      return false;
    }

    const formData = new FormData();
    formData.append("thumbnail", file);
    try {
      isLoading.value = true;
      await api.put(`/events/${id}/thumbnail`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchEvents();
      Swal.fire({
        title: "បង្ហោះរូបភាពបានជោគជ័យ",
        text: "រូបភាពតំណាងព្រឹត្តិការណ៍ត្រូវបានធ្វើបច្ចុប្បន្នភាព។",
        icon: "success",
      });
      return true;
    } catch (err) {
      Swal.fire({
        title: "មិនអាចបង្ហោះរូបភាពតំណាងបានទេ",
        text: getApiErrorMessage(
          err,
          `រូបភាពតំណាងត្រូវតែជាឯកសាររូបភាព និងមានទំហំមិនលើស ${EVENT_THUMBNAIL_MAX_SIZE_LABEL}។`,
        ),
        icon: "error",
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteThumbnail(id) {
    const result = await confirmDelete({
      title: "លុបរូបភាពតំណាង?",
      text: "រូបភាពតំណាងនេះនឹងត្រូវបានលុប ហើយព្រឹត្តិការណ៍នឹងត្រឡប់ទៅប្រើរូបភាពលំនាំដើមវិញ។",
      confirmButtonText: "បាទ លុបរូបភាព",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/events/${id}/thumbnail`);
        await fetchEvents();
        Swal.fire({
          title: "បានលុបរូបភាពតំណាង",
          text: "ព្រឹត្តិការណ៍នឹងបង្ហាញរូបភាពលំនាំដើមវិញ។",
          icon: "success",
        });
        return true;
      } catch (err) {
        Swal.fire({
          title: "មិនអាចលុបរូបភាពតំណាងបានទេ",
          text: getApiErrorMessage(
            err,
            "រូបភាពនេះអាចជារូបភាពលំនាំដើម ឬត្រូវបានលុបរួចហើយ។",
          ),
          icon: "error",
        });
        return false;
      }
    }

    return false;
  }

  // 3 fetch participants of an event with pagination and status filter (GET /events/{id}/participants)
  async function fetchParticipants(id, status = "attending") {
    try {
      isLoading.value = true;
      const allParticipants = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const res = await api.get(`/events/${id}/participants`, {
          params: { _page: page, _per_page: 100, status },
        });
        const payload = res.data.data || res.data;
        const pageItems = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload)
            ? payload
            : [];
        const meta = payload?.meta || payload || {};
        const totalPages = Number(
          meta.last_page ||
            meta.lastPage ||
            meta.totalPages ||
            meta.total_pages ||
            1,
        );
        const currentPage = Number(
          meta.current_page || meta.currentPage || meta.page || page,
        );

        allParticipants.push(...pageItems);
        hasNextPage = pageItems.length > 0 && currentPage < totalPages;
        page = currentPage + 1;
      }

      participants.value = allParticipants;
      return true;
    } catch (err) {
      participants.value = [];
      logger.error(err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }
  // add or update participant
  async function respondToEvent(eventId, status, participant = null) {
    try {
      isLoading.value = true;
      let success = false;
      const participantId =
        participant?.id || participant?.participantId || null;
      const userId = participant?.user?.id || participant?.userId || null;
      const payload = {
        status,
        ...(participantId ? { participantId } : {}),
        ...(userId ? { userId } : {}),
      };
      const requests = [
        { method: "post", endpoint: `/events/${eventId}/participate` },
        { method: "post", endpoint: `/events/${eventId}/participation` },
        ...(participantId
          ? [
              {
                method: "put",
                endpoint: `/events/${eventId}/participants/${participantId}`,
              },
              {
                method: "put",
                endpoint: `/events/${eventId}/participants/${participantId}/response`,
              },
              {
                method: "post",
                endpoint: `/events/${eventId}/participants/${participantId}`,
              },
              {
                method: "post",
                endpoint: `/events/${eventId}/participants/${participantId}/response`,
              },
            ]
          : []),
        { method: "put", endpoint: `/events/${eventId}/participate` },
        { method: "put", endpoint: `/events/${eventId}/participation` },
      ];

      for (const request of requests) {
        try {
          await api[request.method](request.endpoint, payload);
          success = true;
          break;
        } catch (err) {
          if (![404, 405].includes(err?.response?.status)) {
            throw err;
          }
        }
      }

      if (!success) {
        throw new Error("Participant response endpoint not found");
      }

      Swal.fire({
        title: "ជោគជ័យ!",
        text: `អ្នកបានឆ្លើយតបថា: ${status}`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      return true;
    } catch (err) {
      Swal.fire("កំហុស", "មិនអាចផ្ញើការឆ្លើយតបបានទេ", "error");
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    respondToEvent,
    events,
    participants,
    selectedEvent,
    isLoading,
    queryParams,
    paginationMeta,
    totalItems,
    totalPages,
    fetchEvents,
    fetchEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    uploadThumbnail,
    deleteThumbnail,
    fetchParticipants,
  };
});
