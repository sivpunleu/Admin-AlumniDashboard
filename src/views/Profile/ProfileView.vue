<template>
    <div class="profile-page pb-5">
        <div class="profile-banner"></div>

        <div class="container position-relative mt-n5">
            <div class="row g-4 justify-content-center">
                <div class="col-12 col-lg-4">
                    <div class="card border-0 shadow-sm rounded-4 text-center p-4 h-100 overflow-hidden">
                        <div class="card-body">
                            <Transition name="profile-content-swap" mode="out-in">
                                <div v-if="isInitialLoading" key="summary-loading" class="profile-summary-skeleton" aria-busy="true" aria-live="polite"
                                    aria-label="កំពុងផ្ទុកព័ត៌មានគណនី">
                                    <span class="skeleton-placeholder skeleton-profile-avatar"></span>
                                    <span class="skeleton-placeholder skeleton-line skeleton-line--profile-name"></span>
                                    <span class="skeleton-placeholder skeleton-line skeleton-line--profile-job"></span>
                                    <div class="skeleton-profile-meta row g-2 text-center border-top pt-4">
                                        <div class="col-6 border-end">
                                            <span class="skeleton-placeholder skeleton-line skeleton-line--meta-value"></span>
                                            <span class="skeleton-placeholder skeleton-line skeleton-line--meta-label"></span>
                                        </div>
                                        <div class="col-6">
                                            <span class="skeleton-placeholder skeleton-line skeleton-line--meta-value"></span>
                                            <span class="skeleton-placeholder skeleton-line skeleton-line--meta-label"></span>
                                        </div>
                                    </div>
                                </div>


                                <div v-else key="summary-content" class="profile-summary-content">
                                <div class="avatar-edit-container mb-4">
                                    <div class="position-relative d-inline-block">
                                        <div class="avatar-ring">
                                            <img :src="avatarUrl" alt="profile" class="profile-img-lg shadow"
                                                @error="handleAvatarError" @load="handleAvatarLoad" />
                                        </div>
                                        <div class="avatar-actions">
                                            <BaseButton variant="primary" shape="sharp" size="sm"
                                                class="btn-action-avatar upload" @click="triggerAvatarPicker"
                                                title="Upload avatar">
                                                <i class="bi bi-camera-fill"></i>
                                            </BaseButton>
                                            <BaseButton v-if="currentUser?.profile?.avatar" variant="danger" shape="sharp"
                                                size="sm" class="btn-action-avatar delete" @click="handleDeleteAvatar"
                                                title="Delete avatar">
                                                <i class="bi bi-trash-fill"></i>
                                            </BaseButton>
                                        </div>
                                    </div>
                                </div>

                                <h4 class="fw-bold text-dark mb-1">{{ displayName }}</h4>
                                <p class="text-muted small mb-4">{{ form.currentJob || 'សមាជិកអតីតនិស្សិត' }}</p>

                                <div class="row g-2 text-center border-top pt-4">
                                    <div class="col-6 border-end">
                                        <small class="text-muted extra-small">ជំនាន់</small>
                                        <h6 class="fw-bold mb-0 text-primary">{{ currentUser?.profile?.generation?.name ||
                                            'N/A' }}</h6>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-muted extra-small">ដេប៉ាតឺម៉ង</small>
                                        <h6 class="fw-bold mb-0 text-primary  px-2">{{
                                            currentUser?.profile?.department?.name || 'N/A' }}</h6>
                                    </div>
                                </div>
                                </div>
                            </Transition>
                        </div>
                        <input ref="avatarInput" type="file" accept="image/*" class="d-none"
                            @change="onAvatarSelected" />
                    </div>
                </div>

                <div class="col-12 col-lg-8">
                    <div class="card border-0 shadow-sm rounded-4 h-100">
                        <div
                            class="card-header bg-white border-0 pt-4 px-4 px-md-5 d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <div class="icon-box-primary me-3"><i class="bi bi-person-badge"></i></div>
                                <h5 class="fw-bold mb-0">ព័ត៌មានផ្ទាល់ខ្លួន</h5>
                            </div>
                            <BaseButton v-if="!isInitialLoading && !isEditing" @click="toggleEdit(true)" variant="light" size="sm">
                                <i class="bi bi-pencil-square me-2"></i>កែសម្រួល
                            </BaseButton>
                        </div>

                        <div class="card-body p-4 p-md-5">
                            <Transition name="profile-content-swap" mode="out-in">
                            <div v-if="isInitialLoading" key="form-loading" class="profile-form-skeleton" aria-busy="true"
                                aria-live="polite" aria-label="កំពុងផ្ទុកទម្រង់ព័ត៌មានផ្ទាល់ខ្លួន">
                                <div class="row g-4">
                                    <div v-for="item in formSkeletonItems" :key="item" class="col-md-6">
                                        <span class="skeleton-placeholder skeleton-line skeleton-line--label"></span>
                                        <span class="skeleton-placeholder skeleton-input"></span>
                                    </div>
                                    <div class="col-12">
                                        <span class="skeleton-placeholder skeleton-line skeleton-line--label"></span>
                                        <span class="skeleton-placeholder skeleton-input"></span>
                                    </div>
                                    <div class="col-12">
                                        <span class="skeleton-placeholder skeleton-line skeleton-line--label"></span>
                                        <span class="skeleton-placeholder skeleton-textarea"></span>
                                    </div>
                                </div>
                            </div>

                            <form v-else key="profile-form" @submit.prevent="handleUpdateProfile">
                                <div class="row g-4">
                                    <div class="col-md-6">
                                        <label class="form-label label-custom">នាមខ្លួនពេញ</label>
                                        <input v-model="form.fullname" type="text" :disabled="!isEditing"
                                            class="form-control custom-input"
                                            :class="{ 'input-active': isEditing, 'is-invalid': errors.fullname }"
                                            :maxlength="FULLNAME_MAX_LENGTH"
                                            @input="errors.fullname = ''">
                                        <div v-if="errors.fullname" class="invalid-feedback">{{ errors.fullname }}</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label label-custom">លេខទូរស័ព្ទ</label>
                                        <input v-model="form.phone" type="tel" :disabled="!isEditing"
                                            class="form-control custom-input"
                                            :class="{ 'input-active': isEditing, 'is-invalid': errors.phone }"
                                            @input="errors.phone = ''">
                                        <div v-if="errors.phone" class="invalid-feedback">{{ errors.phone }}</div>
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label label-custom">ការងារបច្ចុប្បន្ន</label>
                                        <input v-model="form.currentJob" type="text" :disabled="!isEditing"
                                            class="form-control custom-input"
                                            :class="{ 'input-active': isEditing, 'is-invalid': errors.currentJob }"
                                            :maxlength="CURRENT_JOB_MAX_LENGTH"
                                            @input="errors.currentJob = ''">
                                        <div v-if="errors.currentJob" class="invalid-feedback">{{ errors.currentJob }}</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label label-custom">ជំនាន់</label>
                                        <select v-model="form.generationId" :disabled="!isEditing"
                                            class="form-select custom-input"
                                            :class="{ 'input-active': isEditing, 'is-invalid': errors.generationId }"
                                            @change="errors.generationId = ''; errors.departmentId = ''">
                                            <option value="">ជ្រើសរើសជំនាន់</option>
                                            <option v-for="generation in generationOptions" :key="generation.id"
                                                :value="generation.id">
                                                {{ generation.name }}
                                            </option>
                                        </select>
                                        <div v-if="errors.generationId" class="invalid-feedback">{{ errors.generationId }}</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label label-custom">ដេប៉ាតឺម៉ង</label>
                                        <select v-model="form.departmentId" :disabled="!isEditing || !form.generationId"
                                            class="form-select custom-input"
                                            :class="{ 'input-active': isEditing && form.generationId, 'is-invalid': errors.departmentId }"
                                            @change="errors.departmentId = ''">
                                            <option value="">
                                                {{ form.generationId ? 'ជ្រើសរើសដេប៉ាតឺម៉ង' : 'ជ្រើសរើសជំនាន់ជាមុន' }}
                                            </option>
                                            <option v-for="department in filteredDepartments" :key="department.id"
                                                :value="department.id">
                                                {{ department.name }}
                                            </option>
                                        </select>
                                        <div v-if="errors.departmentId" class="invalid-feedback">{{ errors.departmentId }}</div>
                                    </div>

                                    <div class="col-12">
                                        <label class="form-label label-custom">ជីវប្រវត្តិ</label>
                                        <textarea v-model="form.bio" :disabled="!isEditing"
                                            class="form-control custom-input" rows="4"
                                            :class="{ 'input-active': isEditing, 'is-invalid': errors.bio }"
                                            :maxlength="BIO_MAX_LENGTH"
                                            @input="errors.bio = ''"></textarea>
                                        <div v-if="errors.bio" class="invalid-feedback">{{ errors.bio }}</div>
                                    </div>
                                </div>

                                <div v-if="isEditing" class="d-flex justify-content-end gap-2 mt-5 pt-3 border-top">
                                    <BaseButton type="button" variant="light" @click="toggleEdit(false)">បោះបង់
                                    </BaseButton>
                                    <BaseButton type="submit" variant="primary" :loading="profileStore.loading">រក្សាទុក
                                    </BaseButton>
                                </div>
                            </form>
                            </Transition>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <Transition name="profile-modal-fade">
            <div v-if="showCropperModal" class="cropper-overlay" @click.self="closeCropperModal">
                <div class="cropper-card bg-white rounded-4 shadow-lg p-4">
                    <h5 class="fw-bold mb-3">កាត់តម្រូវរូបភាព</h5>
                    <div class="cropper-wrapper mb-xl-3 mb-4">
                        <img ref="cropperImgRef" :src="rawImageSrc" class="mw-100 d-block" />
                    </div>
                    <div class="cropper-actions d-flex justify-content-end gap-2">
                        <BaseButton variant="light" @click="closeCropperModal">បោះបង់</BaseButton>
                        <BaseButton variant="primary" @click="confirmCrop" :loading="cropUploading">រក្សាទុករូបភាព
                        </BaseButton>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import { useDepartmentStore } from '@/stores/departmentStore';
