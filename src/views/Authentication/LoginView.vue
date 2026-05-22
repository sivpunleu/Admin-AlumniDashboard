<template>
  <main class="admin-login-page">
    <section class="admin-login-card" aria-label="Admin login">
      <!-- LEFT BRAND -->
      <aside class="admin-login-brand" aria-label="Alumni brand">
        <div class="admin-login-logo-wrapper">
          <div class="admin-login-logo">
            <img src=".././../assets/Imgage/logo.png" alt="Alumni Logo" class="admin-login-logo-img" />
          </div>
        </div>

        <div class="admin-login-brand-copy">
          <h1>Alumni System</h1>

          <p>
            គ្រប់គ្រងទិន្នន័យអតីតនិស្សិត ព្រឹត្តិការណ៍ និងសកម្មភាពសហគមន៍
            ក្នុងកន្លែងតែមួយ។
          </p>
        </div>
      </aside>

      <!-- RIGHT FORM -->
      <section class="admin-login-form-panel" aria-label="Login form">
        <div class="admin-login-form">
          <header class="admin-login-header">
            <h2>សូមស្វាគមន៍</h2>
            <p>សូមបញ្ចូលព័ត៌មានរបស់អ្នកដើម្បីចូលប្រើប្រាស់</p>
          </header>

          <form novalidate @submit.prevent="handleLogin">
            <!-- EMAIL -->
            <div class="admin-login-field">
              <label for="email" class="admin-login-label">
                អាសយដ្ឋានអ៊ីមែល
              </label>

              <div class="admin-login-input">
                <i class="bi bi-envelope"></i>

                <input id="email" v-model="form.email" type="email" name="email"
                  :class="{ 'is-invalid': authStore.errors.email }" placeholder="សូមបញ្ចូលអាស័យដ្ឋានអ៊ីមែល" autocomplete="email"
                  required :aria-invalid="!!authStore.errors.email" aria-describedby="email-error" @blur="validateEmail"
                  @input="validateEmail" />
              </div>

              <Transition name="admin-login-error-slide">
                <p v-if="authStore.errors.email" id="email-error" class="admin-login-error">
                  {{ authStore.errors.email[0] }}
                </p>
              </Transition>
            </div>

            <!-- PASSWORD -->
            <div class="admin-login-field">
              <div class="admin-login-label-row">
                <label for="password" class="admin-login-label">
                  ពាក្យសម្ងាត់
                </label>
              </div>

              <div class="admin-login-input">
                <i class="bi bi-lock"></i>

                <input id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'" name="password"
                  :class="{ 'is-invalid': authStore.errors.password }" placeholder="បញ្ចូលពាក្យសម្ងាត់"
                  autocomplete="current-password" required minlength="6" :aria-invalid="!!authStore.errors.password"
                  aria-describedby="password-error" @blur="validatePassword" @input="validatePassword" />

                <button type="button" class="admin-login-toggle" :aria-pressed="showPassword"
                  :aria-label="showPassword ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'"
                  @click="showPassword = !showPassword">
                  <i :class="['bi', showPassword ? 'bi-eye-slash' : 'bi-eye']" aria-hidden="true"></i>
                </button>
              </div>

              <Transition name="admin-login-error-slide">
                <p v-if="authStore.errors.password" id="password-error" class="admin-login-error">
                  {{ authStore.errors.password[0] }}
                </p>
              </Transition>
            </div>
            <div class="admin-login-options d-flex justify-content-between align-items-center mb-4">
              <!-- REMEMBER -->
              <label class="admin-login-remember">
                <input v-model="rememberMe" type="checkbox" />
                <span>ចងចាំខ្ញុំ</span>
              </label>
              <!-- forgot password -->
              <div class="admin-login-forgot text-end">
                <router-link to="/forgot-password">ភ្លេចពាក្យសម្ងាត់?</router-link>
              </div>
            </div>


            <!-- BUTTON -->
            <BaseButton type="submit" variant="primary" class="w-100" :disabled="loading" :loading="loading">
              {{ loading ? "កំពុងផ្ទៀងផ្ទាត់..." : "ចូលគណនី" }}
            </BaseButton>
          </form>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { ref } from "vue";
import BaseButton from "@/components/UI/Base/BaseButton.vue";
import { useAuthStore } from "@/stores/useAuth";
import { useRoute, useRouter } from "vue-router";
import swal from "sweetalert2";
import logger from "@/utils/logger";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = ref({
  email: "",
  password: "",
});

const loading = ref(false);
const showPassword = ref(false);
const rememberMe = ref(false);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail() {
  const email = form.value.email.trim();

  form.value.email = email;

  if (!email) {
    authStore.errors.email = ["សូមបញ្ចូលអ៊ីមែល!"];
  } else if (!emailPattern.test(email)) {
    authStore.errors.email = ["ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវ!"];
  } else {
    delete authStore.errors.email;
  }
}

