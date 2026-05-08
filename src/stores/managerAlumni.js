import { ref, computed } from "vue";
import api from "@/API/api";
import Swal from "sweetalert2";
import { useAuthStore } from "@/stores/useAuth";

export const users = ref([]);
export const isLoading = ref(false);
export const searchQuery = ref(""); // Binding ជាមួយ Search Input
export const activeTab = ref("ALL"); // Binding ជាមួយ Filter Select
export const PRIMARY_COLOR = "#216477";

export const currentPage = ref(1);
export const itemsPerPage = ref(0); // 0 = show all users
export const totalPages = ref(1);
export const totalItems = ref(0);

export const showRegisterModal = ref(false);
export const registerForm = ref({
  fullname: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  bio: "N/A",
  currentJob: "DARA",
  departmentId: "",
  generationId: "",
  status: "PENDING",
});

// មុខងារ Fetch Users ដែល Support Search, Filter និង Pagination
export const fetchUsers = async () => {
  const perPage = itemsPerPage.value || 10;

  try {
    isLoading.value = true;
    const params = {};

    params._page = currentPage.value;
    params._per_page = perPage;

    // Only add search if not empty
    if (searchQuery.value?.trim()) {
      params.search = searchQuery.value.trim();
    }

    // Only add status if not "ALL"
    if (activeTab.value !== "ALL") {
      params.status = activeTab.value;
    }

    console.log(
      "Fetching users with params:",
      params,
      "activeTab:",
      activeTab.value,
    );

    let res;
    try {
      // prefer the generic /users endpoint which seems more stable
      res = await api.get("/users", { params });
      console.log("/users endpoint succeeded");
    } catch (err) {
      console.warn(
        "/users endpoint failed, trying /users/alumni",
        err?.response?.status,
      );
      // try alumni endpoint as fallback
      res = await api.get("/users/alumni", { params });
      console.log("/users/alumni endpoint succeeded");
    }

    console.log("API Response:", res.data);

    // Try different response structures
    const payload = res.data?.data ?? res.data;
    let data =
      payload?.items || payload?.data?.items || payload?.data || payload || [];

    // Ensure it's an array
    if (!Array.isArray(data)) {
      data = [];
    }

    // Client-side filter by status if API doesn't filter correctly
    if (activeTab.value !== "ALL") {
      data = data.filter((user) => {
        const userStatus = String(
          user?.status || user?.profile?.status || "PENDING",
        ).toUpperCase();
        return userStatus === activeTab.value;
      });
    }

    users.value = data;
    const totalFromMeta =
      payload?.meta?.total ??
      payload?.total ??
      payload?.pagination?.total ??
      payload?.meta?.totalItems ??
      payload?.totalItems;
    const pagesFromMeta =
      payload?.meta?.last_page ??
      payload?.meta?.totalPages ??
      payload?.pagination?.totalPages ??
      payload?.pageCount;

    totalItems.value = Number(totalFromMeta ?? data.length ?? 0);
    totalPages.value = Number(
      pagesFromMeta ?? Math.max(1, Math.ceil(totalItems.value / perPage)),
    );

    console.log("Final users count:", users.value.length);
    console.log("Final users:", users.value);
  } catch (err) {
    console.error("Fetch error:", err);
    console.error("Error details:", err.response?.data);
    users.value = [];
  } finally {
    isLoading.value = false;
  }
};

export const openRegisterModal = () => {
  showRegisterModal.value = true;
};

export const requireAdmin = (callback) => {
  const auth = useAuthStore();
  const role = auth.user?.role?.name || auth.user?.role || "";
  if (["admin", "administrator"].includes(String(role).toLowerCase())) {
    callback();
  } else {
    Swal.fire("Permission Denied", "អ្នកមិនមានសិទ្ធិទេ!", "error");
  }
};