import * as generationStore from '@/stores/generationStore';
import { useProfileStore } from '@/stores/useProfile';
import BaseButton from '@/components/UI/Base/BaseButton.vue';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import Swal from 'sweetalert2';
import logger from '@/utils/logger';

const profileStore = useProfileStore();
const departmentStore = useDepartmentStore();
const avatarInput = ref(null);
const isEditing = ref(false);
const isInitialLoading = ref(true);
const formSkeletonItems = Array.from({ length: 4 }, (_, index) => index);

const form = reactive({
    fullname: '',
    phone: '',
    currentJob: '',
    bio: '',
    email: '',
    departmentId: '',
    generationId: '',
});

const errors = reactive({
    fullname: '',
    phone: '',
    currentJob: '',
    bio: '',
    generationId: '',
    departmentId: '',
});

const generationOptions = computed(() => generationStore.generations.value || []);
const FULLNAME_MAX_LENGTH = 50;
const CURRENT_JOB_MAX_LENGTH = 100;
const BIO_MAX_LENGTH = 500;
const PHONE_MIN_DIGITS = 7;
const PHONE_MAX_DIGITS = 10;
const PHONE_MAX_DIGITS_LABEL = "១០";
const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]*$/;

const normalizeId = (value) => {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
};

const getPhoneError = (value) => {
    const phone = String(value || "").trim();
    if (!phone) return "";

    const digitCount = phone.replace(/\D/g, "").length;
    if (digitCount > PHONE_MAX_DIGITS) {
        return `លេខទូរសព្ទមិនត្រូវលើសពី${PHONE_MAX_DIGITS_LABEL}លេខ`;
    }

    if (!PHONE_PATTERN.test(phone) || digitCount < PHONE_MIN_DIGITS) {
        return 'លេខទូរស័ព្ទមិនត្រឹមត្រូវ';
    }

    return "";
};