function validatePassword() {
  const pass = form.value.password;

  if (!pass) {
    authStore.errors.password = ["សូមបញ្ចូលពាក្យសម្ងាត់!"];
  } else if (pass.length < 6) {
    authStore.errors.password = ["ពាក្យសម្ងាត់យ៉ាងតិច 6 តួ!"];
  } else {
    delete authStore.errors.password;
  }
}

function validateForm() {
  validateEmail();
  validatePassword();

  return !authStore.errors.email && !authStore.errors.password;
}

const handleLogin = async () => {
  if (!validateForm()) return;

  loading.value = true;

  try {
    await authStore.login(form.value, { remember: rememberMe.value });

    swal.fire({
      icon: "success",
      title: "ជោគជ័យ",
      text: "ស្វាគមន៍មកកាន់ប្រព័ន្ធគ្រប់គ្រង",
      timer: 1500,
      showConfirmButton: false,
    });

    const redirectPath = typeof route.query.redirect === "string"
      ? route.query.redirect
      : "/dashboard";

    router.push(redirectPath);
  } catch (error) {
    const status = error.response?.status;
    if (![401, 422].includes(status)) {
      logger.error("Login stopped:", error.message);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.admin-login-page {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  width: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: 2rem;
  background:
    linear-gradient(135deg, rgba(33, 100, 119, 0.14) 0%, rgba(245, 158, 11, 0.08) 45%, rgba(47, 125, 116, 0.12) 100%),
    repeating-linear-gradient(90deg, rgba(33, 100, 119, 0.05) 0 1px, transparent 1px 68px),
    repeating-linear-gradient(0deg, rgba(33, 100, 119, 0.04) 0 1px, transparent 1px 68px),
    #f6faf9;
  animation: adminLoginBackdrop 18s ease-in-out infinite alternate;
}

.admin-login-page::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, 0.4) 44%, transparent 58%);
  transform: translateX(-72%);
  animation: adminLoginSweep 9s ease-in-out infinite;
}

.admin-login-forgot a {
  display: inline-flex;
  font-size: 0.9rem;
  color: #216477;
  text-decoration: none;
  transition: color 0.2s ease, transform 0.2s ease;
}
.admin-login-forgot a:hover {
  color: #1a4f5d;
  text-decoration: underline;
  transform: translateX(2px);
}

/* CARD */

.admin-login-card {
  position: relative;
  z-index: 1;
  width: min(100%, 950px);
  min-height: 580px;
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  overflow: hidden;
  border-radius: 28px;
  background: #ffffff;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.12);
  animation: adminLoginCardIn 0.72s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* LEFT */

.admin-login-brand {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 3rem;
  overflow: hidden;
  background: linear-gradient(155deg, #154f5b 0%, #216477 52%, #2f7d74 100%);
  text-align: center;
  color: white;
}

/* DECORATION */

.admin-login-brand::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.13) 1px, transparent 1px),
    linear-gradient(0deg, rgba(255, 255, 255, 0.09) 1px, transparent 1px);
  background-size: 44px 44px;
  opacity: 0.18;
  animation: adminLoginGridDrift 22s linear infinite;
}

.admin-login-brand::after {
  content: "";
  position: absolute;
  left: -16%;
  right: -16%;
  bottom: 14%;
  height: 140px;
  background: linear-gradient(100deg, transparent 0%, rgba(245, 158, 11, 0.16) 38%, rgba(255, 255, 255, 0.11) 56%, transparent 100%);
  transform: rotate(-8deg);
  animation: adminLoginRibbon 6.5s ease-in-out infinite alternate;
}

/* LOGO */

.admin-login-logo-wrapper {
  position: relative;
  z-index: 2;
  animation: adminLoginFadeRise 0.64s ease both 0.16s;
}

.admin-login-logo-wrapper::before {
  content: "";
  position: absolute;
  inset: -10px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 34px;
  opacity: 0.8;
  animation: adminLoginLogoFrame 4.8s ease-in-out infinite;
}

.admin-login-logo {
  position: relative;
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  border-radius: 28px;
  background: #ffff;
  box-shadow: 0 22px 48px rgba(7, 47, 54, 0.28);
  animation: adminLoginLogoFloat 5.8s ease-in-out infinite;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
  will-change: transform;
}


.admin-login-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 22px;
}

/* TEXT */

.admin-login-brand-copy {
  position: relative;
  z-index: 2;
  max-width: 360px;
}

.admin-login-brand-copy h1 {
  margin-bottom: 1rem;
  font-size: 2.3rem;
  font-weight: 800;
  color: white;
  animation: adminLoginFadeRise 0.64s ease both 0.28s;
}

.admin-login-brand-copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.9;
  font-size: 0.96rem;
  animation: adminLoginFadeRise 0.64s ease both 0.38s;
}

