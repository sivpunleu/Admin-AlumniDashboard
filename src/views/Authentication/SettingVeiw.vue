<template>
  <div class="settings-page">
    <header class="settings-header">
      <div>
        <p class="settings-kicker mb-2">ការកំណត់</p>
        <h1 class="settings-title mb-0">សុវត្ថិភាពគណនី</h1>
      </div>
      <div class="settings-header-icon" aria-hidden="true">
        <i class="bi bi-shield-lock"></i>
      </div>
    </header>

    <section v-if="isInitialLoading" class="account-strip account-strip--skeleton" aria-busy="true"
      aria-live="polite" aria-label="កំពុងផ្ទុកព័ត៌មានគណនី">
      <div v-for="item in accountSkeletonItems" :key="item" class="account-item">
        <span class="skeleton-placeholder skeleton-account-icon"></span>
        <span class="skeleton-account-copy">
          <span class="skeleton-placeholder skeleton-line skeleton-line--account-label"></span>
          <span class="skeleton-placeholder skeleton-line skeleton-line--account-value"></span>
        </span>
      </div>
    </section>

    <section v-else class="account-strip" aria-label="Account summary">
      <div class="account-item">
        <span class="account-icon">
          <i class="bi bi-person-badge"></i>
        </span>
        <span>
          <span class="account-label">ឈ្មោះ</span>
          <strong>{{ displayName }}</strong>
        </span>
      </div>

      <div class="account-item">
        <span class="account-icon">
          <i class="bi bi-envelope-at"></i>
        </span>
        <span>
          <span class="account-label">អ៊ីមែល</span>
          <strong>{{ displayEmail }}</strong>
        </span>
      </div>

      <div class="account-item">
        <span class="account-icon">
          <i class="bi bi-person-gear"></i>
        </span>
        <span>
          <span class="account-label">តួនាទី</span>
          <strong>{{ displayRole }}</strong>
        </span>
      </div>
    </section>

    <div class="settings-grid">
      <form class="setting-card" novalidate @submit.prevent="handleChangePassword">
        <div class="setting-card-header">
          <span class="setting-card-icon">
            <i class="bi bi-key"></i>
          </span>
          <div>
            <h2>ផ្លាស់ប្តូរពាក្យសម្ងាត់</h2>
          </div>
        </div>

        <div class="field-stack">
          <div class="setting-field">
            <label for="current-password">ពាក្យសម្ងាត់បច្ចុប្បន្ន</label>
            <div class="input-shell" :class="{ 'is-invalid': passwordErrors.currentPassword }">
              <i class="bi bi-lock"></i>
              <input
                id="current-password"
                v-model.trim="passwordForm.currentPassword"
                :type="passwordVisible.currentPassword ? 'text' : 'password'"
                autocomplete="current-password"
                @input="clearFieldError(passwordErrors, 'currentPassword')"
              />
              <button
                type="button"
                class="icon-button"
                :aria-label="passwordVisible.currentPassword ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'"
                @click="passwordVisible.currentPassword = !passwordVisible.currentPassword"
              >
                <i :class="['bi', passwordVisible.currentPassword ? 'bi-eye-slash' : 'bi-eye']"></i>
              </button>
            </div>
            <p class="field-error">{{ passwordErrors.currentPassword || "" }}</p>
          </div>

          <div class="setting-field">
            <label for="new-password">ពាក្យសម្ងាត់ថ្មី</label>
            <div class="input-shell" :class="{ 'is-invalid': passwordErrors.newPassword }">
              <i class="bi bi-shield-check"></i>
              <input
                id="new-password"
                v-model.trim="passwordForm.newPassword"
                :type="passwordVisible.newPassword ? 'text' : 'password'"
                autocomplete="new-password"
                @input="clearFieldError(passwordErrors, 'newPassword')"
              />
              <button
                type="button"
                class="icon-button"
                :aria-label="passwordVisible.newPassword ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'"
                @click="passwordVisible.newPassword = !passwordVisible.newPassword"
              >
                <i :class="['bi', passwordVisible.newPassword ? 'bi-eye-slash' : 'bi-eye']"></i>
              </button>
            </div>
            <p class="field-error">{{ passwordErrors.newPassword || "" }}</p>
          </div>

          <div class="setting-field">
            <label for="confirm-password">បញ្ជាក់ពាក្យសម្ងាត់ថ្មី</label>
            <div class="input-shell" :class="{ 'is-invalid': passwordErrors.confirmPassword }">
              <i class="bi bi-check2-circle"></i>
              <input
                id="confirm-password"
                v-model.trim="passwordForm.confirmPassword"
                :type="passwordVisible.confirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                @input="clearFieldError(passwordErrors, 'confirmPassword')"
              />
              <button
                type="button"
                class="icon-button"
                :aria-label="passwordVisible.confirmPassword ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'"
                @click="passwordVisible.confirmPassword = !passwordVisible.confirmPassword"
              >
                <i :class="['bi', passwordVisible.confirmPassword ? 'bi-eye-slash' : 'bi-eye']"></i>
              </button>
            </div>
            <p class="field-error">{{ passwordErrors.confirmPassword || "" }}</p>
          </div>
        </div>

        <div class="setting-actions">
          <BaseButton type="submit" variant="primary" shape="sharp" :loading="loading.password">
            <i class="bi bi-save me-2"></i>
            រក្សាទុក
          </BaseButton>
        </div>
      </form>

      <form class="setting-card" novalidate autocomplete="off" @submit.prevent="handleRequestEmailChange">
        <div class="setting-card-header">
          <span class="setting-card-icon">
            <i class="bi bi-envelope-paper"></i>
          </span>
          <div>
            <h2>ផ្លាស់ប្តូរអ៊ីមែល</h2>
          </div>
        </div>

        <div class="field-stack">
          <div class="setting-field">
            <label for="new-email">អ៊ីមែលថ្មី</label>
            <div class="input-shell" :class="{ 'is-invalid': emailErrors.newEmail }">
              <i class="bi bi-envelope"></i>
              <input
                id="new-email"
                v-model.trim="emailForm.newEmail"
                type="email"
                :readonly="emailAutofillLocked.newEmail"
                autocomplete="off"
                data-1p-ignore
                data-bwignore
                data-lpignore="true"
                placeholder="name@example.com"
                @focus="unlockEmailField('newEmail')"
                @pointerdown="unlockEmailField('newEmail')"
                @input="clearFieldError(emailErrors, 'newEmail')"
              />
            </div>
            <p class="field-error">{{ emailErrors.newEmail || "" }}</p>
          </div>

          <div class="setting-field">
            <label for="email-password">ពាក្យសម្ងាត់</label>
            <div class="input-shell" :class="{ 'is-invalid': emailErrors.password }">
              <i class="bi bi-lock"></i>
              <input
                id="email-password"
                v-model.trim="emailForm.password"
                :type="passwordVisible.emailPassword ? 'text' : 'password'"
                :readonly="emailAutofillLocked.password"
                autocomplete="new-password"
                data-1p-ignore
                data-bwignore
                data-lpignore="true"
                @focus="unlockEmailField('password')"
                @pointerdown="unlockEmailField('password')"
                @input="clearFieldError(emailErrors, 'password')"
              />
              <button
                type="button"
                class="icon-button"
                :aria-label="passwordVisible.emailPassword ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'"
                @click="passwordVisible.emailPassword = !passwordVisible.emailPassword"
              >
                <i :class="['bi', passwordVisible.emailPassword ? 'bi-eye-slash' : 'bi-eye']"></i>
              </button>
            </div>
            <p class="field-error">{{ emailErrors.password || "" }}</p>
          </div>
        </div>

        <div class="setting-actions">
          <BaseButton type="submit" variant="primary" shape="sharp" :loading="loading.email">
            <i class="bi bi-send me-2"></i>
            ផ្ញើសំណើ
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import BaseButton from "@/components/UI/Base/BaseButton.vue";
import { useAuthStore } from "@/stores/useAuth";
import { useProfileStore } from "@/stores/useProfile";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const profileStore = useProfileStore();
const isInitialLoading = ref(!profileStore.profile);
const accountSkeletonItems = Array.from({ length: 3 }, (_, index) => index);