const clearErrors = () => {
    Object.keys(errors).forEach((key) => {
        errors[key] = '';
    });
};

const readFirstError = (value) => {
    if (Array.isArray(value)) return value.map(readFirstError).find(Boolean);
    if (value && typeof value === 'object') {
        return Object.values(value).map(readFirstError).find(Boolean);
    }
    return value;
};

const applyProfileStoreErrors = () => {
    Object.entries(profileStore.errors || {}).forEach(([field, value]) => {
        if (!Object.prototype.hasOwnProperty.call(errors, field)) return;

        errors[field] = String(readFirstError(value) || '');
    });
};

const getGenerationDepartmentId = (generation) => normalizeId(
    generation?.departmentId ??
    generation?.department_id ??
    generation?.department?.id,
);

const filteredDepartments = computed(() => {
    const selectedGenerationId = normalizeId(form.generationId);

    if (!selectedGenerationId) {
        return [];
    }

    const generation = generationOptions.value.find(
        (item) => normalizeId(item.id) === selectedGenerationId,
    );

    const departmentId = getGenerationDepartmentId(generation);

    if (!departmentId) {
        return departmentStore.departments || [];
    }

    const matchedDepartments = (departmentStore.departments || []).filter(
        (department) => normalizeId(department.id) === departmentId,
    );

    if (matchedDepartments.length) {
        return matchedDepartments;
    }

    return generation?.department ? [generation.department] : [];
});

