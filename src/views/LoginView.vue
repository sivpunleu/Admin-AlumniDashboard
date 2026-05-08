<template>
  <div class="login-wrapper">
    <div class="stars"></div>
    <div class="shooting-star"></div>
    <div class="shooting-star"></div>
    <div class="shooting-star"></div>
    <div class="shooting-star"></div>
    <div class="shooting-star"></div>

    <div class="container d-flex justify-content-center align-items-center vh-100">
      <div class="card glass-card shadow-lg border-0 rounded-4 p-4" style="width: 400px">
        <div class="text-center mb-4">
          <div class="brand-icon mb-2">
            <i class="bi bi-person-circle text-info" style="font-size: 3rem"></i>
          </div>
          <h3 class="fw-bold text-white">ចូលគណនី</h3>
          <p class="text-light-50 small">សូមបញ្ចូលព័ត៌មានដើម្បីបន្ត</p>
        </div>

        <form @submit.prevent="handlelogin">
          <div class="mb-3">
            <label class="form-label fw-bold text-white small">អ៊ីមែល</label>
            <div class="input-group">
              <span class="input-group-text bg-transparent border-end-0 text-info">
                <i class="bi bi-envelope"></i>
              </span>
              <input type="email" class="form-control bg-transparent text-white border-start-0"
                :class="{ 'is-invalid': authStore.errors.email }" v-model="form.email" placeholder="name@gmail.com"
                @input="validateemail" />
              <div class="invalid-feedback" v-if="authStore.errors.email">
                {{ authStore.errors.email[0] }}
              </div>
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label fw-bold text-white small">លេខសម្ងាត់</label>
            <div class="input-group">
              <span class="input-group-text bg-transparent border-end-0 text-info">
                <i class="bi bi-lock"></i>
              </span>
              <input :type="showPassword ? 'text' : 'password'"
                class="form-control bg-transparent text-white border-start-0 border-end-0"
                :class="{ 'is-invalid': authStore.errors.password }" v-model="form.password"
                placeholder="បញ្ចូលលេខសម្ងាត់" @input="validatepassword" />
              <button class="btn btn-outline-info border-start-0 bg-transparent" type="button"
                @click="showPassword = !showPassword">
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
              <div class="invalid-feedback" v-if="authStore.errors.password">
                {{ authStore.errors.password[0] }}
              </div>
            </div>
          </div>

          <div class="d-grid">
            <button type="submit" class="btn btn-info rounded-3 py-2 fw-bold text-white shadow" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ loading ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'ចូលប្រើប្រាស់' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/useAuth";
import { useRouter } from "vue-router";
import swal from "sweetalert2";

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  email: "",
  password: "",
});

const loading = ref(false);
const showPassword = ref(false);

// Email Validation
function validateemail() {
  if (!form.value.email) {
    authStore.errors.email = ["សូមបញ្ចូលអ៊ីមែល!"];
  } else if (!/\S+@\S+\.\S+/.test(form.value.email)) {
    authStore.errors.email = ["ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវ!"];
  } else {
    if (authStore.errors.email) delete authStore.errors.email;
  }
}

// Password Validation
function validatepassword() {
  const pass = form.value.password;
  if (!pass) {
    authStore.errors.password = ["សូមបញ្ចូលពាក្យសម្ងាត់!"];
  } else if (pass.length < 6) {
    authStore.errors.password = ["ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ 6 តួ!"];
  } else if (!/[A-Z]/.test(pass) || !/[a-z]/.test(pass) || !/\d/.test(pass)) {
    authStore.errors.password = ["ត្រូវមានអក្សរធំ តូច និងលេខបញ្ចូលគ្នា!"];
  } else {
    if (authStore.errors.password) delete authStore.errors.password;
  }
}

// Handle Login
const handlelogin = async () => {
  // Re-validate before submit
  validateemail();
  validatepassword();

  if (authStore.errors.email || authStore.errors.password) {
    return;
  }

  loading.value = true;
  try {
    await authStore.login(form.value);

    if (authStore.token) {
      swal.fire({
        icon: "success",
        title: "ជោគជ័យ",
        text: "អ្នកបានចូលប្រើប្រាស់ដោយជោគជ័យ",
        timer: 1500,
        showConfirmButton: false,
      });
      router.push("/dashboard");
    }
  } catch (error) {
    console.error("Login Error:", error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Space Background */
.login-wrapper {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(to bottom, #0b0b2b, #1b2735 70%, #090a0f);
  overflow: hidden;
}

/* Glass Effect for Card */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  /* ធ្វើឱ្យថ្លា */
  backdrop-filter: blur(10px);
  /* ធ្វើឱ្យព្រាល */
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.text-light-50 {
  color: rgba(255, 255, 255, 0.6);
}

/* Input Styles */
.form-control,
.input-group-text {
  border-color: rgba(255, 255, 255, 0.2);
  color: white !important;
}

.form-control::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.form-control:focus {
  background: rgba(255, 255, 255, 0.1);
  box-shadow: none;
  border-color: #0dcaf0;
}

/* Star Animations (កូដដែលអ្នកផ្ដល់ឱ្យ) */
.stars {
  width: 1px;
  height: 1px;
  position: absolute;
  background: white;
  box-shadow: 2vw 5vh 2px white, 10vw 8vh 2px white, 15vw 15vh 1px white, 22vw 22vh 1px white, 28vw 12vh 2px white, 32vw 32vh 1px white, 38vw 18vh 2px white, 42vw 35vh 1px white, 48vw 25vh 2px white, 53vw 42vh 1px white, 58vw 15vh 2px white, 63vw 38vh 1px white, 68vw 28vh 2px white, 73vw 45vh 1px white, 78vw 32vh 2px white, 83vw 48vh 1px white, 88vw 20vh 2px white, 93vw 52vh 1px white, 98vw 35vh 2px white, 5vw 60vh 1px white, 12vw 65vh 2px white, 18vw 72vh 1px white, 25vw 78vh 2px white, 30vw 85vh 1px white, 35vw 68vh 2px white, 40vw 82vh 1px white, 45vw 92vh 2px white, 50vw 75vh 1px white, 55vw 88vh 2px white, 60vw 95vh 1px white, 65vw 72vh 2px white, 70vw 85vh 1px white, 75vw 78vh 2px white, 80vw 92vh 1px white, 85vw 82vh 2px white, 90vw 88vh 1px white, 95vw 75vh 2px white;
  animation: twinkle 8s infinite linear;
}

.shooting-star {
  position: absolute;
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, white, transparent);
  animation: shoot 3s infinite ease-in;
}

/* Animations Logic */
@keyframes twinkle {

  0%,
  100% {
    opacity: 0.8;
  }

  50% {
    opacity: 0.4;
  }
}

@keyframes shoot {
  0% {
    transform: translateX(-100px) translateY(0) rotate(25deg);
    opacity: 1;
  }

  100% {
    transform: translateX(120vw) translateY(50vh) rotate(25deg);
    opacity: 0;
  }
}
</style>