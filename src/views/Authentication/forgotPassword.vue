<template>
    <main class="auth-recovery-page">
        <section class="auth-recovery-card" aria-label="ស្ដារពាក្យសម្ងាត់">
            <aside class="auth-recovery-brand" aria-label="ស្លាកសញ្ញាអតីតនិស្សិត">
                <div class="auth-recovery-brand-inner">
                <div class="auth-recovery-logo">
                    <img src="@/assets/Imgage/logo.png" alt="ស្លាកសញ្ញាអតីតនិស្សិត" />
                </div>

                <div class="auth-recovery-brand-copy">
                    <h1>ប្រព័ន្ធអតីតនិស្សិត</h1>
                    <p>ស្ដារការចូលប្រើគណនីអ្នកគ្រប់គ្រងដោយប្រើតំណកំណត់ពាក្យសម្ងាត់ឡើងវិញ។</p>
                </div>

                <div class="auth-security-visual" aria-hidden="true">
                    <div class="auth-security-panel">
                        <span class="auth-security-icon">
                            <i class="bi bi-shield-lock-fill"></i>
                        </span>
                        <span class="auth-security-line auth-security-line--wide"></span>
                        <span class="auth-security-line"></span>
                        <span class="auth-security-line auth-security-line--short"></span>
                    </div>
                    <div class="auth-security-chip auth-security-chip--mail">
                        <i class="bi bi-envelope-check-fill"></i>
                    </div>
                    <div class="auth-security-chip auth-security-chip--key">
                        <i class="bi bi-key-fill"></i>
                    </div>
                    <div class="auth-security-check">
                        <i class="bi bi-check2"></i>
                    </div>
                </div>
                </div>
            </aside>

            <section class="auth-recovery-panel" aria-label="ទម្រង់ស្ដារពាក្យសម្ងាត់">
                <div class="auth-recovery-form" aria-live="polite">
                    <RouterLink class="auth-back-link" :to="{ name: 'login' }">
                        <i class="bi bi-arrow-left" aria-hidden="true"></i>
                        ត្រឡប់ទៅចូលគណនី
                    </RouterLink>

                    <header class="auth-recovery-header">
                        <div class="auth-title-kicker">
                            <span class="auth-title-icon">
                                <i :class="['bi', isResetMode ? 'bi-key-fill' : 'bi-envelope-paper-fill']"
                                    aria-hidden="true"></i>
                            </span>
                            <span class="auth-recovery-step">
                                {{ isResetMode ? "កំណត់ពាក្យសម្ងាត់ឡើងវិញ" : "ភ្លេចពាក្យសម្ងាត់" }}
                            </span>
                        </div>
                        <h2>{{ isResetMode ? "បង្កើតពាក្យសម្ងាត់ថ្មី" : "ស្វែងរកគណនីរបស់អ្នក" }}</h2>
                        <p>
                            {{
                                isResetMode
                                    ? "សូមបញ្ចូលពាក្យសម្ងាត់ថ្មី ដើម្បីបញ្ចប់ការកំណត់ឡើងវិញ។"
                                    : "សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលដែលភ្ជាប់នឹងគណនីអ្នកគ្រប់គ្រងរបស់អ្នក។"
                            }}
                        </p>
                    </header>

                    <div class="auth-mode-tabs" role="tablist" aria-label="ជ្រើសរើសដំណាក់កាល">
                        <button type="button" :class="{ 'is-active': !isResetMode }" role="tab"
                            :aria-selected="!isResetMode" @click="showForgotForm">
                            <i class="bi bi-send" aria-hidden="true"></i>
                            <span>ស្នើតំណ</span>
                        </button>
                        <button type="button" :class="{ 'is-active': isResetMode }" role="tab"
                            :aria-selected="isResetMode" @click="showResetForm()">
                            <i class="bi bi-key" aria-hidden="true"></i>
                            <span>កំណត់ថ្មី</span>
                        </button>
                    </div>

                    <div v-if="notice.text" :class="['auth-alert', `auth-alert--${notice.type}`]" role="status">
                        <i :class="['bi', notice.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle']"
                            aria-hidden="true"></i>
                        <span>{{ notice.text }}</span>
                    </div>

                    <form v-if="!isResetMode" class="auth-form-stack" novalidate @submit.prevent="handleForgotPassword">
                        <div class="auth-field">
                            <label for="email" class="auth-label">អាសយដ្ឋានអ៊ីមែល</label>
                            <div class="auth-input">
                                <i class="bi bi-envelope" aria-hidden="true"></i>
                                <input id="email" v-model="forgotForm.email" type="email" name="email"
                                    :class="{ 'is-invalid': errors.email }" placeholder="admin@alumni.edu"
                                    autocomplete="email" :aria-invalid="!!errors.email" aria-describedby="email-error"
                                    @blur="validateEmail" @input="clearError('email')" />
                            </div>
                            <p v-if="errors.email" id="email-error" class="auth-error">{{ errors.email }}</p>
                        </div>

                        <BaseButton type="submit" variant="primary" shape="rounded" class="w-100 auth-submit" :disabled="loading"
                            :loading="loading">
                            {{ loading ? "កំពុងផ្ញើតំណកំណត់ឡើងវិញ..." : "ផ្ញើតំណកំណត់ឡើងវិញ" }}
                        </BaseButton>

                        <button type="button" class="auth-text-button" @click="showResetForm()">
                            <i class="bi bi-key" aria-hidden="true"></i>
                            <span>ខ្ញុំមានលេខកូដកំណត់ឡើងវិញរួចហើយ</span>
                        </button>
                    </form>

                    <form v-else class="auth-form-stack" novalidate @submit.prevent="handleResetPassword">
                        <div v-if="!hasRouteToken" class="auth-field">
                            <label for="token" class="auth-label">លេខកូដកំណត់ឡើងវិញ</label>
                            <div class="auth-input">
                                <i class="bi bi-key" aria-hidden="true"></i>
                                <input id="token" v-model="resetForm.token" type="text" name="token"
                                    :class="{ 'is-invalid': errors.token }" placeholder="បញ្ចូលលេខកូដកំណត់ឡើងវិញ"
                                    autocomplete="one-time-code" :aria-invalid="!!errors.token"
                                    aria-describedby="token-error" @blur="validateToken" @input="clearError('token')" />
                            </div>
                            <p v-if="errors.token" id="token-error" class="auth-error">{{ errors.token }}</p>
                        </div>

                        <div class="auth-field">
                            <label for="newPassword" class="auth-label">ពាក្យសម្ងាត់ថ្មី</label>
                            <div class="auth-input">
                                <i class="bi bi-lock" aria-hidden="true"></i>
                                <input id="newPassword" v-model="resetForm.newPassword"
                                    :type="showNewPassword ? 'text' : 'password'" name="newPassword"
                                    :class="{ 'is-invalid': errors.newPassword }" placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មី"
                                    autocomplete="new-password" :aria-invalid="!!errors.newPassword"
                                    aria-describedby="new-password-error" @blur="validateNewPassword"
                                    @input="clearError('newPassword')" />
                                <button type="button" class="auth-toggle" :aria-pressed="showNewPassword"
                                    :aria-label="showNewPassword ? 'លាក់ពាក្យសម្ងាត់ថ្មី' : 'បង្ហាញពាក្យសម្ងាត់ថ្មី'"
                                    @click="showNewPassword = !showNewPassword">
                                    <i :class="['bi', showNewPassword ? 'bi-eye-slash' : 'bi-eye']"
                                        aria-hidden="true"></i>
                                </button>
                            </div>
                            <p v-if="errors.newPassword" id="new-password-error" class="auth-error">{{
                                errors.newPassword }}</p>
                        </div>

                        <div class="auth-field">
                            <label for="confirmPassword" class="auth-label">បញ្ជាក់ពាក្យសម្ងាត់</label>
                            <div class="auth-input">
                                <i class="bi bi-shield-lock" aria-hidden="true"></i>
                                <input id="confirmPassword" v-model="resetForm.confirmPassword"
                                    :type="showConfirmPassword ? 'text' : 'password'" name="confirmPassword"
                                    :class="{ 'is-invalid': errors.confirmPassword }"
                                    placeholder="បញ្ចូលពាក្យសម្ងាត់ម្ដងទៀត" autocomplete="new-password"
                                    :aria-invalid="!!errors.confirmPassword" aria-describedby="confirm-password-error"
                                    @blur="validateConfirmPassword" @input="clearError('confirmPassword')" />
                                <button type="button" class="auth-toggle" :aria-pressed="showConfirmPassword"
                                    :aria-label="showConfirmPassword ? 'លាក់ពាក្យសម្ងាត់បញ្ជាក់' : 'បង្ហាញពាក្យសម្ងាត់បញ្ជាក់'"
                                    @click="showConfirmPassword = !showConfirmPassword">
                                    <i :class="['bi', showConfirmPassword ? 'bi-eye-slash' : 'bi-eye']"
                                        aria-hidden="true"></i>
                                </button>
                            </div>
                            <p v-if="errors.confirmPassword" id="confirm-password-error" class="auth-error">
                                {{ errors.confirmPassword }}
                            </p>
                        </div>

                        <BaseButton type="submit" variant="primary" shape="rounded" class="w-100 auth-submit" :disabled="loading"
                            :loading="loading">
                            {{ loading ? "កំពុងកំណត់ពាក្យសម្ងាត់ឡើងវិញ..." : "កំណត់ពាក្យសម្ងាត់ឡើងវិញ" }}
                        </BaseButton>

                        <button type="button" class="auth-text-button" @click="showForgotForm">
                            <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
                            <span>ស្នើសុំតំណកំណត់ឡើងវិញថ្មី</span>
                        </button>
                    </form>
                </div>
            </section>
        </section>
    </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import BaseButton from "@/components/UI/Base/BaseButton.vue";
