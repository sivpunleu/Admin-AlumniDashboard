<template>
  <main class="admin-login-page">
    <section class="admin-login-card" aria-label="Admin login">
      <aside class="admin-login-brand" aria-label="Alumni brand">
        <div class="admin-login-logo">
          <i class="bi bi-mortarboard-fill"></i>
          <span>អតីតនិស្សិត</span>
        </div>

        <div class="admin-login-brand-copy">
          <h1>Reconnect &<br />Empower</h1>
          <p>
            គ្រប់គ្រងទិន្នន័យអតីតនិស្សិត ព្រឹត្តិការណ៍ និងសកម្មភាពសហគមន៍
            ក្នុងកន្លែងតែមួយ។
          </p>
        </div>
      </aside>

      <section class="admin-login-form-panel" aria-label="Login form">
        <div class="admin-login-form">
          <header class="admin-login-header">
            <h2>សូមស្វាគមន៍ត្រឡប់</h2>
            <p>សូមបញ្ចូលព័ត៌មានរបស់អ្នកដើម្បីចូលប្រើប្រាស់</p>
          </header>

          <form novalidate @submit.prevent="handleLogin">
            <div class="admin-login-field">
              <label for="email" class="admin-login-label">អាសយដ្ឋានអ៊ីមែល</label>
              <div class="admin-login-input">
                <i class="bi bi-envelope"></i>
                <input id="email" v-model="form.email" type="email" name="email"
                  :class="{ 'is-invalid': authStore.errors.email }" placeholder="admin@alumni.edu" autocomplete="email"
                  required :aria-invalid="!!authStore.errors.email" aria-describedby="email-error" @blur="validateEmail"
                  @input="validateEmail" />
              </div>
              <p v-if="authStore.errors.email" id="email-error" class="admin-login-error">
                {{ authStore.errors.email[0] }}
              </p>
            </div>

            <div class="admin-login-field">
              <div class="admin-login-label-row">
                <label for="password" class="admin-login-label">ពាក្យសម្ងាត់</label>
                <button type="button" class="admin-login-link" @click="showPassword = !showPassword">
                  {{ showPassword ? "លាក់ពាក្យសម្ងាត់" : "បង្ហាញពាក្យសម្ងាត់" }}
                </button>
              </div>
              <div class="admin-login-input">
                <i class="bi bi-lock"></i>
                <input id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'" name="password"
                  :class="{ 'is-invalid': authStore.errors.password }" placeholder="បញ្ចូលពាក្យសម្ងាត់"
                  autocomplete="current-password" required minlength="6" :aria-invalid="!!authStore.errors.password"
                  aria-describedby="password-error" @blur="validatePassword" @input="validatePassword" />
                <i v-if="showPassword" class="bi bi-eye-slash" @click="showPassword = !showPassword"></i>
                <i v-else class="bi bi-eye" @click="showPassword = !showPassword"></i>
              </div>
              <p v-if="authStore.errors.password" id="password-error" class="admin-login-error">
                {{ authStore.errors.password[0] }}
              </p>
            </div>

            <label class="admin-login-remember">
              <input v-model="rememberMe" type="checkbox" />
              <span>ចងចាំខ្ញុំ</span>
            </label>

            <button type="submit" class="admin-login-submit" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm"></span>
              <span>{{ loading ? "កំពុងផ្ទៀងផ្ទាត់..." : "ចូលគណនី" }}</span>
            </button>
          </form>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/useAuth";
import { useRouter } from "vue-router";
import swal from "sweetalert2";

const router = useRouter();
const authStore = useAuthStore();

const form = ref({ email: "", password: "" });
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
    await authStore.login(form.value);

    swal.fire({
      icon: "success",
      title: "ជោគជ័យ",
      text: "ស្វាគមន៍មកកាន់ប្រព័ន្ធគ្រប់គ្រង",
      timer: 1500,
      showConfirmButton: false,
    });
    router.push("/dashboard");
  } catch (error) {
    console.error("Login stopped:", error.message);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  width: 100%;
  display: grid;
  place-items: center;
  padding: clamp(1rem, 4vw, 3rem);
  background: #f4f7f9;
}

.admin-login-page *,
.admin-login-page *::before,
.admin-login-page *::after {
  box-sizing: border-box;
}

.admin-login-card {
  width: min(100%, 900px);
  max-width: 900px;
  min-height: 520px;
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  overflow: hidden;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.16);
}

.admin-login-brand {
  position: relative;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 3rem;
  padding: 3rem;
  overflow: hidden;
  background: #216477;
  color: #ffffff;
  text-align: center;
}

