<template>
  <main class="verify-page">
    <section class="verify-card" aria-label="ផ្ទៀងផ្ទាត់គណនី">
      <aside class="verify-brand" aria-label="សុវត្ថិភាពគណនី">
        <div class="verify-brand__logo">
          <img src="@/assets/Imgage/logo.png" alt="ស្លាកសញ្ញាអតីតនិស្សិត" />
        </div>
        <div class="verify-brand__copy">
          <h1>ផ្ទៀងផ្ទាត់គណនី</h1>
          <p>បញ្ចូលលេខកូដ OTP ដែលបានផ្ញើទៅអ៊ីមែលរបស់អ្នក ដើម្បីបើកការចូលប្រើប្រព័ន្ធ។</p>
        </div>
      </aside>

      <section class="verify-panel" aria-label="ទម្រង់ផ្ទៀងផ្ទាត់ OTP">
        <div class="verify-form">
          <RouterLink class="verify-back" :to="{ name: 'login' }">
            <i class="bi bi-arrow-left" aria-hidden="true"></i>
            ត្រឡប់ទៅចូលគណនី
          </RouterLink>

          <header class="verify-header">
            <span class="verify-kicker">
              <i class="bi bi-shield-check" aria-hidden="true"></i>
              Verify OTP
            </span>
            <h2>បញ្ចូលលេខកូដ OTP</h2>
            <p>បន្ទាប់ពីផ្ទៀងផ្ទាត់បានជោគជ័យ អ្នកអាចចូលគណនីវិញបានភ្លាម។</p>
          </header>

          <div v-if="notice.text" :class="['verify-alert', `verify-alert--${notice.type}`]" role="status">
            <i :class="['bi', notice.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle']"
              aria-hidden="true"></i>
            <span>{{ notice.text }}</span>
          </div>

          <form class="verify-form__stack" novalidate @submit.prevent="handleVerifyAccount">
            <div class="verify-field">
              <label for="email" class="verify-label">អាសយដ្ឋានអ៊ីមែល</label>
              <div class="verify-input">
                <i class="bi bi-envelope" aria-hidden="true"></i>
                <input id="email" v-model="form.email" type="email" name="email"
                  :class="{ 'is-invalid': errors.email }" placeholder="admin@alumni.edu" autocomplete="email"
                  :aria-invalid="!!errors.email" aria-describedby="email-error" @blur="validateEmail"
                  @input="clearError('email')" />
              </div>
              <p v-if="errors.email" id="email-error" class="verify-error">{{ errors.email }}</p>
            </div>

            <div class="verify-field">
              <label for="code" class="verify-label">លេខកូដ OTP</label>
              <div class="verify-input verify-input--code">
                <i class="bi bi-key" aria-hidden="true"></i>
                <input id="code" v-model="form.code" type="text" name="code" inputmode="numeric"
                  :class="{ 'is-invalid': errors.code }" placeholder="********" autocomplete="one-time-code"
                  :aria-invalid="!!errors.code" aria-describedby="code-error" @blur="validateCode"
                  @input="clearError('code')" />
              </div>
              <p v-if="errors.code" id="code-error" class="verify-error">{{ errors.code }}</p>
            </div>

            <BaseButton type="submit" variant="primary" shape="rounded" class="w-100 verify-submit"
              :disabled="verifying" :loading="verifying">
              {{ verifying ? "កំពុងផ្ទៀងផ្ទាត់..." : "Verify គណនី" }}
            </BaseButton>

            <button type="button" class="verify-secondary" :disabled="sendingOtp" @click="handleSendOtp">
              <span v-if="sendingOtp" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
              <i v-else class="bi bi-send" aria-hidden="true"></i>
              <span>{{ sendingOtp ? "កំពុងផ្ញើ OTP..." : "ផ្ញើ OTP ម្តងទៀត" }}</span>
            </button>
          </form>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import BaseButton from "@/components/UI/Base/BaseButton.vue";