import { useAuthStore } from "@/stores/useAuth";
import swal from "sweetalert2";
import logger from "@/utils/logger";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const forgotForm = reactive({
    email: "",
});

const resetForm = reactive({
    token: "",
    newPassword: "",
    confirmPassword: "",
});

const errors = reactive({});
const notice = reactive({
    type: "success",
    text: "",
});

const loading = ref(false);
const mode = ref("forgot");
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const routeToken = computed(() => {
    const token = route.params.token || route.query.token;
    return Array.isArray(token) ? token[0] || "" : token || "";
});

const hasRouteToken = computed(() => !!routeToken.value);
const isResetMode = computed(() => mode.value === "reset");

function clearNotice() {
    notice.text = "";
}

function setNotice(type, text) {
    notice.type = type;
    notice.text = text;
}

function clearError(field) {
    if (errors[field]) delete errors[field];
    clearNotice();
}

function clearErrors() {
    Object.keys(errors).forEach((key) => delete errors[key]);
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
    const email = forgotForm.email.trim();
    forgotForm.email = email;

    if (!email) {
        errors.email = "សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែល។";
    } else if (!emailPattern.test(email)) {
        errors.email = "សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលឱ្យបានត្រឹមត្រូវ។";
    } else {
        delete errors.email;
    }

    return !errors.email;
}

