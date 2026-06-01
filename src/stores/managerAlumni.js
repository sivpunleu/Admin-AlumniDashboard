import { ref } from "vue";
import api from "@/API/api";
import Swal from "sweetalert2";
import { useAuthStore } from "@/stores/useAuth";
import logger from "@/utils/logger";

export const users = ref([]);
export const isLoading = ref(false);
export const searchQuery = ref("");
export const activeTab = ref("ALL");
export const PRIMARY_COLOR = "#216477";

export const currentPage = ref(1);
export const itemsPerPage = ref(10);
export const totalPages = ref(1);
export const totalItems = ref(0);
export const allUsersTotal = ref(0);
export const allUsersApproved = ref(0);
export const allUsersPending = ref(0);
export const allUsersDeactivated = ref(0);
const CLIENT_FILTER_PAGE_SIZE = 100;
const MAX_CLIENT_FILTER_PAGES = 50;
const MIN_PASSWORD_LENGTH = 8;
export const REGISTER_FULLNAME_MAX_LENGTH = 30;
export const REGISTER_PHONE_MAX_LENGTH = 15;
export const REGISTER_CURRENT_JOB_MAX_LENGTH = 30;
export const REGISTER_BIO_MAX_LENGTH = 50;
const USER_DEFAULT_SORT_BY = "id";
const USER_DEFAULT_SORT_DIR = "DESC";
const registerAlumniFallbackMessage = "មិនអាចបង្កើតគណនីអតីតនិស្សិតបានទេ";
const registerAdminFallbackMessage = "មិនអាចបង្កើតគណនីអ្នកគ្រប់គ្រងបានទេ";
const updateStatusFallbackMessage = "មិនអាចផ្លាស់ប្តូរស្ថានភាពបានទេ";
const passwordLengthMessage = `ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ${MIN_PASSWORD_LENGTH} តួអក្សរ`;
const passwordComplexityMessage =
  "ពាក្យសម្ងាត់ត្រូវមានអក្សរធំយ៉ាងតិច ១ តួ លេខយ៉ាងតិច ១ និងតួអក្សរពិសេសយ៉ាងតិច ១។";
const passwordMismatchMessage = "ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ";
const currentJobRequiredMessage = "សូមបញ្ចូលមុខរបរបច្ចុប្បន្ន";
const fullnameMaxLengthMessage =
  `ឈ្មោះពេញលេញមិនអាចបញ្ចូលលើស ${REGISTER_FULLNAME_MAX_LENGTH} តួអក្សរទេ`;
const phoneMaxLengthMessage =
  `លេខទូរស័ព្ទមិនអាចបញ្ចូលលើស ${REGISTER_PHONE_MAX_LENGTH} តួអក្សរទេ`;
const currentJobMaxLengthMessage =
  `មុខរបរបច្ចុប្បន្នមិនអាចបញ្ចូលលើស ${REGISTER_CURRENT_JOB_MAX_LENGTH} តួអក្សរទេ`;
const bioMaxLengthMessage =
  `ជីវប្រវត្តិមិនអាចបញ្ចូលលើស ${REGISTER_BIO_MAX_LENGTH} តួអក្សរទេ`;

export const showAccountTypeModal = ref(false);
export const showRegisterModal = ref(false);
export const showAdminRegisterModal = ref(false);

const isSuccessResponse = (data) =>
  data == null || (data.result !== false && data.success !== false);

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
// error handling function to extract meaningful messages from API errors, with support for nested structures and fallback messages based on HTTP status codes.
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

const isTooLongApiMessage = (message = "") =>
  message.includes("too long") ||
  message.includes("maximum") ||
  message.includes("max") ||
  message.includes("length") ||
  message.includes("characters") ||
  message.includes("exceed") ||
  message.includes("less than") ||
  message.includes("greater than");