.admin-login-brand::before,
.admin-login-brand::after {
  content: "";
  position: absolute;
  border: 5px solid rgba(255, 255, 255, 0.95);
  border-radius: 999px;
}

.admin-login-brand::before {
  width: 56px;
  height: 56px;
  right: -29px;
  top: 71%;
}

.admin-login-brand::after {
  width: 64px;
  height: 64px;
  left: -31px;
  bottom: -34px;
  background: #ffffff;
}

.admin-login-logo {
  width: 104px;
  height: 104px;
  display: grid;
  place-items: center;
  padding: 0.75rem;
  border-radius: 14px;
  background: #ffffff;
  color: #216477;
  font-size: 2.25rem;
  font-weight: 800;
  box-shadow: 0 16px 35px rgba(15, 23, 42, 0.14);
}

.admin-login-logo span {
  font-size: 0.76rem;
  line-height: 1.2;
}

.admin-login-brand-copy {
  max-width: 330px;
}

.admin-login-brand-copy h1 {
  margin: 0 0 0.7rem;
  color: #ffffff;
  font-size: 2.3rem;
  font-weight: 800;
  line-height: 1.08;
}

.admin-login-brand-copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.95rem;
  line-height: 1.8;
}

.admin-login-form-panel {
  display: grid;
  place-items: center;
  padding: clamp(2rem, 5vw, 4rem);
  background: #ffffff;
}

.admin-login-form {
  width: min(100%, 390px);
}

.admin-login-header {
  margin-bottom: 2.2rem;
  text-align: center;
}

.admin-login-header h2 {
  margin: 0 0 0.45rem;
  color: #0f172a;
  font-size: 1.85rem;
  font-weight: 800;
}

.admin-login-header p {
  margin: 0;
  color: #8a96a3;
  font-size: 0.9rem;
}

.admin-login-field {
  margin-bottom: 1.2rem;
}

.admin-login-label-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.admin-login-label {
  display: block;
  margin-bottom: 0.48rem;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
}

.admin-login-link {
  margin-bottom: 0.48rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #216477;
  font-size: 0.75rem;
  font-weight: 800;
}

.admin-login-input {
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  border: 1px solid #d7dfe8;
  border-radius: 13px;
  background: #f5f7f9;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.admin-login-input:focus-within {
  border-color: rgba(33, 100, 119, 0.6);
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(33, 100, 119, 0.12);
}

.admin-login-input i {
  color: #8a96a3;
  font-size: 1rem;
}

.admin-login-input input {
  width: 100%;
  min-width: 0;
  min-height: 50px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #0f172a;
  font-size: 0.95rem;
}

.admin-login-input input:focus {
  outline: none;
}

.admin-login-input input::placeholder {
  color: #7a8794;
}

.admin-login-input input.is-invalid {
  color: #b42318;
}

.admin-login-error {
  margin: 0.4rem 0 0;
  color: #dc3545;
  font-size: 0.78rem;
  font-weight: 700;
}

.admin-login-remember {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 2rem;
  color: #475569;
  font-size: 0.86rem;
  font-weight: 700;
}

.admin-login-remember input {
  width: 15px;
  height: 15px;
  accent-color: #216477;
}

.admin-login-submit {
  width: 100%;
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  border: 0;
  border-radius: 12px;
  background: #216477;
  color: #ffffff;
  font-weight: 800;
  box-shadow: 0 18px 35px rgba(33, 100, 119, 0.24);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.admin-login-submit:hover,
.admin-login-submit:focus {
  background: #1a4f5d;
  transform: translateY(-1px);
}

.admin-login-submit:disabled {
  cursor: not-allowed;
  opacity: 0.76;
  transform: none;
}

@media (max-width: 820px) {
  .admin-login-card {
    grid-template-columns: 1fr;
  }

  .admin-login-brand {
    min-height: 290px;
    gap: 1.5rem;
    padding: 2rem;
  }

  .admin-login-brand-copy h1 {
    font-size: 2rem;
  }
}

@media (max-width: 520px) {
  .admin-login-page {
    padding: 0;
    place-items: stretch;
  }

  .admin-login-card {
    min-height: auto;
    border-radius: 0;
  }

  .admin-login-brand {
    min-height: 240px;
  }

  .admin-login-logo {
    width: 86px;
    height: 86px;
    font-size: 1.8rem;
  }

  .admin-login-form-panel {
    padding: 1.5rem;
  }
}
</style>