function validateToken() {
    resetForm.token = resetForm.token.trim();

    if (!resetForm.token) {
        errors.token = "សូមបញ្ចូលលេខកូដកំណត់ឡើងវិញ។";
    } else {
        delete errors.token;
    }

    return !errors.token;
}

function validateNewPassword() {
    if (!resetForm.newPassword) {
        errors.newPassword = "សូមបញ្ចូលពាក្យសម្ងាត់ថ្មី។";
    } else if (resetForm.newPassword.length < 8) {
        errors.newPassword = "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច 8 តួអក្សរ។";
    } else {
        delete errors.newPassword;
    }

    if (resetForm.confirmPassword) validateConfirmPassword();

    return !errors.newPassword;
}

function validateConfirmPassword() {
    if (!resetForm.confirmPassword) {
        errors.confirmPassword = "សូមបញ្ជាក់ពាក្យសម្ងាត់ថ្មី។";
    } else if (resetForm.confirmPassword !== resetForm.newPassword) {
        errors.confirmPassword = "ពាក្យសម្ងាត់មិនដូចគ្នា។";
    } else {
        delete errors.confirmPassword;
    }

    return !errors.confirmPassword;
}

function validateForgotForm() {
    clearErrors();
    return validateEmail();
}

function validateResetForm() {
    clearErrors();
    const tokenIsValid = hasRouteToken.value || validateToken();
    const passwordIsValid = validateNewPassword();
    const confirmIsValid = validateConfirmPassword();

    return tokenIsValid && passwordIsValid && confirmIsValid;
}