const passwordForm = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const emailForm = reactive({
  newEmail: "",
  password: "",
});

const emailAutofillLocked = reactive({
  newEmail: true,
  password: true,
});

const verifyForm = reactive({
  token: "",
});

const passwordErrors = reactive({});
const emailErrors = reactive({});
const verifyErrors = reactive({});

const passwordVisible = reactive({
  currentPassword: false,
  newPassword: false,
  confirmPassword: false,
  emailPassword: false,
});

const loading = reactive({
  password: false,
  email: false,
  verify: false,
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readFirstValue = (value) => Array.isArray(value) ? value[0] : value;

const getRouteToken = () => readFirstValue(route.query.token) ||
  readFirstValue(route.query.verificationToken) ||
  readFirstValue(route.query.emailChangeToken) ||
  readFirstValue(route.query.changeEmailToken);

const shouldAutoVerifyEmailChange = () =>
  readFirstValue(route.query.verifyEmailChange) === "1" || !!getRouteToken();

const cleanEmailChangeQuery = () => {
  const query = { ...route.query };
  delete query.token;
  delete query.verificationToken;
  delete query.emailChangeToken;
  delete query.changeEmailToken;
  delete query.verifyEmailChange;

  router.replace({ name: "settings", query }).catch(() => {});
};

const profilePayload = computed(() => profileStore.profile || authStore.user || {});

const accountProfile = computed(() => {
  const payload = profilePayload.value || {};
  const profile = payload.profile && typeof payload.profile === "object"
    ? payload.profile
    : payload;

  return {
    ...profile,
    email: payload.email || profile.email || authStore.user?.email || "",
    role: payload.role || profile.role || authStore.user?.role || authStore.user?.userRole || "",
  };
});

const displayName = computed(() => (
  accountProfile.value.fullname ||
  accountProfile.value.name ||
  accountProfile.value.username ||
  "Admin"
));

const displayEmail = computed(() => accountProfile.value.email || "N/A");

const displayRole = computed(() => {
  const role = accountProfile.value.role;
  const roleName = typeof role === "string" ? role : role?.name;
  return roleName || "Admin";
});

const clearErrors = (target) => {
  Object.keys(target).forEach((key) => {
    delete target[key];
  });
};

const clearFieldError = (target, field) => {
  delete target[field];
};

const unlockEmailField = (field) => {
  emailAutofillLocked[field] = false;
};

const resetForm = (target, values) => {
  Object.assign(target, values);
};

const normalizeField = (field) => {
  const fieldMap = {
    current_password: "currentPassword",
    new_password: "newPassword",
    confirm_password: "confirmPassword",
    new_email: "newEmail",
    verification_token: "token",
    verificationToken: "token",
  };

  return fieldMap[field] || field;
};

const applyApiErrors = (target, error) => {
  clearErrors(target);

  Object.entries(error?.fieldErrors || {}).forEach(([field, message]) => {
    target[normalizeField(field)] = message;
  });
};

const showError = async (target, error, fallbackMessage) => {
  if (error?.isSessionExpired) return;

  applyApiErrors(target, error);

  await Swal.fire({
    icon: "error",
    title: "បរាជ័យ",
    text: error?.message || fallbackMessage,
    confirmButtonColor: "#216477",
  });
};

const validatePasswordForm = () => {
  clearErrors(passwordErrors);

  if (!passwordForm.currentPassword) {
    passwordErrors.currentPassword = "សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន។";
  }

  if (!passwordForm.newPassword) {
    passwordErrors.newPassword = "សូមបញ្ចូលពាក្យសម្ងាត់ថ្មី។";
  } else if (passwordForm.newPassword.length < 8) {
    passwordErrors.newPassword = "ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច 8 តួ។";
  } else if (passwordForm.newPassword === passwordForm.currentPassword) {
    passwordErrors.newPassword = "ពាក្យសម្ងាត់ថ្មីត្រូវខុសពីពាក្យសម្ងាត់បច្ចុប្បន្ន។";
  }

  if (!passwordForm.confirmPassword) {
    passwordErrors.confirmPassword = "សូមបញ្ជាក់ពាក្យសម្ងាត់ថ្មី។";
  } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
    passwordErrors.confirmPassword = "ពាក្យសម្ងាត់បញ្ជាក់មិនត្រូវគ្នា។";
  }

  return Object.keys(passwordErrors).length === 0;
};

const validateEmailForm = () => {
  clearErrors(emailErrors);

  if (!emailForm.newEmail) {
    emailErrors.newEmail = "សូមបញ្ចូលអ៊ីមែលថ្មី។";
  } else if (!emailPattern.test(emailForm.newEmail)) {
    emailErrors.newEmail = "ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវ។";
  } else if (emailForm.newEmail === displayEmail.value) {
    emailErrors.newEmail = "អ៊ីមែលថ្មីត្រូវខុសពីអ៊ីមែលបច្ចុប្បន្ន។";
  }

  if (!emailForm.password) {
    emailErrors.password = "សូមបញ្ចូលពាក្យសម្ងាត់។";
  }

  return Object.keys(emailErrors).length === 0;
};

const validateVerifyForm = () => {
  clearErrors(verifyErrors);

  if (!verifyForm.token) {
    verifyErrors.token = "សូមបញ្ចូល token។";
  }

  return Object.keys(verifyErrors).length === 0;
};

const extractTokenFromUrl = (value) => {
  if (!value) return "";

  try {
    const url = new URL(value, window.location.origin);
    return url.searchParams.get("token") ||
      url.searchParams.get("verificationToken") ||
      url.searchParams.get("emailChangeToken") ||
      url.searchParams.get("changeEmailToken") ||
      url.pathname.split("/").filter(Boolean).at(-1) ||
      "";
  } catch {
    return "";
  }
};

const extractVerificationToken = (response) => {
  const payload = response?.data || response || {};
  return payload.token ||
    payload.verificationToken ||
    payload.emailChangeToken ||
    payload.changeEmailToken ||
    extractTokenFromUrl(payload.url) ||
    extractTokenFromUrl(payload.link) ||
    extractTokenFromUrl(payload.verifyUrl) ||
    extractTokenFromUrl(payload.verificationUrl) ||
    extractTokenFromUrl(payload.confirmUrl) ||
    extractTokenFromUrl(payload.confirmationUrl) ||
    "";
};

const handleChangePassword = async () => {
  if (!validatePasswordForm() || loading.password) return;

  loading.password = true;
  try {
    await authStore.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });

    resetForm(passwordForm, {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    await Swal.fire({
      icon: "success",
      title: "ជោគជ័យ",
      text: "ពាក្យសម្ងាត់ត្រូវបានផ្លាស់ប្តូររួចរាល់។",
      timer: 1600,
      showConfirmButton: false,
    });
  } catch (error) {
    await showError(passwordErrors, error, "មិនអាចផ្លាស់ប្តូរពាក្យសម្ងាត់បានទេ។");
  } finally {
    loading.password = false;
  }
};

const handleRequestEmailChange = async () => {
  if (!validateEmailForm() || loading.email) return;

  loading.email = true;
  try {
    const response = await authStore.requestEmailChange({
      newEmail: emailForm.newEmail,
      password: emailForm.password,
    });

    const token = extractVerificationToken(response);
    if (token) {
      verifyForm.token = token;
      const verified = await handleVerifyEmailChange({
        successText: "អ៊ីមែលថ្មីត្រូវបានផ្លាស់ប្តូររួចរាល់។",
      });

      if (verified) {
        resetForm(emailForm, {
          newEmail: "",
          password: "",
        });
      }

      return;
    }

    resetForm(emailForm, {
      newEmail: "",
      password: "",
    });

    await Swal.fire({
      icon: "success",
      title: "ជោគជ័យ",
      text: "សំណើផ្លាស់ប្តូរអ៊ីមែលត្រូវបានផ្ញើរួចរាល់។ សូមចុច Confirm Email Change ក្នុងអ៊ីមែលថ្មី។",
      timer: 2600,
      showConfirmButton: false,
    });
  } catch (error) {
    await showError(emailErrors, error, "មិនអាចផ្ញើសំណើផ្លាស់ប្តូរអ៊ីមែលបានទេ។");
  } finally {
    loading.email = false;
  }
};

const handleVerifyEmailChange = async ({
  successText = "អ៊ីមែលថ្មីត្រូវបានផ្ទៀងផ្ទាត់រួចរាល់។",
} = {}) => {
  if (!validateVerifyForm() || loading.verify) return;

  loading.verify = true;
  try {
    await authStore.verifyEmailChange({
      token: verifyForm.token,
    });

    resetForm(verifyForm, { token: "" });

    await Swal.fire({
      icon: "success",
      title: "ជោគជ័យ",
      text: successText,
      timer: 1600,
      showConfirmButton: false,
    });

    return true;
  } catch (error) {
    await showError(verifyErrors, error, "មិនអាចផ្ទៀងផ្ទាត់អ៊ីមែលថ្មីបានទេ។");
    return false;
  } finally {
    loading.verify = false;
  }
};

const verifyEmailChangeFromRoute = async () => {
  const queryToken = getRouteToken();

  if (!authStore.isLogined || !queryToken || !shouldAutoVerifyEmailChange()) {
    return;
  }

  verifyForm.token = queryToken;
  const verified = await handleVerifyEmailChange();

  if (verified) {
    cleanEmailChangeQuery();
  }
};

onMounted(async () => {
  const queryToken = getRouteToken();

  if (queryToken) {
    verifyForm.token = queryToken;
  }

  if (!profileStore.profile) {
    try {
      await profileStore.fetchProfile().catch(() => {});
    } finally {
      isInitialLoading.value = false;
    }
  } else {
    isInitialLoading.value = false;
  }

  if (!authStore.isLogined) return;

  await verifyEmailChangeFromRoute();
});

watch(
  () => [
    route.query.token,
    route.query.verificationToken,
    route.query.emailChangeToken,
    route.query.changeEmailToken,
    route.query.verifyEmailChange,
  ],
  () => {
    verifyEmailChangeFromRoute();
  },
);
</script>

<style scoped>
.settings-page {
  color: #0f172a;
}

.settings-header {
  min-height: 104px;
  margin-bottom: 1rem;
  padding: 1.25rem;
  border: 1px solid #dbe6ea;
  border-radius: 8px;
  background: linear-gradient(135deg, #ffffff 0%, #eef6f8 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.settings-kicker {
  color: #216477;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.settings-title {
  font-size: 1.55rem;
  font-weight: 800;
}

.settings-header-icon,
.account-icon,
.setting-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.settings-header-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 8px;
  background: #216477;
  color: #ffffff;
  font-size: 1.35rem;
}

.account-strip {
  margin-bottom: 1rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.account-item {
  min-width: 0;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.account-item strong,
.account-label {
  display: block;
  min-width: 0;
}

.account-item strong {
  overflow: hidden;
  color: #0f172a;
  font-size: 0.95rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-label {
  margin-bottom: 0.15rem;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
}

.account-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  background: #eef6f8;
  color: #216477;
  font-size: 1.1rem;
}

.skeleton-placeholder {
  position: relative;
  display: block;
  overflow: hidden;
  background: #e5e7eb;
  border-radius: 999px;
}

.skeleton-placeholder::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.65), transparent);
  animation: skeleton-shimmer 1.35s ease-in-out infinite;
}

