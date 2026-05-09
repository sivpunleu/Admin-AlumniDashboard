<template>
    <div class="profile-page pb-5">
        <div class="profile-banner"></div>

        <div class="container position-relative mt-n5">
            <div class="row g-4 justify-content-center">
                <div class="col-12 col-lg-4">
                    <div class="card border-0 shadow-sm rounded-4 text-center p-4 h-100 overflow-hidden">
                        <div class="card-body">
                            <div class="avatar-edit-container mb-4">
                                <div class="position-relative d-inline-block">
                                    <div class="avatar-ring">
                                        <img :src="avatarUrl" alt="profile" class="profile-img-lg shadow"
                                            @error="handleAvatarError" @load="handleAvatarLoad" />
                                    </div>
                                    <div class="avatar-actions">
                                        <button type="button" class="btn-action upload shadow"
                                            @click="triggerAvatarPicker">
                                            <i class="bi bi-camera-fill"></i>
                                        </button>
                                        <button v-if="currentUser?.profile?.avatar" type="button"
                                            class="btn-action delete shadow" @click="handleDeleteAvatar">
                                            <i class="bi bi-trash-fill"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <h4 class="fw-bold text-dark mb-1">{{ displayName }}</h4>
                            <p class="text-muted small mb-4">{{ form.currentJob || 'សមាជិកអតីតនិស្សិត' }}</p>

                            <div class="row g-2 text-center border-top pt-4">
                                <div class="col-6 border-end">
                                    <h6 class="fw-bold mb-0 text-primary">{{ currentUser?.profile?.generation?.name ||
                                        'N/A' }}</h6>
                                    <small class="text-muted extra-small">ជំនាន់</small>
                                </div>
                                <div class="col-6">
                                    <h6 class="fw-bold mb-0 text-primary text-truncate px-2">{{
                                        currentUser?.profile?.department?.name || 'N/A' }}</h6>
                                    <small class="text-muted extra-small">ដេប៉ាតឺម៉ង</small>
                                </div>
                            </div>
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
                            <button v-if="!isEditing" @click="toggleEdit(true)"
                                class="btn btn-edit rounded-pill px-4 btn-sm fw-bold shadow-sm">
                                <i class="bi bi-pencil-square me-2"></i>កែសម្រួល
                            </button>
                        </div>

                        <div class="card-body p-4 p-md-5">
                            <form @submit.prevent="handleUpdateProfile">
                                <div class="row g-4">
                                    <div class="col-md-6">
                                        <label class="form-label label-custom">នាមខ្លួនពេញ</label>
                                        <input v-model="form.fullname" type="text" :disabled="!isEditing"
                                            class="form-control custom-input" :class="{ 'input-active': isEditing }">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label label-custom">លេខទូរស័ព្ទ</label>
                                        <input v-model="form.phone" type="tel" :disabled="!isEditing"
                                            class="form-control custom-input" :class="{ 'input-active': isEditing }">
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label label-custom">ការងារបច្ចុប្បន្ន</label>
                                        <input v-model="form.currentJob" type="text" :disabled="!isEditing"
                                            class="form-control custom-input" :class="{ 'input-active': isEditing }">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label label-custom">ដេប៉ាតឺម៉ង</label>
                                        <select v-model="form.departmentId" :disabled="!isEditing"
                                            class="form-select custom-input" :class="{ 'input-active': isEditing }">
                                            <option value="">ជ្រើសរើសដេប៉ាតឺម៉ង</option>
                                            <option v-for="department in departmentOptions" :key="department.id"
                                                :value="department.id">
                                                {{ department.name }}
                                            </option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label label-custom">ជំនាន់</label>
                                        <select v-model="form.generationId" :disabled="!isEditing"
                                            class="form-select custom-input" :class="{ 'input-active': isEditing }">
                                            <option value="">ជ្រើសរើសជំនាន់</option>
                                            <option v-for="generation in generationOptions" :key="generation.id"
                                                :value="generation.id">
                                                {{ generation.name }}
                                            </option>
                                        </select>
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label label-custom">ជីវប្រវត្តិ</label>
                                        <textarea v-model="form.bio" :disabled="!isEditing"
                                            class="form-control custom-input" rows="4"
                                            :class="{ 'input-active': isEditing }"></textarea>
                                    </div>
                                </div>

                                <div v-if="isEditing" class="d-flex justify-content-end gap-2 mt-5 pt-3 border-top">
                                    <button type="button" class="btn btn-light rounded-pill px-4"
                                        @click="toggleEdit(false)">បោះបង់</button>
                                    <button type="submit" class="btn btn-save rounded-pill px-5 shadow-sm"
                                        :disabled="profileStore.loading">
                                        <span v-if="profileStore.loading"
                                            class="spinner-border spinner-border-sm me-2"></span> រក្សាទុក
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showCropperModal" class="cropper-overlay" @click.self="closeCropperModal">
            <div class="cropper-card bg-white rounded-4 shadow-lg p-4">
                <h5 class="fw-bold mb-3">កាត់តម្រូវរូបភាព</h5>
                <div class="cropper-wrapper mb-3">
                    <img ref="cropperImgRef" :src="rawImageSrc" class="mw-100" />
                </div>
                <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-light rounded-pill px-4" @click="closeCropperModal">បោះបង់</button>
                    <button class="btn btn-primary rounded-pill px-4" @click="confirmCrop" :disabled="cropUploading">
                        <span v-if="cropUploading" class="spinner-border spinner-border-sm me-1"></span> រក្សាទុករូបភាព
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { useDepartmentStore } from '@/stores/departmentStore';
import * as generationStore from '@/stores/generationStore';
import { useProfileStore } from '@/stores/useProfile';
import Cropper from 'cropperjs';
import Swal from 'sweetalert2';