function showResetForm(token = "") {
    clearErrors();
    clearNotice();
    if (token) resetForm.token = token;
    mode.value = "reset";
}

function showForgotForm() {
    clearErrors();
    clearNotice();
    mode.value = "forgot";
}

async function handleForgotPassword() {
    if (!validateForgotForm()) return;

    loading.value = true;

    try {
        const { token } = await authStore.requestPasswordReset(forgotForm.email);

        if (token) {
            showResetForm(token);
            setNotice("success", "បានទទួលលេខកូដកំណត់ឡើងវិញ។ សូមបង្កើតពាក្យសម្ងាត់ថ្មីដើម្បីបន្ត។");
        } else {
            setNotice("success", "ប្រសិនបើអ៊ីមែលនេះមានក្នុងប្រព័ន្ធ តំណកំណត់ពាក្យសម្ងាត់ឡើងវិញត្រូវបានផ្ញើរួចហើយ។");
        }
    } catch (error) {
        logger.error("Forgot password request failed:", {
            status: error.response?.status,
            message: error.message,
        });
        applyServerErrors(error, "មិនអាចផ្ញើតំណកំណត់ពាក្យសម្ងាត់ឡើងវិញបានទេ។");
    } finally {
        loading.value = false;
    }
}

async function handleResetPassword() {
    if (!validateResetForm()) return;

    loading.value = true;

    try {
        await authStore.resetPassword({
            token: hasRouteToken.value ? routeToken.value : resetForm.token,
            newPassword: resetForm.newPassword,
        });

        await swal.fire({
            icon: "success",
            title: "កំណត់ពាក្យសម្ងាត់ឡើងវិញជោគជ័យ",
            text: "ពាក្យសម្ងាត់របស់អ្នកត្រូវបានផ្លាស់ប្ដូរ។ សូមចូលគណនីម្ដងទៀត។",
            timer: 1800,
            showConfirmButton: false,
        });

        router.push({ name: "login" });
    } catch (error) {
        logger.error("Reset password request failed:", {
            status: error.response?.status,
            message: error.message,
        });
        applyServerErrors(error, "មិនអាចកំណត់ពាក្យសម្ងាត់ឡើងវិញបានទេ។");
    } finally {
        loading.value = false;
    }
}

watch(
    routeToken,
    (token) => {
        if (token) {
            resetForm.token = token;
            mode.value = "reset";
        }
    },
    { immediate: true },
);

onMounted(() => {
    if (route.name === "reset-password") mode.value = "reset";
});
</script>

<style scoped>
.auth-recovery-page {
    min-height: 100vh;
    width: 100%;
    display: grid;
    place-items: center;
    padding: clamp(1rem, 3vw, 2.5rem);
    color: #0f172a;
    background:
        linear-gradient(135deg, rgba(33, 100, 119, 0.12) 0%, rgba(245, 158, 11, 0.08) 45%, rgba(15, 118, 110, 0.1) 100%),
        repeating-linear-gradient(90deg, rgba(33, 100, 119, 0.05) 0 1px, transparent 1px 64px),
        repeating-linear-gradient(0deg, rgba(33, 100, 119, 0.04) 0 1px, transparent 1px 64px),
        #f6faf9;
}

.auth-recovery-card {
    width: min(100%, 1060px);
    min-height: 640px;
    display: grid;
    grid-template-columns: minmax(300px, 0.92fr) minmax(360px, 1.08fr);
    overflow: hidden;
    border: 1px solid rgba(148, 163, 184, 0.24);
    border-radius: 30px;
    background: #ffffff;
    box-shadow: 0 30px 80px rgba(15, 23, 42, 0.16);
}