const translateKnownApiMessage = (message, fallbackMessage = "") => {
  const text = String(message || "").trim();
  const lower = text.toLowerCase();

  if (
    lower.includes("email") &&
    (lower.includes("already") ||
      lower.includes("exist") ||
      lower.includes("taken") ||
      lower.includes("use"))
  ) {
    return "អ៊ីមែលនេះត្រូវបានប្រើប្រាស់រួចហើយ។ សូមប្រើអ៊ីមែលផ្សេង។";
  }

  if (
    lower.includes("email") &&
    (lower.includes("invalid") ||
      lower.includes("format") ||
      lower.includes("valid email"))
  ) {
    return "ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវ។";
  }

  if (
    lower.includes("phone") &&
    (lower.includes("already") ||
      lower.includes("exist") ||
      lower.includes("taken") ||
      lower.includes("use"))
  ) {
    return "លេខទូរស័ព្ទនេះត្រូវបានប្រើប្រាស់រួចហើយ។ សូមប្រើលេខផ្សេង។";
  }

  if (
    (lower.includes("fullname") ||
      lower.includes("full name") ||
      lower.includes("full_name")) &&
    isTooLongApiMessage(lower)
  ) {
    return fullnameMaxLengthMessage;
  }

  if (lower.includes("phone") && isTooLongApiMessage(lower)) {
    return phoneMaxLengthMessage;
  }

  if (
    (lower.includes("current job") || lower.includes("current_job")) &&
    isTooLongApiMessage(lower)
  ) {
    return currentJobMaxLengthMessage;
  }

  if (lower.includes("bio") && isTooLongApiMessage(lower)) {
    return bioMaxLengthMessage;
  }

  if (lower.includes("password") && lower.includes("match")) {
    return passwordMismatchMessage;
  }

  if (
    lower.includes("password") &&
    (lower.includes("uppercase") ||
      lower.includes("number") ||
      lower.includes("special") ||
      lower.includes("must contain"))
  ) {
    return passwordComplexityMessage;
  }

  if (lower.includes("department") && (lower.includes("invalid") || lower.includes("not found"))) {
    return "ដេប៉ាតឺម៉ង់ដែលបានជ្រើសរើសមិនត្រឹមត្រូវ។";
  }

  if (lower.includes("generation") && (lower.includes("invalid") || lower.includes("not found"))) {
    return "ជំនាន់ដែលបានជ្រើសរើសមិនត្រឹមត្រូវ។";
  }

  if (lower.includes("status") && lower.includes("invalid")) {
    return "ស្ថានភាពដែលបានជ្រើសរើសមិនត្រឹមត្រូវ។";
  }

  if (
    (lower.includes("current job") || lower.includes("current_job")) &&
    (lower.includes("empty") || lower.includes("blank") || lower.includes("required"))
  ) {
    return currentJobRequiredMessage;
  }

  if (lower.includes("start year") && lower.includes("end year")) {
    return "ឆ្នាំចាប់ផ្តើមត្រូវតែតូចជាងឆ្នាំបញ្ចប់។";
  }

  if (lower.includes("permission") || lower.includes("forbidden") || lower.includes("unauthorized")) {
    return "អ្នកមិនមានសិទ្ធិគ្រប់គ្រាន់ដើម្បីអនុវត្តសកម្មភាពនេះទេ។";
  }

  return text || fallbackMessage;
};
// error handling function to extract meaningful messages from API errors, with support for nested structures and fallback messages based on HTTP status codes.
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

  const specificMessage = responseMessages.find(
    (message) => !isGenericApiMessage(message),
  );

  if (specificMessage) {
    return translateKnownApiMessage(specificMessage, fallbackMessage);
  }

  if (fallbackMessage && responseMessages.some(isGenericApiMessage)) {
    return fallbackMessage;
  }

  if (responseMessages.length) {
    return translateKnownApiMessage(responseMessages[0], fallbackMessage);
  }

  if (err.response?.status && fallbackMessage) return fallbackMessage;

  return translateKnownApiMessage(err.message, fallbackMessage);
};
// helper functions for API response handling, error message extraction, and form validation, with a focus on user registration and status management in the alumni management context.
const createResponseError = (response, fallbackMessage) => {
  const error = new Error(getApiErrorMessage({ response }, fallbackMessage));
  error.response = response;
  return error;
};
// helper functions for API response handling, error message extraction, and form validation, with a focus on user registration and status management in the alumni management context.
const assertSuccessResponse = (response, fallbackMessage) => {
  if (!isSuccessResponse(response.data)) {
    throw createResponseError(response, fallbackMessage);
  }
};
// helper functions for API response handling, error message extraction, and form validation, with a focus on user registration and status management in the alumni management context.
const normalizeErrorField = (field) => {
  const fieldMap = {
    fullName: "fullname",
    full_name: "fullname",
    confirm_password: "confirmPassword",
    confirm_password_confirmation: "confirmPassword",
    password_confirmation: "confirmPassword",
    department_id: "departmentId",
    generation_id: "generationId",
    current_job: "currentJob",
    biography: "bio",
  };

  return fieldMap[field] || field;
};