export const handleRegisterAlumni = async () => {
  try {
    // Validation
    if (!registerForm.value.fullname?.trim()) {
      Swal.fire("ការរឹងមាំ", "សូមបញ្ចូលឈ្មោះពេញលេញ", "warning");
      return;
    }
    if (!registerForm.value.email?.trim()) {
      Swal.fire("ការរឹងមាំ", "សូមបញ្ចូលអ៊ីមែល", "warning");
      return;
    }
    if (
      !registerForm.value.password ||
      registerForm.value.password.length < 6
    ) {
      Swal.fire(
        "ការរឹងមាំ",
        "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច 6 តួអក្សរ",
        "warning",
      );
      return;
    }
    if (registerForm.value.password !== registerForm.value.confirmPassword) {
      Swal.fire("ការរឹងមាំ", "ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ", "warning");
      return;
    }
    if (!registerForm.value.departmentId) {
      Swal.fire("ការរឹងមាំ", "សូមជ្រើសរើសដេបាតមេន", "warning");
      return;
    }
    if (!registerForm.value.generationId) {
      Swal.fire("ការរឹងមាំ", "សូមជ្រើសរើសជំនាន់", "warning");
      return;
    }

    isLoading.value = true;
    const payload = {
      fullname: registerForm.value.fullname.trim(),
      email: registerForm.value.email.trim(),
      password: registerForm.value.password,
      confirmPassword: registerForm.value.confirmPassword,
      phone: registerForm.value.phone || "",
      bio: registerForm.value.bio || "N/A",
      currentJob: registerForm.value.currentJob || "DARA",
      departmentId: Number(registerForm.value.departmentId),
      generationId: Number(registerForm.value.generationId),
      status: registerForm.value.status || "PENDING",
    };

    console.log("Registering alumni with payload:", payload);
    const response = await api.post("/users/alumni", payload);
    console.log("Registration response:", response.data);

    // Reset form
    registerForm.value = {
      fullname: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      bio: "N/A",
      currentJob: "DARA",
      departmentId: "",
      generationId: "",
      status: "PENDING",
    };

    showRegisterModal.value = false;
    await fetchUsers();
    Swal.fire("ជោគជ័យ", "គណនីត្រូវបានបង្កើតបានសម្រេច", "success");
  } catch (err) {
    console.error("Registration error:", err);
    console.error("Error response data:", err.response?.data);
    const errorMessage =
      err.response?.data?.message ||
      err.response?.data?.error ||
      "មិនបានគ្រប់គ្រងបង្កើតគណនី";
    Swal.fire("បរាជ័យ", errorMessage, "error");
  } finally {
    isLoading.value = false;
  }
};

export const handleChangeStatus = async (userId) => {
  const { value: status } = await Swal.fire({
    title: "ប្តូរស្ថានភាព",
    input: "select",
    inputOptions: { PENDING: "PENDING", APPROVE: "APPROVE", REJECT: "REJECT" },
    showCancelButton: true,
  });
  if (status) {
    try {
      isLoading.value = true;
      const payload = { status };

      // Ensure userId is a clean numeric ID
      const cleanUserId = String(userId).split(":")[0];

      console.log(
        "Sending status update for user",
        cleanUserId,
        "with payload:",
        payload,
      );

      // Try different endpoint paths
      let response;
      try {
        response = await api.put(`/users/${cleanUserId}`, payload);
      } catch (err) {
        if (err.response?.status === 500) {
          console.warn("PUT /users/:id failed, trying /users/alumni/:id");
          response = await api.put(`/users/alumni/${cleanUserId}`, payload);
        } else {
          throw err;
        }
      }

      console.log("Status update response:", response.data);
      await fetchUsers();
      Swal.fire("រួចរាល់", "ស្ថានភាពត្រូវបានប្តូរ", "success");
    } catch (err) {
      console.error("Change status error:", err);
      console.error("Error response data:", err.response?.data);
      console.error("Error status:", err.response?.status);
      const errorMessage =
        err.response?.data?.message || "មិនបានគ្រប់គ្រងផ្លាស់ប្តូរស្ថានភាព";
      Swal.fire("បរាជ័យ", errorMessage, "error");
    } finally {
      isLoading.value = false;
    }
  }
};