.skeleton-account-icon {
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  border-radius: 8px;
}

.skeleton-account-copy {
  display: grid;
  gap: 0.45rem;
  width: 100%;
  min-width: 0;
}

.skeleton-line {
  height: 12px;
}

.skeleton-line--account-label {
  width: 54px;
  height: 10px;
}

.skeleton-line--account-value {
  width: min(180px, 72%);
  height: 16px;
  border-radius: 8px;
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.setting-card {
  min-width: 0;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.setting-card-wide {
  grid-column: 1 / -1;
}

.setting-card-header {
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.setting-card-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 800;
}

.setting-card-icon {
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 8px;
  background: #216477;
  color: #ffffff;
  font-size: 1.15rem;
}

.field-stack {
  display: grid;
  gap: 0.85rem;
}

.setting-field {
  min-width: 0;
}

.setting-field label {
  display: block;
  margin-bottom: 0.45rem;
  color: #334155;
  font-size: 0.8rem;
  font-weight: 800;
}

.input-shell {
  min-height: 48px;
  padding: 0 0.8rem;
  border: 1.5px solid #dbe3ea;
  border-radius: 8px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.input-shell:focus-within {
  border-color: #216477;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(33, 100, 119, 0.1);
}

.input-shell.is-invalid {
  border-color: #dc3545;
  background: #fff7f7;
}

.input-shell > i {
  color: #94a3b8;
  flex: 0 0 auto;
}

.input-shell input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #0f172a;
  font-weight: 600;
}

.input-shell input::placeholder {
  color: #94a3b8;
}

.icon-button {
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #216477;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.icon-button:hover,
.icon-button:focus-visible {
  background: #e8f1f4;
  outline: 0;
}

.field-error {
  min-height: 1rem;
  margin: 0.35rem 0 0;
  color: #dc2626;
  font-size: 0.78rem;
  font-weight: 700;
}

.setting-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.verify-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 1rem;
}

.setting-actions-inline {
  margin-top: 0;
  padding-bottom: 1rem;
}

@media (max-width: 991.98px) {
  .account-strip,
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .setting-card-wide {
    grid-column: auto;
  }
}

@media (max-width: 575.98px) {
  .settings-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .verify-row {
    grid-template-columns: 1fr;
  }

  .setting-actions,
  .setting-actions-inline {
    padding-bottom: 0;
  }

  .setting-actions .btn {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-placeholder::after {
    animation: none;
  }
}
</style>
