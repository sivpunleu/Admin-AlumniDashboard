import { ref } from "vue";
import { defineStore } from "pinia";
import api from "@/API/api";
import Swal from "sweetalert2";
import { confirmDelete } from "@/utils/confirmDialog";
import logger from "@/utils/logger";

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

  // --- ១. គ្រប់គ្រងព្រឹត្តិការណ៍ (CRUD) ---
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

  async function createEvent(payload) {
    try {
      isLoading.value = true;
      await api.post("/events", payload);
      await fetchEvents();
      Swal.fire("ជោគជ័យ", "ព្រឹត្តិការណ៍ត្រូវបានបង្កើត", "success");
      return true;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Create event failed. Please check your input.";
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
      const message =
        err?.response?.data?.message ||
        "Update event failed. Please check your permissions and input.";
      Swal.fire("កំហុស", message, "error");
      return false;
    } finally {
      isLoading.value = false;
    }
  }

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
        Swal.fire("កំហុស", "លុបមិនបានសម្រេច", "error");
      }
    }
  }

  // --- ២. គ្រប់គ្រងរូបភាព Thumbnail (PUT & DELETE) ---
  async function uploadThumbnail(id, file) {
    const formData = new FormData();
    formData.append("thumbnail", file);
    try {
      isLoading.value = true;
      await api.put(`/events/${id}/thumbnail`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchEvents();
      Swal.fire("ជោគជ័យ", "បានដាក់រូបភាព Thumbnail", "success");
    } catch (err) {
      Swal.fire("កំហុស", "Upload បរាជ័យ", "error");
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteThumbnail(id) {
    const result = await confirmDelete({
      text: "រូបភាព Thumbnail នេះនឹងត្រូវបានលុបចេញពីប្រព័ន្ធ។",
      confirmButtonText: "បាទ លុបរូបភាព",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/events/${id}/thumbnail`);
        await fetchEvents();
        Swal.fire("ជោគជ័យ", "បានលុបរូបភាព", "success");
      } catch (err) {
        Swal.fire("កំហុស", "លុបមិនបាន", "error");
      }
    }
  }

  // --- ៣. គ្រប់គ្រងអ្នកចូលរួម (Participants) ---
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
  // បន្ថែមមុខងារនេះទៅក្នុង useEventStore
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