import { useAuthStore } from "@/stores/useAuth";
import swal from "sweetalert2";
import logger from "@/utils/logger";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const getRouteEmail = () => {
  const email = route.query.email;
  return Array.isArray(email) ? email[0] || "" : email || "";
};

const form = reactive({
  email: getRouteEmail(),
  code: "",
});

const errors = reactive({});
const notice = reactive({
  type: "success",
  text: "",
});

const sendingOtp = ref(false);
const verifying = ref(false);
const autoSentEmail = ref("");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setNotice(type, text) {
  notice.type = type;
  notice.text = text;
}

function clearNotice() {
  notice.text = "";
}

function clearError(field) {
  if (errors[field]) delete errors[field];
  clearNotice();
}

function clearErrors() {
  Object.keys(errors).forEach((field) => delete errors[field]);
}

function readFirstError(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function applyServerErrors(error, fallbackMessage) {
  const responseErrors = error.fieldErrors || {};
  Object.entries(responseErrors).forEach(([field, value]) => {
    errors[field] = readFirstError(value);
  });

  setNotice("error", error.message || fallbackMessage);
}

function validateEmail() {
  form.email = form.email.trim();

  if (!form.email) {
    errors.email = "សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែល។";
  } else if (!emailPattern.test(form.email)) {
    errors.email = "សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលឱ្យបានត្រឹមត្រូវ។";
  } else {
    delete errors.email;
  }

  return !errors.email;
}

function validateCode() {
  form.code = form.code.trim();

  if (!form.code) {
    errors.code = "សូមបញ្ចូលលេខកូដ OTP។";
  } else if (form.code.length < 4) {
    errors.code = "លេខកូដ OTP មិនត្រឹមត្រូវ។";
  } else {
    delete errors.code;
  }

  return !errors.code;
}

function validateVerifyForm() {
  clearErrors();
  const emailIsValid = validateEmail();
  const codeIsValid = validateCode();
  return emailIsValid && codeIsValid;
}

async function sendOtpForCurrentEmail() {
  if (!validateEmail() || sendingOtp.value) return false;

  sendingOtp.value = true;

  try {
    await authStore.sendVerificationOtp(form.email);
    setNotice("success", "OTP ត្រូវបានផ្ញើទៅអ៊ីមែលរបស់អ្នករួចហើយ។");
    return true;
  } catch (error) {
    logger.error("Send verification OTP failed:", {
      status: error.status,
      message: error.message,
    });
    applyServerErrors(error, "មិនអាចផ្ញើ OTP បានទេ។");
    return false;
  } finally {
    sendingOtp.value = false;
  }
}

async function handleSendOtp() {
  await sendOtpForCurrentEmail();
}

async function autoSendOtpFromRouteEmail() {
  const email = form.email.trim();

  if (!email || autoSentEmail.value === email) return;

  const sent = await sendOtpForCurrentEmail();
  if (sent) autoSentEmail.value = email;
}

async function handleVerifyAccount() {
  if (!validateVerifyForm()) return;

  verifying.value = true;

  try {
    await authStore.verifyAccount({
      email: form.email,
      code: form.code,
    });

    await swal.fire({
      icon: "success",
      title: "ផ្ទៀងផ្ទាត់ជោគជ័យ",
      text: "គណនីរបស់អ្នកត្រូវបាន verify រួចហើយ។ សូមចូលគណនីម្ដងទៀត។",
      timer: 1800,
      showConfirmButton: false,
    });

    router.push({ name: "login" });
  } catch (error) {
    logger.error("Verify account failed:", {
      status: error.status,
      message: error.message,
    });
    applyServerErrors(error, "មិនអាចផ្ទៀងផ្ទាត់គណនីបានទេ។");
  } finally {
    verifying.value = false;
  }
}

watch(
  () => route.query.email,
  async () => {
    const routeEmail = getRouteEmail();
    if (routeEmail) form.email = routeEmail;
    await autoSendOtpFromRouteEmail();
  },
);

onMounted(() => {
  autoSendOtpFromRouteEmail();
});
</script>

<style scoped>
.verify-page {
  min-height: 100vh;
  width: 100%;
  display: grid;
  place-items: center;
  padding: clamp(1rem, 3vw, 2.5rem);
  background:
    linear-gradient(135deg, rgba(33, 100, 119, 0.12), rgba(15, 118, 110, 0.08)),
    #f6faf9;
}

.verify-card {
  width: min(100%, 980px);
  min-height: 590px;
  display: grid;
  grid-template-columns: minmax(300px, 0.9fr) minmax(360px, 1.1fr);
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 28px;
  background: #ffffff;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.15);
}

.verify-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.7rem;
  padding: clamp(2rem, 4vw, 3.4rem);
  background: linear-gradient(155deg, #154f5b 0%, #216477 52%, #2f7d74 100%);
  text-align: center;
  color: #ffffff;
}

.verify-brand__logo {
  width: 136px;
  height: 136px;
  display: grid;
  place-items: center;
  padding: 13px;
  border-radius: 26px;
  background: #ffffff;
  box-shadow: 0 20px 45px rgba(7, 47, 54, 0.32);
}

.verify-brand__logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 22px;
}