/* RIGHT */

.admin-login-form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdfd 100%);
}

.admin-login-form {
  width: 100%;
  max-width: 400px;
  animation: adminLoginFadeRise 0.68s ease both 0.2s;
}

.admin-login-header {
  margin-bottom: 2rem;
  text-align: center;
}

.admin-login-header h2 {
  margin-bottom: 0.5rem;
  color: #0f172a;
  font-size: 2rem;
  font-weight: 800;
  animation: adminLoginFadeRise 0.58s ease both 0.28s;
}

.admin-login-header p {
  color: #64748b;
  animation: adminLoginFadeRise 0.58s ease both 0.36s;
}

.admin-login-form form > * {
  animation: adminLoginFieldIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.admin-login-form form > *:nth-child(1) {
  animation-delay: 0.08s;
}

.admin-login-form form > *:nth-child(2) {
  animation-delay: 0.14s;
}

.admin-login-form form > *:nth-child(3) {
  animation-delay: 0.2s;
}

.admin-login-form form > *:nth-child(4) {
  animation-delay: 0.26s;
}

.admin-login-field {
  margin-bottom: 1.2rem;
}

.admin-login-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-login-label {
  margin-bottom: 0.55rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
}

.admin-login-input {
  min-height: 56px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  border-radius: 16px;
  border: 1px solid #dbe3ea;
  background: #f8fafc;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.admin-login-input:hover {
  border-color: #b9c9d2;
  transform: translateY(-1px);
}

.admin-login-input:focus-within {
  background: white;
  border-color: #216477;
  box-shadow: 0 0 0 4px rgba(33, 100, 119, 0.12);
  transform: translateY(-1px);
}

.admin-login-input i {
  color: #94a3b8;
  transition: color 0.2s ease, transform 0.2s ease;
}

.admin-login-input:focus-within i {
  color: #216477;
  transform: scale(1.08);
}

.admin-login-input input {
  width: 100%;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #0f172a;
}

.admin-login-input input::placeholder {
  color: #94a3b8;
}

.admin-login-toggle {
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #216477;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.admin-login-toggle:hover,
.admin-login-toggle:focus-visible {
  background: #e8f1f4;
  transform: rotate(-6deg) scale(1.04);
  outline: none;
}

.admin-login-error {
  margin-top: 0.45rem;
  color: #dc2626;
  font-size: 0.8rem;
  font-weight: 600;
}

.admin-login-remember {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  /* margin-bottom: 2rem; */
  font-size: 0.9rem;
  color: #475569;
  transition: color 0.2s ease, transform 0.2s ease;
}

.admin-login-remember:hover {
  color: #216477;
  transform: translateY(-1px);
}

.admin-login-remember input {
  accent-color: #216477;
}

.admin-login-error-slide-enter-active,
.admin-login-error-slide-leave-active {
  overflow: hidden;
  transition: opacity 0.22s ease, transform 0.22s ease, max-height 0.22s ease, margin-top 0.22s ease;
}

.admin-login-error-slide-enter-from,
.admin-login-error-slide-leave-to {
  max-height: 0;
  margin-top: 0;
  opacity: 0;
  transform: translateY(-6px);
}

.admin-login-error-slide-enter-to,
.admin-login-error-slide-leave-from {
  max-height: 64px;
  opacity: 1;
  transform: translateY(0);
}

@keyframes adminLoginBackdrop {
  from {
    background-position: 0 0, 0 0, 0 0, 0 0;
  }

  to {
    background-position: 0 0, 34px 0, 0 34px, 0 0;
  }
}

@keyframes adminLoginSweep {
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

@keyframes adminLoginCardIn {
  from {
    opacity: 0;
    transform: translateY(22px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes adminLoginGridDrift {
  from {
    background-position: 0 0, 0 0;
  }

  to {
    background-position: 44px 22px, -22px 44px;
  }
}

@keyframes adminLoginRibbon {
  from {
    opacity: 0.74;
    transform: translateX(-8px) rotate(-8deg);
  }

  to {
    opacity: 1;
    transform: translateX(8px) rotate(-8deg);
  }
}

@keyframes adminLoginFadeRise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes adminLoginLogoFrame {
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

@keyframes adminLoginLogoFloat {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

@keyframes adminLoginFieldIn {
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
  .admin-login-card {
    grid-template-columns: 1fr;
  }

  .admin-login-brand {
    min-height: 320px;
  }
}

@media (max-width: 520px) {
  .admin-login-page {
    padding: 0;
  }

  .admin-login-card {
    border-radius: 0;
  }

  .admin-login-form-panel {
    padding: 2rem 1.3rem;
  }

  .admin-login-logo {
    width: 120px;
    height: 120px;
  }

  .admin-login-brand-copy h1 {
    font-size: 1.9rem;
  }
}
</style>
