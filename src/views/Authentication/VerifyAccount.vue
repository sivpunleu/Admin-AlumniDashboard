<template>
  <main class="verify-page">
    <section class="verify-card" aria-label="ផ្ទៀងផ្ទាត់គណនី">
      <aside class="verify-brand" aria-label="សុវត្ថិភាពគណនី">
        <div class="verify-brand__logo">
          <img src="@/assets/Imgage/Logo.jpg" alt="ស្លាកសញ្ញាអតីតនិស្សិត" />
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

          <Transition name="verify-alert-slide">
            <div v-if="notice.text" :class="['verify-alert', `verify-alert--${notice.type}`]" role="status">
              <i :class="['bi', notice.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle']"
                aria-hidden="true"></i>
              <span>{{ notice.text }}</span>
            </div>
          </Transition>

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
              <Transition name="verify-error-slide">
                <p v-if="errors.email" id="email-error" class="verify-error">{{ errors.email }}</p>
              </Transition>
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
              <Transition name="verify-error-slide">
                <p v-if="errors.code" id="code-error" class="verify-error">{{ errors.code }}</p>
              </Transition>
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
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  width: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: clamp(1rem, 3vw, 2.5rem);
  background:
    linear-gradient(135deg, rgba(33, 100, 119, 0.12), rgba(245, 158, 11, 0.08), rgba(15, 118, 110, 0.1)),
    repeating-linear-gradient(90deg, rgba(33, 100, 119, 0.05) 0 1px, transparent 1px 68px),
    repeating-linear-gradient(0deg, rgba(33, 100, 119, 0.04) 0 1px, transparent 1px 68px),
    #f6faf9;
  animation: verifyBackdropShift 18s ease-in-out infinite alternate;
}

.verify-page::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, 0.38) 44%, transparent 58%);
  transform: translateX(-72%);
  animation: verifyPageSweep 9s ease-in-out infinite;
}

.verify-card {
  position: relative;
  z-index: 1;
  width: min(100%, 980px);
  min-height: 590px;
  display: grid;
  grid-template-columns: minmax(300px, 0.9fr) minmax(360px, 1.1fr);
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 28px;
  background: #ffffff;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.15);
  animation: verifyCardEnter 0.72s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.verify-brand {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.7rem;
  padding: clamp(2rem, 4vw, 3.4rem);
  background: linear-gradient(155deg, #154f5b 0%, #216477 52%, #2f7d74 100%);
  text-align: center;
  color: #ffffff;
  overflow: hidden;
}

.verify-brand::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.13) 1px, transparent 1px),
    linear-gradient(0deg, rgba(255, 255, 255, 0.09) 1px, transparent 1px);
  background-size: 44px 44px;
  opacity: 0.18;
  animation: verifyGridDrift 22s linear infinite;
}

.verify-brand::after {
  content: "";
  position: absolute;
  left: -16%;
  right: -16%;
  bottom: 14%;
  height: 140px;
  background: linear-gradient(100deg, transparent 0%, rgba(245, 158, 11, 0.16) 38%, rgba(255, 255, 255, 0.11) 56%, transparent 100%);
  transform: rotate(-8deg);
  animation: verifyRibbonGlow 6.5s ease-in-out infinite alternate;
}

.verify-brand__logo {
  position: relative;
  z-index: 1;
  width: 136px;
  height: 136px;
  display: grid;
  place-items: center;
  padding: 13px;
  border-radius: 26px;
  background: #ffffff;
  box-shadow: 0 20px 45px rgba(7, 47, 54, 0.32);
  animation: verifyLogoFloat 5.8s ease-in-out infinite;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
  will-change: transform;
}

.verify-brand__logo::before {
  content: "";
  position: absolute;
  inset: -10px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 34px;
  opacity: 0.8;
  animation: verifyLogoFrame 4.8s ease-in-out infinite;
}

.verify-brand__logo img {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 22px;
}

.verify-brand__copy {
  position: relative;
  z-index: 1;
  max-width: 360px;
}

.verify-brand__copy h1 {
  margin-bottom: 0.8rem;
  color: #ffffff;
  font-size: clamp(1.9rem, 3vw, 2.35rem);
  font-weight: 800;
  animation: verifyFadeRise 0.64s ease both 0.22s;
}

.verify-brand__copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.86);
  line-height: 1.8;
  animation: verifyFadeRise 0.64s ease both 0.32s;
}

.verify-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(2.2rem, 5vw, 4rem);
  background: linear-gradient(180deg, #ffffff 0%, #fbfdfd 100%);
}

.verify-form {
  width: 100%;
  max-width: 430px;
  animation: verifyFadeRise 0.68s ease both 0.18s;
}

.verify-back,
.verify-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #216477;
  font-weight: 800;
  text-decoration: none;
  transition: color 0.2s ease, transform 0.2s ease;
}