.auth-recovery-brand {
    position: relative;
    display: flex;
    overflow: hidden;
    background: linear-gradient(155deg, #154f5b 0%, #216477 48%, #2f7d74 100%);
    color: #ffffff;
}

.auth-recovery-brand::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
        linear-gradient(90deg, rgba(255, 255, 255, 0.14) 1px, transparent 1px),
        linear-gradient(0deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
    background-size: 44px 44px;
    opacity: 0.18;
}

.auth-recovery-brand::after {
    content: "";
    position: absolute;
    left: -14%;
    right: -14%;
    bottom: 12%;
    height: 150px;
    background: linear-gradient(100deg, transparent 0%, rgba(245, 158, 11, 0.16) 38%, rgba(255, 255, 255, 0.11) 56%, transparent 100%);
    transform: rotate(-8deg);
}

.auth-recovery-brand-inner {
    position: relative;
    z-index: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.7rem;
    padding: clamp(2rem, 4vw, 3.4rem);
    text-align: center;
}

.auth-recovery-logo {
    width: 136px;
    height: 136px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 13px;
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 26px;
    background: #ffffff;
    box-shadow: 0 20px 45px rgba(7, 47, 54, 0.32);
}

.auth-recovery-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 22px;
}

.auth-recovery-brand-copy {
    max-width: 360px;
}

.auth-recovery-brand-copy h1 {
    margin-bottom: 0.8rem;
    color: #ffffff;
    font-size: clamp(1.95rem, 3vw, 2.4rem);
    line-height: 1.25;
    font-weight: 800;
}

.auth-recovery-brand-copy p {
    margin: 0;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.8;
    font-size: 0.98rem;
}

.auth-security-visual {
    position: relative;
    width: min(100%, 310px);
    min-height: 172px;
    margin-top: 0.2rem;
}

.auth-security-panel {
    position: absolute;
    left: 50%;
    top: 16px;
    width: 222px;
    height: 138px;
    display: grid;
    align-content: center;
    gap: 0.65rem;
    padding: 1.25rem;
    border: 1px solid rgba(255, 255, 255, 0.26);
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.14);
    box-shadow: 0 24px 55px rgba(7, 47, 54, 0.3);
    transform: translateX(-50%);
    backdrop-filter: blur(10px);
}

.auth-security-icon {
    width: 48px;
    height: 48px;
    display: inline-grid;
    place-items: center;
    border-radius: 16px;
    background: #fff7ed;
    color: #b45309;
    font-size: 1.25rem;
}

.auth-security-line {
    display: block;
    width: 76%;
    height: 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.32);
}

.auth-security-line--wide {
    width: 100%;
}

.auth-security-line--short {
    width: 54%;
}

.auth-security-chip,
.auth-security-check {
    position: absolute;
    display: inline-grid;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #ffffff;
    box-shadow: 0 16px 30px rgba(7, 47, 54, 0.26);
}

.auth-security-chip {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: rgba(15, 118, 110, 0.88);
    font-size: 1.25rem;
}

.auth-security-chip--mail {
    top: 0;
    right: 10px;
}

.auth-security-chip--key {
    left: 12px;
    bottom: 8px;
    background: rgba(245, 158, 11, 0.88);
}

.auth-security-check {
    right: 42px;
    bottom: 2px;
    width: 34px;
    height: 34px;
    border-radius: 12px;
    background: #16a34a;
    font-size: 1.1rem;
}

.auth-recovery-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(2.2rem, 5vw, 4.2rem);
    background: linear-gradient(180deg, #ffffff 0%, #fbfdfd 100%);
}

.auth-recovery-form {
    width: 100%;
    max-width: 438px;
}

.auth-back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    margin-bottom: 1.6rem;
    color: #216477;
    font-size: 0.9rem;
    font-weight: 700;
    text-decoration: none;
}

.auth-back-link:hover {
    color: #1a4f5d;
    text-decoration: underline;
}

.auth-recovery-header {
    margin-bottom: 1.25rem;
}

.auth-title-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    margin-bottom: 0.75rem;
}

.auth-title-icon {
    width: 2rem;
    height: 2rem;
    display: inline-grid;
    place-items: center;
    border-radius: 10px;
    background: #e8f1f4;
    color: #216477;
    font-size: 0.95rem;
}

.auth-recovery-step {
    color: #216477;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0;
}

.auth-recovery-header h2 {
    margin-bottom: 0.65rem;
    color: #0f172a;
    font-size: clamp(1.75rem, 3vw, 2.2rem);
    line-height: 1.28;
    font-weight: 800;
}