const profileStore = useProfileStore();
const departmentStore = useDepartmentStore();
const avatarInput = ref(null);
const isEditing = ref(false);

const form = reactive({
    fullname: '',
    phone: '',
    currentJob: '',
    bio: '',
    email: '',
    departmentId: '',
    generationId: '',
});

const departmentOptions = computed(() => departmentStore.departments || []);
const generationOptions = computed(() => generationStore.generations.value || []);

// Cropper State
const showCropperModal = ref(false);
const rawImageSrc = ref("");
const cropperImgRef = ref(null);
const cropperInstance = ref(null);
const cropUploading = ref(false);

const currentUser = computed(() => profileStore.profile || {});
const displayName = computed(() => currentUser.value?.profile?.fullname || 'User');
const avatarUrl = computed(() => currentUser.value?.profile?.avatar || 'https://ui-avatars.com/api/?name=' + displayName.value);

onMounted(async () => {
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
});


const toggleEdit = (val) => isEditing.value = val;
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
            cropperInstance.value = new Cropper(cropperImgRef.value, { aspectRatio: 1, viewMode: 1 });
        });
    };
    reader.readAsDataURL(file);
};

const confirmCrop = async () => {
    if (!cropperInstance.value) return;

    cropUploading.value = true;
    try {
        const cropperCanvasElement = cropperInstance.value.getCropperCanvas();
        if (!cropperCanvasElement) throw new Error('Cropper canvas not found');

        const outputCanvas = await cropperCanvasElement.$toCanvas({
            width: 512,
            height: 512,
        });

        const blob = await new Promise((resolve) => {
            outputCanvas.toBlob((result) => resolve(result), 'image/jpeg', 0.92);
        });

        if (!blob) throw new Error('Failed to generate cropped image');

        await profileStore.uploadAvatar(blob); // បញ្ជូន Blob ទៅកាន់ Store ផ្ទាល់
        closeCropperModal();
    } catch (error) {
        console.error(error);
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

const handleUpdateProfile = async () => {
    await profileStore.updateProfile({
        fullname: form.fullname,
        phone: form.phone,
        bio: form.bio,
        currentJob: form.currentJob,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        generationId: form.generationId ? Number(form.generationId) : null,
    });
    isEditing.value = false;
};


const handleDeleteAvatar = () => profileStore.deleteAvatar();
</script>

<style scoped>
.profile-page {
    background-color: #f8fafc;
}

.profile-banner {
    height: 180px;
    background: linear-gradient(135deg, #216477 0%, #154552 100%);
}

.mt-n5 {
    margin-top: -90px !important;
}

.avatar-ring {
    padding: 6px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    display: inline-block;
}

.profile-img-lg {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    object-fit: cover;
}

.avatar-actions {
    position: absolute;
    bottom: 10px;
    right: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.btn-action {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 3px solid white;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.2s;
}

.btn-action.upload {
    background: #216477;
}

.btn-action.delete {
    background: #dc3545;
}

.btn-action:hover {
    transform: scale(1.1);
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
}

.input-active {
    background: white !important;
    border-color: #216477 !important;
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
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.cropper-card {
    width: 90%;
    max-width: 500px;
}

.extra-small {
    font-size: 10px;
}
</style>