const inlineErrorFields = new Set([
  "form",
  "fullname",
  "email",
  "phone",
  "password",
  "confirmPassword",
  "departmentId",
  "generationId",
  "currentJob",
  "bio",
  "status",
]);
// function to fetch participants of an event with pagination and status filter, handling API responses and errors gracefully, and updating the participants state accordingly.
const applyApiFieldErrors = (err, targetErrors) => {
  const responseErrors = err.response?.data?.errors;
  if (!responseErrors || typeof responseErrors !== "object") return;

  Object.entries(responseErrors).forEach(([field, value]) => {
    const message = readFirstError(value);
    if (message && !isGenericApiMessage(message)) {
      const normalizedField = normalizeErrorField(field);
      const translatedMessage = translateKnownApiMessage(message);

      if (inlineErrorFields.has(normalizedField)) {
        targetErrors.value[normalizedField] = translatedMessage;
      } else {
        targetErrors.value.form = translatedMessage;
      }
    }
  });
};

const applyInlineApiMessage = (message, targetErrors, options = {}) => {
  const text = String(message || "").trim();
  if (!text) return false;
  const lower = text.toLowerCase();

  if (text.includes("ពាក្យសម្ងាត់") || lower.includes("password")) {
    targetErrors.value.password = text;
  } else if (
    text.includes("ឈ្មោះពេញលេញ") ||
    lower.includes("fullname") ||
    lower.includes("full name") ||
    lower.includes("full_name")
  ) {
    targetErrors.value.fullname = text;
  } else if (text.includes("អ៊ីមែល") || lower.includes("email")) {
    targetErrors.value.email = text;
  } else if (text.includes("លេខទូរស័ព្ទ") || lower.includes("phone")) {
    if (String(options.phone || "").trim()) {
      targetErrors.value.phone = text;
    } else {
      targetErrors.value.form = text;
    }
  } else if (text.includes("ដេប៉ាតឺម៉ង់") || lower.includes("department")) {
    targetErrors.value.departmentId = text;
  } else if (text.includes("ជំនាន់") || lower.includes("generation")) {
    targetErrors.value.generationId = text;
  } else if (text.includes("មុខរបរបច្ចុប្បន្ន") || lower.includes("current job") || lower.includes("current_job")) {
    targetErrors.value.currentJob = text;
  } else if (text.includes("ជីវប្រវត្តិ") || lower.includes("bio") || lower.includes("biography")) {
    targetErrors.value.bio = text;
  } else if (text.includes("ស្ថានភាព") || lower.includes("status")) {
    targetErrors.value.status = text;
  } else {
    targetErrors.value.form = text;
  }

  return true;
};

const hasInlineErrors = (targetErrors) => Object.keys(targetErrors.value).length > 0;
// function to fetch participants of an event with pagination and status filter, handling API responses and errors gracefully, and updating the participants state accordingly.
const getDefaultRegisterForm = () => ({
  fullname: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  bio: "N/A",
  currentJob: "",
  departmentId: "",
  generationId: "",
  status: "APPROVE",
});

export const registerForm = ref(getDefaultRegisterForm());
export const registerErrors = ref({});
// Admin register form with default values and error state, along with validation logic to ensure proper input before making API calls for user registration.
const getDefaultAdminRegisterForm = () => ({
  fullname: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  bio: "N/A",
  currentJob: "",
  status: "APPROVE",
});

export const adminRegisterForm = ref(getDefaultAdminRegisterForm());
export const adminRegisterErrors = ref({});

export const getPerPage = () => itemsPerPage.value || 10;

export const clearRegisterErrors = () => {
  registerErrors.value = {};
};

export const resetRegisterForm = () => {
  registerForm.value = getDefaultRegisterForm();
};

export const clearAdminRegisterErrors = () => {
  adminRegisterErrors.value = {};
};

export const resetAdminRegisterForm = () => {
  adminRegisterForm.value = getDefaultAdminRegisterForm();
};

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const getStatusSelectValue = (value) => {
  const status = normalizeStatus(value);

  if (["APPROVED", "ACTIVE", "VERIFIED"].includes(status)) return "APPROVE";
  if (["REJECTED", "DEACTIVATE", "DEACTIVATED", "INACTIVE", "DISABLED"].includes(status)) {
    return "REJECT";
  }

  return ["PENDING", "APPROVE", "REJECT"].includes(status) ? status : "PENDING";
};
// function to fetch participants of an event with pagination and status filter, handling API responses and errors gracefully, and updating the participants state accordingly.
const getUserStatus = (user) => {
  const rawStatus = normalizeStatus(
    user?.status ||
      user?.profile?.status ||
      user?.accountStatus ||
      user?.state,
  );

  if (["APPROVED", "ACTIVE", "VERIFIED"].includes(rawStatus)) {
    return "APPROVE";
  }

  if (["REJECTED", "DEACTIVATE", "INACTIVE", "DISABLED"].includes(rawStatus)) {
    return "DEACTIVATED";
  }

  return rawStatus || (user?.isVerifyEmail ? "APPROVE" : "PENDING");
};
// function to fetch participants of an event with pagination and status filter, handling API responses and errors gracefully, and updating the participants state accordingly.
const getUserRole = (user) =>
  String(
    user?.role?.name ||
      user?.role ||
      user?.profile?.role?.name ||
      user?.profile?.role ||
      user?.userRole ||
      "",
  ).toLowerCase();