.verify-back {
  margin-bottom: 1.6rem;
  font-size: 0.9rem;
}

.verify-back:hover {
  color: #1a4f5d;
  text-decoration: underline;
  transform: translateX(-3px);
}

.verify-header {
  margin-bottom: 1.5rem;
}

.verify-kicker {
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
  animation: verifyFadeRise 0.58s ease both 0.24s;
}

.verify-kicker i {
  animation: verifyKickerPulse 3.8s ease-in-out infinite;
}

.verify-header h2 {
  margin-bottom: 0.65rem;
  color: #0f172a;
  font-size: clamp(1.75rem, 3vw, 2.2rem);
  font-weight: 800;
  animation: verifyFadeRise 0.58s ease both 0.32s;
}

.verify-header p {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
  animation: verifyFadeRise 0.58s ease both 0.4s;
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
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
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

.verify-form__stack > * {
  animation: verifyFieldIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.verify-form__stack > *:nth-child(1) {
  animation-delay: 0.06s;
}

.verify-form__stack > *:nth-child(2) {
  animation-delay: 0.12s;
}

.verify-form__stack > *:nth-child(3) {
  animation-delay: 0.18s;
}

.verify-form__stack > *:nth-child(4) {
  animation-delay: 0.24s;
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
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.verify-input:hover {
  border-color: #b9c9d2;
  transform: translateY(-1px);
}

.verify-input:focus-within {
  border-color: #216477;
  box-shadow: 0 0 0 4px rgba(33, 100, 119, 0.12);
  transform: translateY(-1px);
}

.verify-input i {
  color: #94a3b8;
  transition: color 0.2s ease, transform 0.2s ease;
}

.verify-input:focus-within i {
  color: #216477;
  transform: scale(1.08);
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
  transition: color 0.2s ease, transform 0.2s ease;
}

.verify-secondary:hover:not(:disabled),
.verify-secondary:focus-visible:not(:disabled) {
  color: #1a4f5d;
  transform: translateY(-1px);
  outline: none;
}

.verify-secondary i {
  transition: transform 0.2s ease;
}

.verify-secondary:hover:not(:disabled) i,
.verify-secondary:focus-visible:not(:disabled) i {
  transform: translateX(2px);
}

.verify-secondary:disabled {
  opacity: 0.7;
}

.verify-alert-slide-enter-active,
.verify-alert-slide-leave-active {
  overflow: hidden;
  transition: opacity 0.24s ease, transform 0.24s ease, max-height 0.24s ease, margin-bottom 0.24s ease;
}

.verify-alert-slide-enter-from,
.verify-alert-slide-leave-to {
  max-height: 0;
  margin-bottom: 0;
  opacity: 0;
  transform: translateY(-8px);
}

.verify-alert-slide-enter-to,
.verify-alert-slide-leave-from {
  max-height: 160px;
  opacity: 1;
  transform: translateY(0);
}

.verify-error-slide-enter-active,
.verify-error-slide-leave-active {
  overflow: hidden;
  transition: opacity 0.22s ease, transform 0.22s ease, max-height 0.22s ease, margin-top 0.22s ease;
}

.verify-error-slide-enter-from,
.verify-error-slide-leave-to {
  max-height: 0;
  margin-top: 0;
  opacity: 0;
  transform: translateY(-6px);
}

.verify-error-slide-enter-to,
.verify-error-slide-leave-from {
  max-height: 64px;
  opacity: 1;
  transform: translateY(0);
}

@keyframes verifyBackdropShift {
  from {
    background-position: 0 0, 0 0, 0 0, 0 0;
  }

  to {
    background-position: 0 0, 34px 0, 0 34px, 0 0;
  }
}

@keyframes verifyPageSweep {
  0%,
  24% {
    opacity: 0;
    transform: translateX(-72%);
  }

  45% {
    opacity: 0.72;
  }

  72%,
  100% {
    opacity: 0;
    transform: translateX(72%);
  }
}

@keyframes verifyCardEnter {
  from {
    opacity: 0;
    transform: translateY(22px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes verifyGridDrift {
  from {
    background-position: 0 0, 0 0;
  }

  to {
    background-position: 44px 22px, -22px 44px;
  }
}

@keyframes verifyRibbonGlow {
  from {
    opacity: 0.74;
    transform: translateX(-8px) rotate(-8deg);
  }

  to {
    opacity: 1;
    transform: translateX(8px) rotate(-8deg);
  }
}

@keyframes verifyLogoFloat {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

@keyframes verifyLogoFrame {
  0%,
  100% {
    opacity: 0.46;
    transform: scale(0.98);
  }

  50% {
    opacity: 0.9;
    transform: scale(1.03);
  }
}

@keyframes verifyFadeRise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes verifyKickerPulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.12);
  }
}

@keyframes verifyFieldIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
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
