<!-- Navbar.vue -->
<template>
    <nav class="navbar glass-navbar border-bottom fixed-top px-4 py-2" :class="{ shifted: !sidebarOpen }">
        <div class="container-fluid p-0">

            <!-- Left -->
            <div class="d-flex align-items-center">

                <button class="btn btn-menu border-0 me-3" @click="emit('toggleSidebar')">
                    <i class="bi bi-list fs-4"></i>
                </button>

                <div class="d-none d-md-flex align-items-center">
                    <span class="section-title fw-bold">
                        {{ sectionTitle }}
                    </span>
                </div>

            </div>

            <!-- Right -->
            <div class="d-flex align-items-center gap-3">

                <!-- Search -->
                <div class="search-wrapper d-none d-lg-block position-relative">

                    <i class="bi bi-search search-icon"></i>

                    <input type="text" class="form-control search-input" placeholder="ស្វែងរក..." />
                </div>

                <!-- Profile -->
                <div class="dropdown">

                    <a href="#" class="profile-trigger d-flex align-items-center text-decoration-none"
                        data-bs-toggle="dropdown">

                        <img :src="avatarUrl" alt="profile" class="profile-img-nav" @error="handleAvatarError"
                            @load="handleAvatarLoad" />

                        <span class="d-none d-lg-inline fw-bold small ms-2">
                            {{ displayName }}
                        </span>

                    </a>

                    <ul class="dropdown-menu dropdown-menu-end border-0 shadow rounded-4">

                        <li>
                            <router-link class="dropdown-item py-2" to="/profile">
                                <i class="bi bi-person-badge me-2"></i>
                                គណនីផ្ទាល់ខ្លួន
                            </router-link>
                        </li>

                        <li>
                            <hr class="dropdown-divider">
                        </li>

                        <li>
                            <a href="#" class="dropdown-item py-2 text-danger" @click.prevent="handleLogout">
                                <i class="bi bi-box-arrow-right me-2"></i>
                                ចាកចេញ
                            </a>
                        </li>

                    </ul>

                </div>

            </div>
        </div>
    </nav>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/useAuth";
import { useProfileStore } from "@/stores/useProfile";

defineProps({
    sidebarOpen: {
        type: Boolean,
        default: true,
    },
});

const emit = defineEmits(["toggleSidebar"]);

const authStore = useAuthStore();
const profileStore = useProfileStore();
const route = useRoute();

const avatarLoadError = ref(false);

const normalizedProfile = computed(() => {
    const rawProfile = profileStore.profile || {};
    return rawProfile?.profile && typeof rawProfile.profile === "object"
        ? rawProfile.profile
        : rawProfile;
});

const currentUser = computed(() => {
    const profileData = normalizedProfile.value || {};
    const authData = authStore.user || {};
    return Object.keys(profileData).length ? profileData : authData;
});

const displayName = computed(() => {
    const user = currentUser.value;
    return (
        user.fullname ||
        user.name ||
        user.username ||
        "Admin"
    );
});

const avatarUrl = computed(() => {
    if (avatarLoadError.value) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.value)}&background=216477&color=fff&size=128`;
    }
    const user = currentUser.value;
    const rawAvatar = user.avatar || user.avatarUrl || user.avatar_url || user.image;
    if (rawAvatar) {
        const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "https://ant-g2-ams.tt.linkpc.net/api/v1").replace(/\/+$/, "");
        if (rawAvatar.startsWith("http")) return rawAvatar;
        return `${apiBaseUrl}/${rawAvatar}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.value)}&background=216477&color=fff&size=128`;
});

const handleAvatarError = () => {
    avatarLoadError.value = true;
};

const handleAvatarLoad = () => {
    avatarLoadError.value = false;
};

const sectionTitle = computed(() => {
    return route.meta?.title || "Dashboard";
});

const handleLogout = () => {
    authStore.logout();
};
</script>

<style scoped>
.glass-navbar {
    background: rgba(255, 255, 255, 0.85);

    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    left: 260px;
    width: calc(100% - 260px);

    z-index: 1030;

    transition: all 0.3s ease;
}

/* Full Width */
.glass-navbar.shifted {
    left: 0;
    width: 100%;
}

/* Menu Button */
.btn-menu {
    width: 42px;
    height: 42px;

    border-radius: 50%;

    background: #216477;
    color: white;

    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-menu:hover {
    background: #1b5564;
}

/* Title */
.section-title {
    color: #216477;

    font-size: 14px;

    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Search */
.search-wrapper {
    width: 240px;
}

.search-input {
    padding-left: 42px;

    border: none;
    border-radius: 999px;

    background: #f1f5f9;
}

.search-input:focus {
    background: white;
    box-shadow: none;
}

.search-icon {
    position: absolute;

    left: 14px;
    top: 50%;

    transform: translateY(-50%);

    color: #94a3b8;
}

/* Profile */
.profile-trigger {
    padding: 4px 10px;

    border-radius: 999px;

    transition: 0.2s;
}

.profile-trigger:hover {
    background: #f8fafc;
}

.profile-img-nav {
    width: 36px;
    height: 36px;

    border-radius: 50%;

    object-fit: cover;
}

/* Dropdown */
.dropdown-menu {
    min-width: 220px;
}

.dropdown-item {
    transition: 0.2s;
}

.dropdown-item:hover {
    background: #f0f7f9;
    color: #216477;
}

/* Tablet */
@media (max-width: 991.98px) {
    .glass-navbar {
        left: 0;
        width: 100%;

        padding-left: 1rem !important;
        padding-right: 1rem !important;
    }

    .search-wrapper {
        display: none !important;
    }
}

/* Mobile */
@media (max-width: 575.98px) {
    .glass-navbar {
        padding-top: 0.65rem !important;
        padding-bottom: 0.65rem !important;
    }

    .btn-menu {
        width: 38px;
        height: 38px;
    }

    .profile-img-nav {
        width: 32px;
        height: 32px;
    }

    .section-title {
        font-size: 12px;
    }
}
</style>