const syncDepartmentWithGeneration = () => {
    const departments = filteredDepartments.value;

    if (!form.generationId) {
        form.departmentId = "";
        return;
    }

    const selectedDepartmentId = normalizeId(form.departmentId);
    const selectedDepartmentExists = departments.some(
        (department) => normalizeId(department.id) === selectedDepartmentId,
    );

    if (!selectedDepartmentExists) {
        form.departmentId = departments.length === 1 ? departments[0].id : "";
    }
};

// Cropper State
const showCropperModal = ref(false);
const rawImageSrc = ref("");
const cropperImgRef = ref(null);
const cropperInstance = ref(null);
const cropUploading = ref(false);

const currentUser = computed(() => profileStore.profile || {});
const profileRole = computed(() => String(
    currentUser.value?.role?.name ||
    currentUser.value?.role ||
    currentUser.value?.profile?.role?.name ||
    currentUser.value?.profile?.role ||
    '',
).toLowerCase());
const requiresAcademicInfo = computed(() => {
    if (profileRole.value.includes('admin')) return false;

    return profileRole.value.includes('alumni') ||
        profileRole.value.includes('user') ||
        Boolean(currentUser.value?.profile?.generation || currentUser.value?.profile?.department);
});
const displayName = computed(() => currentUser.value?.profile?.fullname || 'User');
const avatarUrl = computed(() => currentUser.value?.profile?.avatar || 'https://ui-avatars.com/api/?name=' + displayName.value);

onMounted(async () => {
    try {
        const profileData = await profileStore.fetchProfile();
        await Promise.all([
            departmentStore.fetchDepartments(),
            generationStore.fetchGenerations(),
        ]);

        const sourceProfile = profileData?.profile || profileData || {};
        Object.assign(form, {
            fullname: sourceProfile.fullname,
            phone: sourceProfile.phone,
            currentJob: sourceProfile.currentJob,
            bio: sourceProfile.bio,
            email: profileData?.email || sourceProfile.email || "",
            departmentId: sourceProfile.department?.id || sourceProfile.departmentId || "",
            generationId: sourceProfile.generation?.id || sourceProfile.generationId || "",
        });
        syncDepartmentWithGeneration();
    } finally {
        isInitialLoading.value = false;
    }
});

watch(
    () => form.generationId,
    () => {
        errors.generationId = '';
        errors.departmentId = '';
        syncDepartmentWithGeneration();
    },
);

watch(filteredDepartments, () => {
    syncDepartmentWithGeneration();
});

const toggleEdit = (val) => {
    isEditing.value = val;
    if (!val) clearErrors();
};
const triggerAvatarPicker = () => avatarInput.value.click();

const onAvatarSelected = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        rawImageSrc.value = event.target.result;
        showCropperModal.value = true;
        nextTick(() => {
            if (cropperInstance.value) {
                cropperInstance.value.destroy();
                cropperInstance.value = null;
            }
            cropperInstance.value = new Cropper(cropperImgRef.value, {
                aspectRatio: 1,
                viewMode: 1,
                autoCropArea: 0.9,
                background: false,
                responsive: true,
                movable: true,
                zoomable: true,
                cropBoxMovable: true,
                cropBoxResizable: true,
            });
        });
    };
    reader.readAsDataURL(file);
};

