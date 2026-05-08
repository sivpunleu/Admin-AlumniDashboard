import { ref } from "vue";
import { defineStore } from "pinia";
import api from "@/API/api";
import Swal from "sweetalert2";

export const useEventStore = defineStore("event", () => {
  const events = ref([]);
  const participants = ref([]);
  const isLoading = ref(false);

  const queryParams = ref({
    _page: 1,
    _per_page: 10,
    search: "",
    sortDir: "DESC",
    sortBy: "id",
  });

  const paginationMeta = ref({});

  // --- ១. គ្រប់គ្រងព្រឹត្តិការណ៍ (CRUD) ---
  async function fetchEvents() {
    try {
      isLoading.value = true;
      const res = await api.get("/events", { params: queryParams.value });
      const payload = res.data.data || res.data;
      events.value = payload.items || payload;
      paginationMeta.value = payload.meta || {};
    } catch (err) {
      console.error(err);
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
    const result = await Swal.fire({
      title: "តើអ្នកប្រាកដទេ?",
      text: "ទិន្នន័យនឹងត្រូវលុបចេញ!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "លុប",
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
    try {
      await api.delete(`/events/${id}/thumbnail`);
      await fetchEvents();
      Swal.fire("ជោគជ័យ", "បានលុបរូបភាព", "success");
    } catch (err) {
      Swal.fire("កំហុស", "លុបមិនបាន", "error");
    }
  }

  // --- ៣. គ្រប់គ្រងអ្នកចូលរួម (Participants) ---
  async function fetchParticipants(id, status = "attending") {
    try {
      const res = await api.get(`/events/${id}/participants`, {
        params: { _page: 1, _per_page: 10, status },
      });
      participants.value = res.data.data.items;
    } catch (err) {
      console.error(err);
    }
  }
  // បន្ថែមមុខងារនេះទៅក្នុង useEventStore
  async function respondToEvent(eventId, status) {
    try {
      isLoading.value = true;
      // ផ្ញើទៅកាន់ POST /events/{id}/participation (តាម Flowchart)
      await api.post(`/events/${eventId}/participation`, { status });

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
    isLoading,
    queryParams,
    paginationMeta,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    uploadThumbnail,
    deleteThumbnail,
    fetchParticipants,
  };
});