.auth-recovery-header p {
    margin: 0;
    color: #64748b;
    line-height: 1.7;
}

.auth-mode-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem;
    margin-bottom: 1.25rem;
    padding: 0.3rem;
    border: 1px solid #dbeafe;
    border-radius: 16px;
    background: #eef6f8;
}

.auth-mode-tabs button {
    min-width: 0;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    border: 0;
    border-radius: 12px;
    background: transparent;
    color: #48606b;
    font-size: 0.9rem;
    font-weight: 800;
    line-height: 1.35;
    transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.auth-mode-tabs button span {
    min-width: 0;
    overflow-wrap: anywhere;
}

.auth-mode-tabs button:hover,
.auth-mode-tabs button:focus-visible {
    color: #216477;
    outline: none;
}

.auth-mode-tabs button.is-active {
    background: #ffffff;
    color: #216477;
    box-shadow: 0 8px 20px rgba(33, 100, 119, 0.14);
}

.auth-alert {
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

.auth-alert--success {
    background: #ecfdf5;
    border-color: #bbf7d0;
    color: #047857;
}

.auth-alert--error {
    background: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;
}

.auth-form-stack {
    display: grid;
    gap: 1rem;
}

.auth-field {
    margin-bottom: 0;
}

.auth-label {
    display: block;
    margin-bottom: 0.55rem;
    color: #475569;
    font-size: 0.82rem;
    font-weight: 700;
}

.auth-input {
    min-height: 58px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0 1rem;
    border-radius: 15px;
    border: 1px solid #dbe3ea;
    background: #ffffff;
    box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.auth-input:focus-within {
    background: #ffffff;
    border-color: #216477;
    box-shadow: 0 0 0 4px rgba(33, 100, 119, 0.12);
}

.auth-input i {
    color: #94a3b8;
}

.auth-input:has(input.is-invalid) {
    border-color: #dc2626;
}

.auth-input input {
    width: 100%;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: #0f172a;
}

.auth-input input::placeholder {
    color: #94a3b8;
}

.auth-error {
    margin: 0.45rem 0 0;
    color: #dc2626;
    font-size: 0.8rem;
    font-weight: 600;
}

.auth-toggle {
    width: 2rem;
    height: 2rem;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: #216477;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.auth-toggle:hover,
.auth-toggle:focus-visible {
    background: #e8f1f4;
    outline: none;
}

.auth-submit {
    min-height: 52px;
}

.auth-text-button {
    width: 100%;
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    margin-top: 0.25rem;
    border: 0;
    background: transparent;
    color: #216477;
    font-size: 0.9rem;
    font-weight: 700;
    text-decoration: none;
    line-height: 1.45;
}

.auth-text-button:hover,
.auth-text-button:focus-visible {
    color: #1a4f5d;
    text-decoration: underline;
}

@media (max-width: 900px) {
    .auth-recovery-card {
        grid-template-columns: 1fr;
        max-width: 580px;
    }

    .auth-recovery-brand {
        min-height: 390px;
    }

    .auth-recovery-panel {
        padding: 2.4rem;
    }
}

@media (max-width: 520px) {
    .auth-recovery-page {
        padding: 0.75rem;
    }

    .auth-recovery-card {
        min-height: auto;
        border-radius: 22px;
    }

    .auth-recovery-brand {
        min-height: 320px;
    }

    .auth-recovery-brand-inner {
        padding: 2rem 1.3rem;
    }

    .auth-recovery-panel {
        padding: 2rem 1.15rem;
    }

    .auth-recovery-logo {
        width: 106px;
        height: 106px;
        border-radius: 22px;
    }

    .auth-security-visual {
        min-height: 132px;
    }

    .auth-security-panel {
        width: 190px;
        height: 112px;
        border-radius: 18px;
    }

    .auth-security-chip {
        width: 44px;
        height: 44px;
        border-radius: 14px;
    }

    .auth-recovery-brand-copy h1,
    .auth-recovery-header h2 {
        font-size: 1.8rem;
    }

    .auth-mode-tabs button {
        min-height: 42px;
        font-size: 0.84rem;
    }
}
</style>
