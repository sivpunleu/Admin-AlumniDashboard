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

                    <Transition name="auth-alert-slide">
                        <div v-if="notice.text" :class="['auth-alert', `auth-alert--${notice.type}`]" role="status">
                        <i :class="['bi', notice.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle']"
                            aria-hidden="true"></i>
                            <span>{{ notice.text }}</span>
                        </div>
                    </Transition>

                    <Transition name="auth-form-swap" mode="out-in">
                    <form v-if="!isResetMode" key="forgot" class="auth-form-stack" novalidate @submit.prevent="handleForgotPassword">
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

                    <form v-else key="reset" class="auth-form-stack" novalidate @submit.prevent="handleResetPassword">
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
                    </Transition>
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
            setNotice("success", "ប្រសិនបើអ៊ីមែលនេះមានក្នុងប្រព័ន្ធ តំណកំណត់ពាក្យសម្ងាត់ឡើងវិញត្រូវបានផ្ញើរួចហើយ សូមឆែតមើលក្នុង Gmail។");
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
    position: relative;
    isolation: isolate;
    min-height: 100vh;
    width: 100%;
    display: grid;
    place-items: center;
    overflow: hidden;
    padding: clamp(1rem, 3vw, 2.5rem);
    color: #0f172a;
    background:
        linear-gradient(135deg, rgba(33, 100, 119, 0.12) 0%, rgba(245, 158, 11, 0.08) 45%, rgba(15, 118, 110, 0.1) 100%),
        repeating-linear-gradient(90deg, rgba(33, 100, 119, 0.05) 0 1px, transparent 1px 64px),
        repeating-linear-gradient(0deg, rgba(33, 100, 119, 0.04) 0 1px, transparent 1px 64px),
        #f6faf9;
    animation: authBackdropShift 18s ease-in-out infinite alternate;
}

.auth-recovery-page::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, 0.38) 44%, transparent 58%);
    transform: translateX(-70%);
    animation: authPageSweep 9s ease-in-out infinite;
}

.auth-recovery-card {
    position: relative;
    z-index: 1;
    width: min(100%, 1060px);
    min-height: 640px;
    display: grid;
    grid-template-columns: minmax(300px, 0.92fr) minmax(360px, 1.08fr);
    overflow: hidden;
    border: 1px solid rgba(148, 163, 184, 0.24);
    border-radius: 30px;
    background: #ffffff;
    box-shadow: 0 30px 80px rgba(15, 23, 42, 0.16);
    animation: authCardEnter 0.72s cubic-bezier(0.16, 1, 0.3, 1) both;
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
    animation: authGridDrift 22s linear infinite;
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
    animation: authRibbonGlow 6.5s ease-in-out infinite alternate;
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
    animation: authLogoFloat 5.8s ease-in-out infinite;
    transition: box-shadow 0.25s ease, transform 0.25s ease;
    will-change: transform;
}

.auth-recovery-logo:hover {
    box-shadow: 0 24px 54px rgba(7, 47, 54, 0.38);
    transform: translateY(-3px) scale(1.02);
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
    animation: authFadeRise 0.64s ease both 0.2s;
}

.auth-recovery-brand-copy p {
    margin: 0;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.8;
    font-size: 0.98rem;
    animation: authFadeRise 0.64s ease both 0.3s;
}

.auth-security-visual {
    position: relative;
    width: min(100%, 310px);
    min-height: 172px;
    margin-top: 0.2rem;
    animation: authFadeRise 0.7s ease both 0.42s;
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
    overflow: hidden;
    animation: authPanelFloat 6s ease-in-out infinite;
    will-change: transform;
}

.auth-security-panel::after {
    content: "";
    position: absolute;
    left: 1rem;
    right: 1rem;
    top: 0.75rem;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.82), transparent);
    opacity: 0.72;
    animation: authScanLine 3.2s ease-in-out infinite;
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
    animation: authIconGlow 3.4s ease-in-out infinite;
}

.auth-security-line {
    position: relative;
    overflow: hidden;
    display: block;
    width: 76%;
    height: 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.32);
}

.auth-security-line::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.54), transparent);
    transform: translateX(-110%);
    animation: authLineShimmer 2.9s ease-in-out infinite;
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
    animation: authChipMail 5.2s ease-in-out infinite;
}

.auth-security-chip--key {
    left: 12px;
    bottom: 8px;
    background: rgba(245, 158, 11, 0.88);
    animation: authChipKey 5.6s ease-in-out infinite;
}

.auth-security-check {
    right: 42px;
    bottom: 2px;
    width: 34px;
    height: 34px;
    border-radius: 12px;
    background: #16a34a;
    font-size: 1.1rem;
    animation: authCheckPulse 2.4s ease-in-out infinite;
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
    animation: authFadeRise 0.68s ease both 0.18s;
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
    transition: color 0.2s ease, transform 0.2s ease;
}

