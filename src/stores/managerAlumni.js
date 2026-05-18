import { ref } from "vue";
import api from "@/API/api";
import Swal from "sweetalert2";
import { useAuthStore } from "@/stores/useAuth";
import logger from "@/utils/logger";

export const users = ref([]);
export const isLoading = ref(false);
export const searchQuery = ref(""); // Binding ជាមួយ Search Input
export const activeTab = ref("ALL"); // Binding ជាមួយ Filter Select
export const PRIMARY_COLOR = "#216477";

export const currentPage = ref(1);
export const itemsPerPage = ref(10);
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
export const registerErrors = ref({});

export const getPerPage = () => itemsPerPage.value || 10;

export const clearRegisterErrors = () => {
  registerErrors.value = {};
};

const getUserStatus = (user) =>
  String(user?.status || user?.profile?.status || "PENDING").toUpperCase();

const getUserRole = (user) =>
  String(
    user?.role?.name ||
      user?.role ||
      user?.profile?.role?.name ||
      user?.profile?.role ||
      user?.userRole ||
      "",
  ).toLowerCase();

const hasAlumniRole = (user) => {
  const role = getUserRole(user);
  return !role || role.includes("alumni");
};

const getUserSearchText = (user) =>
  [
    user?.id,
    user?.fullname,
    user?.fullName,
    user?.name,
    user?.username,
    user?.email,
    user?.phone,
    user?.profile?.fullname,
    user?.profile?.fullName,
    user?.profile?.email,
    user?.profile?.phone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const matchesSearch = (user) => {
  const query = searchQuery.value?.trim().toLowerCase();
  return !query || getUserSearchText(user).includes(query);
};

const extractItems = (root, payload) => {
  const data =
    payload?.items ||
    payload?.data?.items ||
    root?.items ||
    root?.data?.items ||
    payload?.data ||
    payload ||
    [];

  return Array.isArray(data) ? data : [];
};

const pickNumber = (sources, keys) => {
  for (const source of sources) {
    for (const key of keys) {
      const value = source?.[key];
      if (value !== undefined && value !== null && value !== "") {
        const numberValue = Number(value);
        if (Number.isFinite(numberValue)) {
          return numberValue;
        }
      }
    }
  }

  return undefined;
};

const getPaginationMeta = (root, payload) => {
  const sources = [
    payload?.meta,
    root?.meta,
    payload?.pagination,
    root?.pagination,
    payload,
    root,
  ];

  return {
    total: pickNumber(sources, ["total", "totalItems"]),
    pages: pickNumber(sources, ["last_page", "totalPages", "pageCount"]),
  };
};

const getFetchParams = ({ includePagination = true } = {}) => {
  const params = {};

  if (includePagination) {
    params._page = currentPage.value;
    params._per_page = getPerPage();
  }

  if (searchQuery.value?.trim()) {
    params.search = searchQuery.value.trim();
  }

  if (activeTab.value !== "ALL") {
    params.status = activeTab.value;
  }

  return params;
};

const paginateClientSide = (data, perPage) => {
  const total = data.length;
  const pages = Math.max(1, Math.ceil(total / perPage));

  if (currentPage.value > pages) {
    currentPage.value = pages;
  }

  const start = (currentPage.value - 1) * perPage;
  return {
    data: data.slice(start, start + perPage),
    total,
    pages,
  };
};

// មុខងារ Fetch Users ដែល Support Search, Filter និង Pagination
export const fetchUsers = async () => {
  const perPage = getPerPage();

  try {
    isLoading.value = true;
    const params = getFetchParams();

    logger.debug(
      "Fetching users with params:",
      params,
      "activeTab:",
      activeTab.value,
    );

    const res = await api.get("/users", { params });
    logger.info("/users endpoint succeeded");
    const usedGenericUsersEndpoint = true;
    const needsClientPagination = false;
    const needsClientFilters = true;

    logger.debug("API Response:", res.data);

    const root = res.data ?? {};
    const payload = root?.data ?? root;
    let data = extractItems(root, payload);
    let usedClientFilter = false;

    if (usedGenericUsersEndpoint) {
      const canFilterByRole = data.some((user) => getUserRole(user));
      const alumniOnly = data.filter(hasAlumniRole);
      if (canFilterByRole && alumniOnly.length > 0) {
        usedClientFilter = alumniOnly.length !== data.length;
        data = alumniOnly;
      }
    }

    if (needsClientFilters || usedGenericUsersEndpoint) {
      const searchOnly = data.filter(matchesSearch);
      usedClientFilter = usedClientFilter || searchOnly.length !== data.length;
      data = searchOnly;
    }

    // Client-side filter by status if API doesn't filter correctly
    if (activeTab.value !== "ALL") {
      const statusOnly = data.filter((user) => getUserStatus(user) === activeTab.value);
      usedClientFilter = usedClientFilter || statusOnly.length !== data.length;
      data = statusOnly;
    }

    users.value = data;
    const { total: totalFromMeta, pages: pagesFromMeta } = getPaginationMeta(
      root,
      payload,
    );

    if (needsClientPagination) {
      const paginated = paginateClientSide(data, perPage);
      users.value = paginated.data;
      totalItems.value = paginated.total;
      totalPages.value = paginated.pages;
    } else {
      totalItems.value = usedClientFilter
        ? data.length
        : totalFromMeta ?? data.length;
      const calculatedPages = Math.max(1, Math.ceil(totalItems.value / perPage));
      totalPages.value = usedClientFilter
        ? calculatedPages
        : Number(pagesFromMeta ?? calculatedPages);
    }

    logger.info("Final users count:", users.value.length);
    logger.debug("Final users:", users.value);
  } catch (err) {
    logger.error("Fetch error:", err);
    logger.error("Error details:", err.response?.data);
    users.value = [];
    totalItems.value = 0;
    totalPages.value = 1;
    currentPage.value = 1;
  } finally {
    isLoading.value = false;
  }
};

export const openRegisterModal = () => {
  clearRegisterErrors();
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

const validateRegisterForm = () => {
  clearRegisterErrors();

  const form = registerForm.value;
  const email = form.email?.trim() || "";

  if (!form.fullname?.trim()) {
    registerErrors.value.fullname = "សូមបញ្ចូលឈ្មោះពេញលេញ";
  }

  if (!email) {
    registerErrors.value.email = "សូមបញ្ចូលអ៊ីម៉ែល";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    registerErrors.value.email = "ទម្រង់អ៊ីម៉ែលមិនត្រឹមត្រូវ";
  }

  if (!form.password || form.password.length < 6) {
    registerErrors.value.password = "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច 6 តួអក្សរ";
  }

  if (!form.confirmPassword) {
    registerErrors.value.confirmPassword = "សូមបញ្ជាក់ពាក្យសម្ងាត់";
  } else if (form.password !== form.confirmPassword) {
    registerErrors.value.confirmPassword = "ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ";
  }

  if (!form.departmentId) {
    registerErrors.value.departmentId = "សូមជ្រើសរើសដេប៉ាតមេន";
  }

  if (!form.generationId) {
    registerErrors.value.generationId = "សូមជ្រើសរើសជំនាន់";
  }

  return Object.keys(registerErrors.value).length === 0;
};

export const handleRegisterAlumni = async () => {
  try {
    if (!validateRegisterForm()) {
      return;
    }

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

    logger.debug("Registering alumni with payload:", payload);
    const response = await api.post("/users/alumni", payload);
    logger.info("Registration response:", response.data);

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
    clearRegisterErrors();
    await fetchUsers();
    Swal.fire("ជោគជ័យ", "គណនីត្រូវបានបង្កើតបានសម្រេច", "success");
  } catch (err) {
    logger.error("Registration error:", err);
    logger.error("Error response data:", err.response?.data);
    const errorMessage =
      err.response?.data?.message ||
      err.response?.data?.error ||
      "មិនបានគ្រប់គ្រងបង្កើតគណនី";
    Swal.fire("បរាជ័យ", errorMessage, "error");
  } finally {
    isLoading.value = false;
  }
};

const updateUserStatus = async (userId, status) => {
  try {
    isLoading.value = true;
    const payload = { status };

    // Ensure userId is a clean numeric ID
    const cleanUserId = String(userId).split(":")[0];

    logger.debug(
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
        logger.warn("PUT /users/:id failed, trying /users/alumni/:id");
        response = await api.put(`/users/alumni/${cleanUserId}`, payload);
      } else {
        throw err;
      }
    }

    logger.info("Status update response:", response.data);
    await fetchUsers();
    Swal.fire("រួចរាល់", "ស្ថានភាពត្រូវបានប្តូរ", "success");
  } catch (err) {
    logger.error("Change status error:", err);
    logger.error("Error response data:", err.response?.data);
    logger.error("Error status:", err.response?.status);
    const errorMessage =
      err.response?.data?.message || "មិនបានគ្រប់គ្រងផ្លាស់ប្តូរស្ថានភាព";
    Swal.fire("បរាជ័យ", errorMessage, "error");
  } finally {
    isLoading.value = false;
  }
};

export const handleApproveUser = (userId) => updateUserStatus(userId, "APPROVE");

export const handleChangeStatus = async (userId) => {
  const { value: status } = await Swal.fire({
    title: "ប្តូរស្ថានភាព",
    input: "select",
    inputOptions: { PENDING: "PENDING", APPROVE: "APPROVE", REJECT: "REJECT" },
    showCancelButton: true,
  });
  if (status) {
    await updateUserStatus(userId, status);
  }
};