// function to fetch participants of an event with pagination and status filter, handling API responses and errors gracefully, and updating the participants state accordingly.
const hasAlumniRole = (user) => {
  const role = getUserRole(user);
  if (!role) return true;
  if (role.includes("admin")) return false;

  return ["alumni", "user", "student"].some(
    (allowedRole) => role === allowedRole || role.includes(allowedRole),
  );
};

const hasExplicitAlumniRole = (user) => getUserRole(user).includes("alumni");

const getManagedUsers = (data) => {
  if (!Array.isArray(data)) return [];

  // The current API returns alumni accounts as USER. Only narrow by role when
  // the response actually contains a dedicated alumni role.
  return data.some(hasExplicitAlumniRole) ? data.filter(hasAlumniRole) : data;
};

const isDeactivatedStatus = (status) =>
  [
    "REJECT",
    "REJECTED",
    "DEACTIVATED",
    "DEACTIVATE",
    "INACTIVE",
    "DISABLED",
  ].includes(status);

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

const getUserCreatedTime = (user) => {
  const rawDate =
    user?.createdAt ||
    user?.created_at ||
    user?.profile?.createdAt ||
    user?.profile?.created_at;
  const timestamp = rawDate ? new Date(rawDate).getTime() : NaN;

  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getUserSortId = (user) => {
  const rawId = user?.id ?? user?.userId ?? user?.profile?.id;
  const numericId = Number(String(rawId || "").split(":")[0]);

  return Number.isFinite(numericId) ? numericId : 0;
};

const sortNewestUsersFirst = (data) =>
  [...data].sort((firstUser, secondUser) => {
    const createdDiff =
      getUserCreatedTime(secondUser) - getUserCreatedTime(firstUser);
    if (createdDiff) return createdDiff;

    return getUserSortId(secondUser) - getUserSortId(firstUser);
  });

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

const getFetchParams = ({
  includePagination = true,
  includeSearch = true,
  includeStatus = true,
} = {}) => {
  const params = {};

  if (includePagination) {
    params._page = currentPage.value;
    params._per_page = getPerPage();
  }

  if (includeSearch && searchQuery.value?.trim()) {
    params.search = searchQuery.value.trim();
  }

  if (includeStatus && activeTab.value !== "ALL") {
    params.status = activeTab.value;
  }

  params.sortBy = USER_DEFAULT_SORT_BY;
  params.sortDir = USER_DEFAULT_SORT_DIR;

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

export const fetchUsers = async () => {
  const perPage = getPerPage();

  try {
    isLoading.value = true;

    try {
      let summaryData = [];
      let summaryPage = 1;
      let summaryPageLimit = 1;

      do {
        const summaryRes = await api.get("/users", {
          params: {
            _page: summaryPage,
            _per_page: CLIENT_FILTER_PAGE_SIZE,
          },
        });

        const summaryRoot = summaryRes.data ?? {};
        const summaryPayload = summaryRoot?.data ?? summaryRoot;
        summaryData.push(...extractItems(summaryRoot, summaryPayload));

        const { pages } = getPaginationMeta(summaryRoot, summaryPayload);
        if (!pages) break;

        summaryPageLimit = Math.min(pages, MAX_CLIENT_FILTER_PAGES);
        summaryPage += 1;
      } while (summaryPage <= summaryPageLimit);

      const summaryAlumni = getManagedUsers(summaryData);
      const summaryCounts = {
        approved: 0,
        pending: 0,
        deactivated: 0,
      };

      for (const user of summaryAlumni) {
        const status = getUserStatus(user);
        if (status === "APPROVE") summaryCounts.approved += 1;
        else if (status === "PENDING") summaryCounts.pending += 1;
        else if (isDeactivatedStatus(status)) {
          summaryCounts.deactivated += 1;
        }
      }

      allUsersTotal.value = summaryAlumni.length;
      allUsersApproved.value = summaryCounts.approved;
      allUsersPending.value = summaryCounts.pending;
      allUsersDeactivated.value = summaryCounts.deactivated;
    } catch (summaryErr) {
      logger.warn("Unable to fetch global summary counts:", summaryErr);
    }

    const usedGenericUsersEndpoint = true;
    const needsClientPagination = true;
    const needsClientFilters = true;
    const params = getFetchParams({
      includePagination: false,
      includeSearch: false,
      includeStatus: false,
    });

    logger.debug(
      "Fetching users with params:",
      params,
      "activeTab:",
      activeTab.value,
    );

    let root = {};
    let payload = {};
    let data = [];
    let page = 1;
    let pageLimit = 1;

    do {
      const pageParams = {
        ...params,
        _page: page,
        _per_page: CLIENT_FILTER_PAGE_SIZE,
      };
      const res = await api.get("/users", { params: pageParams });

      if (page === 1) {
        logger.info("/users endpoint succeeded");
        logger.debug("API Response:", res.data);
      }

      root = res.data ?? {};
      payload = root?.data ?? root;
      data.push(...extractItems(root, payload));

      const { pages } = getPaginationMeta(root, payload);
      if (!pages) break;

      pageLimit = Math.min(pages, MAX_CLIENT_FILTER_PAGES);
      page += 1;
    } while (page <= pageLimit);

    let usedClientFilter = false;

    if (usedGenericUsersEndpoint) {
      const managedUsers = getManagedUsers(data);
      usedClientFilter =
        usedClientFilter || managedUsers.length !== data.length;
      data = managedUsers;
    }

    if (needsClientFilters || usedGenericUsersEndpoint) {
      const searchOnly = data.filter(matchesSearch);
      usedClientFilter = usedClientFilter || searchOnly.length !== data.length;
      data = searchOnly;
    }

    // Client-side filter by status if API doesn't filter correctly
    if (activeTab.value !== "ALL") {
      const statusOnly = data.filter((user) => {
        const status = getUserStatus(user);
        return activeTab.value === "REJECT"
          ? isDeactivatedStatus(status)
          : status === activeTab.value;
      });
      usedClientFilter = usedClientFilter || statusOnly.length !== data.length;
      data = statusOnly;
    }

    data = sortNewestUsersFirst(data);

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
        : (totalFromMeta ?? data.length);
      const calculatedPages = Math.max(
        1,
        Math.ceil(totalItems.value / perPage),
      );
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
  showAccountTypeModal.value = false;
  resetRegisterForm();
  clearRegisterErrors();
  showRegisterModal.value = true;
};

export const closeRegisterModal = () => {
  showRegisterModal.value = false;
  resetRegisterForm();
  clearRegisterErrors();
};

export const openModal = () => {
  showAccountTypeModal.value = true;
};

export const closeModal = () => {
  showAccountTypeModal.value = false;
};

export const openAdminRegisterModal = () => {
  showAccountTypeModal.value = false;
  resetAdminRegisterForm();
  clearAdminRegisterErrors();
  showAdminRegisterModal.value = true;
};

export const closeAdminRegisterModal = () => {
  showAdminRegisterModal.value = false;
  resetAdminRegisterForm();
  clearAdminRegisterErrors();
};

export const requireAdmin = (callback) => {
  const auth = useAuthStore();
  const role = auth.user?.role?.name || auth.user?.role || "";
  if (["admin", "administrator"].includes(String(role).toLowerCase())) {
    return callback();
  }

  Swal.fire("សិទ្ធិមិនគ្រប់គ្រាន់", "អ្នកមិនមានសិទ្ធិទេ!", "error");
  return false;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_MIN_DIGITS = 7;
export const PHONE_MAX_DIGITS = REGISTER_PHONE_MAX_LENGTH;
const PHONE_PATTERN = /^[0-9]+$/;
const PASSWORD_COMPLEXITY_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
const ALLOWED_STATUSES = ["PENDING", "APPROVE", "REJECT"];

const normalizePhoneValue = (value) =>
  String(value || "")
    .replace(/\D/g, "");

const isValidPhone = (value) => {
  const phone = String(value || "").trim();
  if (!phone) return true;

  const digitCount = phone.replace(/\D/g, "").length;
  return PHONE_PATTERN.test(phone) && digitCount >= PHONE_MIN_DIGITS && phone.length <= REGISTER_PHONE_MAX_LENGTH;
};

const isPositiveInteger = (value) => {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0;
};

const setValidationError = (targetErrors, field, message) => {
  if (message) {
    targetErrors.value[field] = message;
  } else {
    delete targetErrors.value[field];
  }
};

const getPasswordError = (password) => {
  const value = String(password || "");
  if (!value) return "សូមបញ្ចូលពាក្យសម្ងាត់";
  if (value.length < MIN_PASSWORD_LENGTH) return passwordLengthMessage;
  if (!PASSWORD_COMPLEXITY_PATTERN.test(value)) return passwordComplexityMessage;
  return "";
};

const getConfirmPasswordError = (form) => {
  if (!form.confirmPassword) return "សូមបញ្ជាក់ពាក្យសម្ងាត់";
  if (form.password !== form.confirmPassword) return passwordMismatchMessage;
  return "";
};

const getFormFieldError = (form, field, options = {}) => {
  const email = String(form.email || "").trim();
  const phone = String(form.phone || "").trim();

  if (field === "fullname") {
    const fullname = String(form.fullname || "").trim();
    if (!fullname) return "សូមបញ្ចូលឈ្មោះពេញលេញ";
    return fullname.length <= REGISTER_FULLNAME_MAX_LENGTH
      ? ""
      : fullnameMaxLengthMessage;
  }

  if (field === "email") {
    if (!email) return "សូមបញ្ចូលអ៊ីម៉ែល";
    return EMAIL_PATTERN.test(email) ? "" : "ទម្រង់អ៊ីម៉ែលមិនត្រឹមត្រូវ";
  }

  if (field === "phone") {
    if (!phone) return "សូមបញ្ចូលលេខទូរស័ព្ទ";
    if (phone.length > REGISTER_PHONE_MAX_LENGTH) return phoneMaxLengthMessage;
    return isValidPhone(phone) ? "" : "លេខទូរស័ព្ទមិនត្រឹមត្រូវ";
  }

  if (field === "password") {
    return getPasswordError(form.password);
  }

  if (field === "confirmPassword") {
    return getConfirmPasswordError(form);
  }

  if (field === "currentJob") {
    const currentJob = String(form.currentJob || "").trim();
    if (!currentJob) return currentJobRequiredMessage;
    return currentJob.length <= REGISTER_CURRENT_JOB_MAX_LENGTH
      ? ""
      : currentJobMaxLengthMessage;
  }

  if (field === "bio") {
    const bio = String(form.bio || "").trim();
    return bio.length <= REGISTER_BIO_MAX_LENGTH ? "" : bioMaxLengthMessage;
  }

  if (field === "departmentId" && options.requireDepartment) {
    return isPositiveInteger(form.departmentId) ? "" : "សូមជ្រើសរើសដេប៉ាតមេន";
  }

  if (field === "generationId" && options.requireGeneration) {
    return isPositiveInteger(form.generationId) ? "" : "សូមជ្រើសរើសជំនាន់";
  }

  if (field === "status") {
    return ALLOWED_STATUSES.includes(normalizeStatus(form.status))
      ? ""
      : "សូមជ្រើសរើសស្ថានភាពត្រឹមត្រូវ";
  }

  return "";
};

const validateField = (form, targetErrors, field, options = {}) => {
  delete targetErrors.value.form;
  const message = getFormFieldError(form, field, options);
  setValidationError(targetErrors, field, message);

  if (field === "password" && (form.confirmPassword || targetErrors.value.confirmPassword)) {
    setValidationError(targetErrors, "confirmPassword", getConfirmPasswordError(form));
  }

  return !message;
};

export const validateRegisterField = (field) => {
  if (field === "phone") {
    registerForm.value.phone = normalizePhoneValue(registerForm.value.phone);
  }

  return validateField(registerForm.value, registerErrors, field, {
    requireDepartment: true,
    requireGeneration: true,
  });
};

export const validateAdminRegisterField = (field) => {
  if (field === "phone") {
    adminRegisterForm.value.phone = normalizePhoneValue(adminRegisterForm.value.phone);
  }

  return validateField(adminRegisterForm.value, adminRegisterErrors, field);
};

const validateRegisterForm = () => {
  clearRegisterErrors();

  const form = registerForm.value;
  const email = form.email?.trim() || "";
  const phone = normalizePhoneValue(form.phone);
  const status = normalizeStatus(form.status);
  const currentJob = form.currentJob?.trim() || "";
  const bio = form.bio?.trim() || "";

  form.fullname = form.fullname?.trim() || "";
  form.email = email;
  form.phone = phone;
  form.currentJob = currentJob;
  form.bio = bio;
  form.status = status || "APPROVE";

  if (!form.fullname) {
    registerErrors.value.fullname = "សូមបញ្ចូលឈ្មោះពេញលេញ";
  } else if (form.fullname.length > REGISTER_FULLNAME_MAX_LENGTH) {
    registerErrors.value.fullname = fullnameMaxLengthMessage;
  }

  if (!email) {
    registerErrors.value.email = "សូមបញ្ចូលអ៊ីម៉ែល";
  } else if (!EMAIL_PATTERN.test(email)) {
    registerErrors.value.email = "ទម្រង់អ៊ីម៉ែលមិនត្រឹមត្រូវ";
  }

  if (!phone) {
    registerErrors.value.phone = "សូមបញ្ចូលលេខទូរស័ព្ទ";
  } else if (phone.length > REGISTER_PHONE_MAX_LENGTH) {
    registerErrors.value.phone = phoneMaxLengthMessage;
  } else if (!isValidPhone(phone)) {
    registerErrors.value.phone = "លេខទូរស័ព្ទមិនត្រឹមត្រូវ";
  }

  const passwordError = getPasswordError(form.password);
  if (passwordError) {
    registerErrors.value.password = passwordError;
  }

  if (!form.confirmPassword) {
    registerErrors.value.confirmPassword = "សូមបញ្ជាក់ពាក្យសម្ងាត់";
  } else if (form.password !== form.confirmPassword) {
    registerErrors.value.confirmPassword = passwordMismatchMessage;
  }

  if (!isPositiveInteger(form.departmentId)) {
    registerErrors.value.departmentId = "សូមជ្រើសរើសដេប៉ាតមេន";
  }

  if (!isPositiveInteger(form.generationId)) {
    registerErrors.value.generationId = "សូមជ្រើសរើសជំនាន់";
  }

  if (!form.currentJob) {
    registerErrors.value.currentJob = currentJobRequiredMessage;
  } else if (form.currentJob.length > REGISTER_CURRENT_JOB_MAX_LENGTH) {
    registerErrors.value.currentJob = currentJobMaxLengthMessage;
  }

  if (form.bio.length > REGISTER_BIO_MAX_LENGTH) {
    registerErrors.value.bio = bioMaxLengthMessage;
  }

  if (!ALLOWED_STATUSES.includes(form.status)) {
    registerErrors.value.status = "សូមជ្រើសរើសស្ថានភាពត្រឹមត្រូវ";
  }

  return Object.keys(registerErrors.value).length === 0;
};

const validateAdminRegisterForm = () => {
  clearAdminRegisterErrors();

  const form = adminRegisterForm.value;
  const email = form.email?.trim() || "";
  const phone = normalizePhoneValue(form.phone);
  const status = normalizeStatus(form.status);
  const currentJob = form.currentJob?.trim() || "";
  const bio = form.bio?.trim() || "";

  form.fullname = form.fullname?.trim() || "";
  form.email = email;
  form.phone = phone;
  form.currentJob = currentJob;
  form.bio = bio;
  form.status = status || "APPROVE";

  if (!form.fullname) {
    adminRegisterErrors.value.fullname = "សូមបញ្ចូលឈ្មោះពេញលេញ";
  } else if (form.fullname.length > REGISTER_FULLNAME_MAX_LENGTH) {
    adminRegisterErrors.value.fullname = fullnameMaxLengthMessage;
  }

  if (!email) {
    adminRegisterErrors.value.email = "សូមបញ្ចូលអ៊ីម៉ែល";
  } else if (!EMAIL_PATTERN.test(email)) {
    adminRegisterErrors.value.email = "ទម្រង់អ៊ីម៉ែលមិនត្រឹមត្រូវ";
  }

  if (!phone) {
    adminRegisterErrors.value.phone = "សូមបញ្ចូលលេខទូរស័ព្ទ";
  } else if (phone.length > REGISTER_PHONE_MAX_LENGTH) {
    adminRegisterErrors.value.phone = phoneMaxLengthMessage;
  } else if (!isValidPhone(phone)) {
    adminRegisterErrors.value.phone = "លេខទូរស័ព្ទមិនត្រឹមត្រូវ";
  }

  const passwordError = getPasswordError(form.password);
  if (passwordError) {
    adminRegisterErrors.value.password = passwordError;
  }

  if (!form.confirmPassword) {
    adminRegisterErrors.value.confirmPassword =
      "សូមបញ្ជាក់ពាក្យសម្ងាត់";
  } else if (form.password !== form.confirmPassword) {
    adminRegisterErrors.value.confirmPassword =
      passwordMismatchMessage;
  }

  if (!form.currentJob) {
    adminRegisterErrors.value.currentJob = currentJobRequiredMessage;
  } else if (form.currentJob.length > REGISTER_CURRENT_JOB_MAX_LENGTH) {
    adminRegisterErrors.value.currentJob = currentJobMaxLengthMessage;
  }

  if (form.bio.length > REGISTER_BIO_MAX_LENGTH) {
    adminRegisterErrors.value.bio = bioMaxLengthMessage;
  }

  if (!ALLOWED_STATUSES.includes(form.status)) {
    adminRegisterErrors.value.status = "សូមជ្រើសរើសស្ថានភាពត្រឹមត្រូវ";
  }

  return Object.keys(adminRegisterErrors.value).length === 0;
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
      registerForm.value.password.length < MIN_PASSWORD_LENGTH
    ) {
      Swal.fire(
        "ការរឹងមាំ",
        `ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ${MIN_PASSWORD_LENGTH} តួអក្សរ`,
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
      bio: registerForm.value.bio?.trim() || "N/A",
      currentJob: registerForm.value.currentJob.trim(),
      departmentId: Number(registerForm.value.departmentId),
      generationId: Number(registerForm.value.generationId),
      status: registerForm.value.status || "APPROVE",
      phone: registerForm.value.phone.trim(),
    };

    logger.debug("Registering alumni with payload:", payload);
    const response = await api.post("/users/alumni", payload);
    assertSuccessResponse(response, registerAlumniFallbackMessage);
    logger.info("Registration response:", response.data);

    resetRegisterForm();

    showRegisterModal.value = false;
    clearRegisterErrors();
    currentPage.value = 1;
    await fetchUsers();
    Swal.fire("ជោគជ័យ", "គណនីត្រូវបានបង្កើតបានសម្រេច", "success");
  } catch (err) {
    logger.error("Registration error:", err);
    logger.error("Error response data:", err.response?.data);
    applyApiFieldErrors(err, registerErrors);
    const apiMessage = getApiErrorMessage(err, registerAlumniFallbackMessage);
    if (!hasInlineErrors(registerErrors)) {
      applyInlineApiMessage(apiMessage, registerErrors, {
        phone: registerForm.value.phone,
      });
    }
    if (!hasInlineErrors(registerErrors)) {
      Swal.fire("បរាជ័យ", apiMessage, "error");
    }
  } finally {
    isLoading.value = false;
  }
};

export const handleRegisterAdmin = async () => {
  try {
    if (!validateAdminRegisterForm()) {
      return;
    }

    isLoading.value = true;
    const payload = {
      fullname: adminRegisterForm.value.fullname.trim(),
      email: adminRegisterForm.value.email.trim(),
      password: adminRegisterForm.value.password,
      confirmPassword: adminRegisterForm.value.confirmPassword,
      bio: adminRegisterForm.value.bio?.trim() || "N/A",
      currentJob: adminRegisterForm.value.currentJob.trim(),
      status: adminRegisterForm.value.status || "APPROVE",
      phone: adminRegisterForm.value.phone.trim(),
    };

    logger.debug("Registering admin with payload:", payload);
    const response = await api.post("/users/admin", payload);
    assertSuccessResponse(response, registerAdminFallbackMessage);
    logger.info("Admin registration response:", response.data);

    resetAdminRegisterForm();
    showAdminRegisterModal.value = false;
    clearAdminRegisterErrors();
    currentPage.value = 1;
    await fetchUsers();
    Swal.fire("ជោគជ័យ", "គណនីអ្នកគ្រប់គ្រងត្រូវបានបង្កើតបានសម្រេច", "success");
  } catch (err) {
    logger.error("Admin registration error:", err);
    logger.error("Error response data:", err.response?.data);
    applyApiFieldErrors(err, adminRegisterErrors);
    const apiMessage = getApiErrorMessage(err, registerAdminFallbackMessage);
    if (!hasInlineErrors(adminRegisterErrors)) {
      applyInlineApiMessage(apiMessage, adminRegisterErrors, {
        phone: adminRegisterForm.value.phone,
      });
    }
    if (!hasInlineErrors(adminRegisterErrors)) {
      Swal.fire("បរាជ័យ", apiMessage, "error");
    }
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

    assertSuccessResponse(response, updateStatusFallbackMessage);
    logger.info("Status update response:", response.data);
    await fetchUsers();
    Swal.fire("រួចរាល់", "អនុម័តជោគជ័យ", "success");
  } catch (err) {
    logger.error("Change status error:", err);
    logger.error("Error response data:", err.response?.data);
    logger.error("Error status:", err.response?.status);
    Swal.fire(
      "បរាជ័យ",
      getApiErrorMessage(err, updateStatusFallbackMessage),
      "error",
    );
  } finally {
    isLoading.value = false;
  }
};

export const handleApproveUser = (userId) =>
  updateUserStatus(userId, "APPROVE");

export const handleChangeStatus = async (userId, currentStatus = "") => {
  const selectedStatus = getStatusSelectValue(currentStatus);
  const { value: status } = await Swal.fire({
    title: "ប្តូរស្ថានភាព",
    input: "select",
    inputValue: selectedStatus,
    inputOptions: {
      PENDING: "កំពុងរង់ចាំ",
      APPROVE: "យល់ព្រម",
      REJECT: "ផ្អាកដំណើរការ",
    },
    showCancelButton: true,
  });
  if (status) {
    await updateUserStatus(userId, status);
  }
};