const confirmCrop = async () => {
    if (!cropperInstance.value) return;

    cropUploading.value = true;
    try {
        const outputCanvas = cropperInstance.value.getCroppedCanvas({
            width: 512,
            height: 512,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });

        if (!outputCanvas) throw new Error('Failed to generate cropped image');

        const blob = await new Promise((resolve) => {
            outputCanvas.toBlob((result) => resolve(result), 'image/jpeg', 0.92);
        });

        if (!blob) throw new Error('Failed to generate cropped image');

        await profileStore.uploadAvatar(blob); // បញ្ជូន Blob ទៅកាន់ Store ផ្ទាល់
        closeCropperModal();
    } catch (error) {
        logger.error(error);
        Swal.fire('កំហុស', 'មិនអាចកាត់តរូបភាពបានទេ', 'error');
    } finally {
        cropUploading.value = false;
    }
};

const closeCropperModal = () => {
    showCropperModal.value = false;
    rawImageSrc.value = '';

    if (cropperInstance.value) {
        cropperInstance.value.destroy();
        cropperInstance.value = null;
    }

    if (avatarInput.value) {
        avatarInput.value.value = '';
    }
};

const handleAvatarError = () => { };

const handleAvatarLoad = () => { };

const validateProfileForm = () => {
    clearErrors();

    form.fullname = form.fullname?.trim() || '';
    form.phone = form.phone?.trim() || '';
    form.currentJob = form.currentJob?.trim() || '';
    form.bio = form.bio?.trim() || '';

    const generationId = normalizeId(form.generationId);
    const departmentId = normalizeId(form.departmentId);
    const generationExists = generationOptions.value.some(
        (generation) => normalizeId(generation.id) === generationId,
    );
    const departmentExists = filteredDepartments.value.some(
        (department) => normalizeId(department.id) === departmentId,
    );

    if (!form.fullname) {
        errors.fullname = 'សូមបញ្ចូលឈ្មោះពេញលេញ';
    } else if (form.fullname.length > FULLNAME_MAX_LENGTH) {
        errors.fullname = `ឈ្មោះពេញមិនអាចលើស ${FULLNAME_MAX_LENGTH} តួអក្សរបានទេ`;
    }

    const phoneError = getPhoneError(form.phone);
    if (phoneError) {
        errors.phone = phoneError;
    }

    if (form.currentJob.length > CURRENT_JOB_MAX_LENGTH) {
        errors.currentJob = `ការងារបច្ចុប្បន្នមិនអាចលើស ${CURRENT_JOB_MAX_LENGTH} តួអក្សរបានទេ`;
    }

    if (form.bio.length > BIO_MAX_LENGTH) {
        errors.bio = `ជីវប្រវត្តិមិនអាចលើស ${BIO_MAX_LENGTH} តួអក្សរបានទេ`;
    }

    if (requiresAcademicInfo.value && !generationId) {
        errors.generationId = 'សូមជ្រើសរើសជំនាន់';
    } else if (generationId && generationOptions.value.length > 0 && !generationExists) {
        errors.generationId = 'ជំនាន់ដែលបានជ្រើសរើសមិនត្រឹមត្រូវ';
    }

    if (requiresAcademicInfo.value && !departmentId) {
        errors.departmentId = 'សូមជ្រើសរើសដេប៉ាតឺម៉ង់';
    } else if (departmentId && filteredDepartments.value.length > 0 && !departmentExists) {
        errors.departmentId = 'ដេប៉ាតឺម៉ង់ដែលបានជ្រើសរើសមិនត្រឹមត្រូវ';
    }

    return !Object.values(errors).some(Boolean);
};

const handleUpdateProfile = async () => {
    if (!validateProfileForm()) return;

    try {
        await profileStore.updateProfile({
            fullname: form.fullname,
            phone: form.phone,
            bio: form.bio,
            currentJob: form.currentJob,
            departmentId: form.departmentId ? Number(form.departmentId) : null,
            generationId: form.generationId ? Number(form.generationId) : null,
        });
        isEditing.value = false;
    } catch (error) {
        applyProfileStoreErrors();
        logger.error("Profile update failed:", error);
    }
};