.verify-brand__copy {
  max-width: 360px;
}

.verify-brand__copy h1 {
  margin-bottom: 0.8rem;
  color: #ffffff;
  font-size: clamp(1.9rem, 3vw, 2.35rem);
  font-weight: 800;
}

.verify-brand__copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.86);
  line-height: 1.8;
}

.verify-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(2.2rem, 5vw, 4rem);
}

.verify-form {
  width: 100%;
  max-width: 430px;
}

.verify-back,
.verify-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #216477;
  font-weight: 800;
  text-decoration: none;
}

.verify-back {
  margin-bottom: 1.6rem;
  font-size: 0.9rem;
}

.verify-back:hover {
  color: #1a4f5d;
  text-decoration: underline;
}

.verify-header {
  margin-bottom: 1.5rem;
}

.verify-kicker {
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
}

.verify-header h2 {
  margin-bottom: 0.65rem;
  color: #0f172a;
  font-size: clamp(1.75rem, 3vw, 2.2rem);
  font-weight: 800;
}

.verify-header p {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
}

.verify-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  margin-bottom: 1.25rem;
  padding: 0.85rem 1rem;
  border: 1px solid transparent;
  border-radius: 14px;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.5;
}

.verify-alert--success {
  border-color: #bbf7d0;
  background: #ecfdf5;
  color: #047857;
}

.verify-alert--error {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.verify-form__stack {
  display: grid;
  gap: 1rem;
}

.verify-label {
  display: block;
  margin-bottom: 0.55rem;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 700;
}

.verify-input {
  min-height: 58px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  border: 1px solid #dbe3ea;
  border-radius: 15px;
  background: #ffffff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.verify-input:focus-within {
  border-color: #216477;
  box-shadow: 0 0 0 4px rgba(33, 100, 119, 0.12);
}

.verify-input i {
  color: #94a3b8;
}

.verify-input input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #0f172a;
}

.verify-input--code input {
  font-weight: 800;
  letter-spacing: 0.08em;
}

.verify-error {
  margin: 0.45rem 0 0;
  color: #dc2626;
  font-size: 0.8rem;
  font-weight: 600;
}

.verify-submit {
  min-height: 52px;
}

.verify-secondary {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 0;
  background: transparent;
  color: #216477;
  font-weight: 800;
}

.verify-secondary:disabled {
  opacity: 0.7;
}

@media (max-width: 850px) {
  .verify-card {
    grid-template-columns: 1fr;
    max-width: 580px;
  }

  .verify-brand {
    min-height: 300px;
  }
}

@media (max-width: 520px) {
  .verify-page {
    padding: 0.75rem;
  }

  .verify-card {
    border-radius: 22px;
  }

  .verify-panel {
    padding: 2rem 1.15rem;
  }

  .verify-brand__logo {
    width: 106px;
    height: 106px;
  }
}
</style>