.auth-back-link:hover {
    color: #1a4f5d;
    text-decoration: underline;
    transform: translateX(-3px);
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
    animation: authTitleIconPulse 3.8s ease-in-out infinite;
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
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem;
    margin-bottom: 1.25rem;
    padding: 0.3rem;
    border: 1px solid #dbeafe;
    border-radius: 16px;
    background: #eef6f8;
    animation: authFadeRise 0.62s ease both 0.28s;
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
    transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.auth-mode-tabs button span {
    min-width: 0;
    overflow-wrap: anywhere;
}

.auth-mode-tabs button:hover,
.auth-mode-tabs button:focus-visible {
    color: #216477;
    transform: translateY(-1px);
    outline: none;
}

.auth-mode-tabs button.is-active {
    background: #ffffff;
    color: #216477;
    box-shadow: 0 8px 20px rgba(33, 100, 119, 0.14);
    animation: authTabPop 0.26s ease both;
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
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
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

.auth-form-stack > * {
    animation: authFieldIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.auth-form-stack > *:nth-child(1) {
    animation-delay: 0.04s;
}

.auth-form-stack > *:nth-child(2) {
    animation-delay: 0.1s;
}

.auth-form-stack > *:nth-child(3) {
    animation-delay: 0.16s;
}

.auth-form-stack > *:nth-child(4) {
    animation-delay: 0.22s;
}

.auth-form-stack > *:nth-child(5) {
    animation-delay: 0.28s;
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
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.auth-input:hover {
    border-color: #b9c9d2;
    transform: translateY(-1px);
}

.auth-input:focus-within {
    background: #ffffff;
    border-color: #216477;
    box-shadow: 0 0 0 4px rgba(33, 100, 119, 0.12);
    transform: translateY(-1px);
}

.auth-input i {
    color: #94a3b8;
    transition: color 0.2s ease, transform 0.2s ease;
}

.auth-input:focus-within i {
    color: #216477;
    transform: scale(1.08);
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
    transition: background-color 0.2s ease, transform 0.2s ease;
}

.auth-toggle:hover,
.auth-toggle:focus-visible {
    background: #e8f1f4;
    transform: rotate(-6deg) scale(1.04);
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
    transition: color 0.2s ease, transform 0.2s ease;
}

.auth-text-button i {
    transition: transform 0.2s ease;
}

.auth-text-button:hover,
.auth-text-button:focus-visible {
    color: #1a4f5d;
    text-decoration: underline;
    transform: translateY(-1px);
}

.auth-text-button:hover i,
.auth-text-button:focus-visible i {
    transform: translateX(2px);
}

.auth-alert-slide-enter-active,
.auth-alert-slide-leave-active {
    overflow: hidden;
    transition: opacity 0.24s ease, transform 0.24s ease, max-height 0.24s ease, margin-bottom 0.24s ease;
}

.auth-alert-slide-enter-from,
.auth-alert-slide-leave-to {
    max-height: 0;
    margin-bottom: 0;
    opacity: 0;
    transform: translateY(-8px);
}

.auth-alert-slide-enter-to,
.auth-alert-slide-leave-from {
    max-height: 160px;
    opacity: 1;
    transform: translateY(0);
}

.auth-form-swap-enter-active,
.auth-form-swap-leave-active {
    transition: opacity 0.28s ease, transform 0.28s ease;
}

.auth-form-swap-enter-from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
}

.auth-form-swap-leave-to {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
}

@keyframes authBackdropShift {
    from {
        background-position: 0 0, 0 0, 0 0, 0 0;
    }

    to {
        background-position: 0 0, 32px 0, 0 32px, 0 0;
    }
}

@keyframes authPageSweep {
    0%,
    24% {
        transform: translateX(-72%);
        opacity: 0;
    }

    45% {
        opacity: 0.72;
    }

    72%,
    100% {
        transform: translateX(72%);
        opacity: 0;
    }
}

@keyframes authCardEnter {
    from {
        opacity: 0;
        transform: translateY(22px) scale(0.985);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes authGridDrift {
    from {
        background-position: 0 0, 0 0;
    }

    to {
        background-position: 44px 22px, -22px 44px;
    }
}

@keyframes authRibbonGlow {
    from {
        opacity: 0.74;
        transform: translateX(-8px) rotate(-8deg);
    }

    to {
        opacity: 1;
        transform: translateX(8px) rotate(-8deg);
    }
}

@keyframes authLogoFloat {
    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-8px);
    }
}

@keyframes authFadeRise {
    from {
        opacity: 0;
        transform: translateY(14px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes authPanelFloat {
    0%,
    100% {
        transform: translateX(-50%) translateY(0) rotate(0deg);
    }

    50% {
        transform: translateX(-50%) translateY(-7px) rotate(-1deg);
    }
}

@keyframes authScanLine {
    0%,
    100% {
        transform: translateY(0);
        opacity: 0;
    }

    42% {
        opacity: 0.8;
    }

    70% {
        transform: translateY(104px);
        opacity: 0;
    }
}

@keyframes authIconGlow {
    0%,
    100% {
        box-shadow: 0 0 0 rgba(245, 158, 11, 0);
        transform: scale(1);
    }

    50% {
        box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.14);
        transform: scale(1.04);
    }
}

@keyframes authLineShimmer {
    0%,
    30% {
        transform: translateX(-110%);
    }

    70%,
    100% {
        transform: translateX(110%);
    }
}

@keyframes authChipMail {
    0%,
    100% {
        transform: translateY(0) rotate(0deg);
    }

    50% {
        transform: translateY(8px) rotate(4deg);
    }
}

@keyframes authChipKey {
    0%,
    100% {
        transform: translateY(0) rotate(0deg);
    }

    50% {
        transform: translateY(-7px) rotate(-5deg);
    }
}

@keyframes authCheckPulse {
    0%,
    100% {
        box-shadow: 0 16px 30px rgba(7, 47, 54, 0.26), 0 0 0 rgba(22, 163, 74, 0);
        transform: scale(1);
    }

    50% {
        box-shadow: 0 16px 30px rgba(7, 47, 54, 0.26), 0 0 0 9px rgba(22, 163, 74, 0.18);
        transform: scale(1.06);
    }
}

@keyframes authTitleIconPulse {
    0%,
    100% {
        box-shadow: 0 0 0 rgba(33, 100, 119, 0);
    }

    50% {
        box-shadow: 0 0 0 7px rgba(33, 100, 119, 0.1);
    }
}

@keyframes authTabPop {
    from {
        transform: scale(0.98);
    }

    to {
        transform: scale(1);
    }
}

@keyframes authFieldIn {
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