const handleDeleteAvatar = () => profileStore.deleteAvatar();
</script>

<style scoped>
.profile-page {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    background-color: #f8fafc;
    color: #0f172a;
}

.profile-page::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
        linear-gradient(115deg, transparent 0%, rgba(33, 100, 119, 0.08) 42%, transparent 58%),
        repeating-linear-gradient(90deg, rgba(33, 100, 119, 0.035) 0 1px, transparent 1px 68px);
    opacity: 0;
    transform: translateX(-72%);
    animation: profilePageSweep 9s ease-in-out infinite;
}

.profile-page > * {
    position: relative;
    z-index: 1;
}

.profile-banner {
    position: relative;
    overflow: hidden;
    height: 130px;
    background: linear-gradient(135deg, #216477 0%, #154552 100%);
}

.profile-banner::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
        linear-gradient(90deg, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
        linear-gradient(0deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
    background-size: 46px 46px;
    opacity: 0.2;
    animation: profileGridDrift 22s linear infinite;
}

.profile-banner::after {
    content: "";
    position: absolute;
    left: -12%;
    right: -12%;
    bottom: 22px;
    height: 84px;
    background: linear-gradient(100deg, transparent 0%, rgba(245, 158, 11, 0.14) 38%, rgba(255, 255, 255, 0.1) 56%, transparent 100%);
    transform: rotate(-4deg);
    animation: profileRibbonGlow 6.5s ease-in-out infinite alternate;
}

.mt-n5 {
    margin-top: -90px !important;
}

.profile-page .container > .row > [class*="col-"] {
    animation: profileCardIn 0.58s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.profile-page .container > .row > [class*="col-"]:nth-child(2) {
    animation-delay: 0.08s;
}

.profile-page .card {
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(226, 232, 240, 0.8) !important;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.profile-page .card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 1.25rem;
    right: 1.25rem;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(33, 100, 119, 0.42), transparent);
    opacity: 0;
    transform: translateX(-35%);
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.profile-page .card:hover {
    border-color: #c6d8de !important;
    box-shadow: 0 18px 42px rgba(15, 23, 42, 0.09) !important;
    transform: translateY(-2px);
}

.profile-page .card:hover::before {
    opacity: 1;
    transform: translateX(0);
}

.avatar-ring {
    position: relative;
    padding: 6px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    display: inline-block;
    animation: profileAvatarFloat 5.8s ease-in-out infinite;
    transition: box-shadow 0.25s ease, transform 0.25s ease;
}

.avatar-ring::before {
    content: "";
    position: absolute;
    inset: -8px;
    border: 1px solid rgba(33, 100, 119, 0.2);
    border-radius: 50%;
    animation: profileAvatarRingPulse 4.8s ease-in-out infinite;
}

.avatar-ring:hover {
    box-shadow: 0 16px 34px rgba(15, 23, 42, 0.16);
    transform: translateY(-3px) scale(1.02);
}

.profile-img-lg {
    position: relative;
    z-index: 1;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    object-fit: cover;
}

.profile-summary-skeleton {
    display: grid;
    justify-items: center;
    gap: 0.75rem;
}

.profile-summary-content {
    animation: profileFadeRise 0.46s ease both;
}

.profile-summary-content h4,
.profile-summary-content p,
.profile-summary-content .row {
    animation: profileFieldIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.profile-summary-content p {
    animation-delay: 0.06s;
}

.profile-summary-content .row {
    animation-delay: 0.12s;
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

.skeleton-profile-avatar {
    width: 162px;
    height: 162px;
    margin-bottom: 0.75rem;
    border: 6px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.skeleton-line {
    height: 12px;
}

.skeleton-line--profile-name {
    width: 150px;
    height: 22px;
    border-radius: 8px;
}

.skeleton-line--profile-job {
    width: 180px;
    height: 12px;
    margin-bottom: 1.5rem;
}

.skeleton-profile-meta {
    width: 100%;
}

.skeleton-profile-meta .skeleton-placeholder {
    margin-inline: auto;
}

.skeleton-line--meta-value {
    width: 72px;
    height: 16px;
    margin-bottom: 0.45rem;
    border-radius: 8px;
}

.skeleton-line--meta-label {
    width: 54px;
    height: 10px;
}

.profile-form-skeleton {
    width: 100%;
}

.skeleton-line--label {
    width: 92px;
    height: 10px;
    margin-bottom: 0.55rem;
}

.skeleton-input {
    width: 100%;
    height: 50px;
    border-radius: 12px;
}

.skeleton-textarea {
    width: 100%;
    height: 118px;
    border-radius: 12px;
}

@keyframes skeleton-shimmer {
    100% {
        transform: translateX(100%);
    }
}

.avatar-actions {
    position: absolute;
    bottom: 10px;
    right: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    z-index: 2;
    animation: profileFieldIn 0.4s ease both 0.16s;
}

.btn-action-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 3px solid white;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-action-avatar.upload {
    background: #216477;
}

.btn-action-avatar.delete {
    background: #dc3545;
}

.btn-action-avatar:hover {
    transform: scale(1.1);
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.16);
}

.icon-box-primary {
    width: 42px;
    height: 42px;
    background: rgba(33, 100, 119, 0.1);
    color: #216477;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    animation: profileIconPulse 3.8s ease-in-out infinite;
    transition: transform 0.2s ease;
}

.card:hover .icon-box-primary {
    transform: scale(1.04) rotate(-2deg);
}

.label-custom {
    font-weight: 700;
    font-size: 0.75rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.custom-input {
    border-radius: 12px;
    padding: 12px;
    border: 1.5px solid #edf2f7;
    background: #f8fafc;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.custom-input:hover:not(:disabled) {
    border-color: #b9c9d2;
    transform: translateY(-1px);
}

.custom-input:focus {
    border-color: #216477;
    box-shadow: 0 0 0 4px rgba(33, 100, 119, 0.12);
    transform: translateY(-1px);
}

.input-active {
    background: white !important;
    border-color: #216477 !important;
}

form .row > * {
    animation: profileFieldIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
}

form .row > *:nth-child(2) {
    animation-delay: 0.05s;
}

form .row > *:nth-child(3) {
    animation-delay: 0.1s;
}

form .row > *:nth-child(4) {
    animation-delay: 0.15s;
}

form .row > *:nth-child(5) {
    animation-delay: 0.2s;
}

form .row > *:nth-child(6) {
    animation-delay: 0.25s;
}

form .border-top {
    animation: profileFieldIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both 0.28s;
}

.btn-save {
    background: #216477;
    color: white;
    border: none;
    font-weight: 600;
}

.btn-edit {
    background: white;
    border: 1px solid #e2e8f0;
    color: #216477;
}

.cropper-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    overflow-y: auto;
    z-index: 9999;
    backdrop-filter: blur(4px);
}

.cropper-card {
    width: 100%;
    max-width: 500px;
    max-height: calc(100vh - 2rem);
    max-height: calc(100dvh - 2rem);
    overflow-y: auto;
    animation: profileModalCardIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.cropper-wrapper {
    max-height: min(58vh, 420px);
    max-height: min(58dvh, 420px);
    overflow: hidden;
    border-radius: 12px;
    background: #f8fafc;
}

.cropper-card img {
    width: 100%;
    height: auto;
    max-height: min(58vh, 420px);
    max-height: min(58dvh, 420px);
    object-fit: contain;
}

.cropper-actions {
    flex-wrap: wrap;
}

:deep(.cropper-container) {
    direction: ltr;
    font-size: 0;
    line-height: 0;
    position: relative;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
}

:deep(.cropper-wrapper) {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: auto;
    max-height: inherit;
}

:deep(.cropper-drag-box) {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    outline: 1px dashed rgba(255, 255, 255, 0.6);
}

:deep(.cropper-view-box) {
    display: block;
    width: 100%;
    height: 100%;
    outline: 1px solid rgba(255, 255, 255, 0.75);
    overflow: hidden;
}

:deep(.cropper-crop-box) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    outline: 1px dashed #39f;
}

:deep(.cropper-line),
:deep(.cropper-point) {
    position: absolute;
    display: block;
    opacity: 0.7;
}

:deep(.cropper-point) {
    width: 16px;
    /* កែពី 10px មក 16px ឬ 20px */
    height: 16px;
    /* កែពី 10px មក 16px ឬ 20px */
    margin-top: -8px;
    /* ត្រូវជាពាក់កណ្តាលនៃ height (ឧទាហរណ៍ -8px ប្រសិនបើ height គឺ 16px) */
    margin-left: -8px;
    /* ត្រូវជាពាក់កណ្តាលនៃ width */
    background-color: #39f;
    border: 2px solid white;
    border-radius: 50%;
    box-sizing: border-box;
    opacity: 1;
    /* បង្កើនភាពច្បាស់ឱ្យឃើញកាន់តែច្បាស់ */
}

:deep(.cropper-point.n) {
    top: 0;
    left: 50%;
    cursor: ns-resize;
}

:deep(.cropper-point.s) {
    bottom: 0;
    left: 50%;
    cursor: ns-resize;
}

:deep(.cropper-point.e) {
    right: 0;
    top: 50%;
    cursor: ew-resize;
}

:deep(.cropper-point.w) {
    left: 0;
    top: 50%;
    cursor: ew-resize;
}

:deep(.cropper-point.ne) {
    right: 0;
    top: 0;
    cursor: nesw-resize;
}

:deep(.cropper-point.nw) {
    left: 0;
    top: 0;
    cursor: nwse-resize;
}

:deep(.cropper-point.se) {
    right: 0;
    bottom: 0;
    cursor: nwse-resize;
}

:deep(.cropper-point.sw) {
    left: 0;
    bottom: 0;
    cursor: nesw-resize;
}

.extra-small {
    font-size: 10px;
}

.profile-content-swap-enter-active,
.profile-content-swap-leave-active {
    transition: opacity 0.26s ease, transform 0.26s ease;
}

.profile-content-swap-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.profile-content-swap-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

.profile-modal-fade-enter-active,
.profile-modal-fade-leave-active {
    transition: opacity 0.22s ease;
}

.profile-modal-fade-enter-from,
.profile-modal-fade-leave-to {
    opacity: 0;
}

@keyframes profilePageSweep {
    0%,
    24% {
        opacity: 0;
        transform: translateX(-72%);
    }

    45% {
        opacity: 0.8;
    }

    72%,
    100% {
        opacity: 0;
        transform: translateX(72%);
    }
}

@keyframes profileGridDrift {
    from {
        background-position: 0 0, 0 0;
    }

    to {
        background-position: 46px 23px, -23px 46px;
    }
}

@keyframes profileRibbonGlow {
    from {
        opacity: 0.72;
        transform: translateX(-8px) rotate(-4deg);
    }

    to {
        opacity: 1;
        transform: translateX(8px) rotate(-4deg);
    }
}

@keyframes profileCardIn {
    from {
        opacity: 0;
        transform: translateY(18px) scale(0.985);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes profileFadeRise {
    from {
        opacity: 0;
        transform: translateY(14px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes profileFieldIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes profileAvatarFloat {
    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-7px);
    }
}

@keyframes profileAvatarRingPulse {
    0%,
    100% {
        opacity: 0.42;
        transform: scale(0.98);
    }

    50% {
        opacity: 0.9;
        transform: scale(1.04);
    }
}

@keyframes profileIconPulse {
    0%,
    100% {
        box-shadow: 0 0 0 rgba(33, 100, 119, 0);
    }

    50% {
        box-shadow: 0 0 0 7px rgba(33, 100, 119, 0.12);
    }
}

@keyframes profileModalCardIn {
    from {
        opacity: 0;
        transform: translateY(18px) scale(0.96);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@media (max-width: 575.98px) {
    .cropper-overlay {
        padding: 0.75rem;
    }

    .cropper-card {
        max-height: calc(100vh - 1.5rem);
        max-height: calc(100dvh - 1.5rem);
        padding: 1rem !important;
    }

    .cropper-wrapper,
    .cropper-card img {
        max-height: min(52vh, 340px);
        max-height: min(52dvh, 340px);
    }

    .cropper-actions {
        flex-direction: column;
    }

    .cropper-actions .btn {
        width: 100%;
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
</style>
