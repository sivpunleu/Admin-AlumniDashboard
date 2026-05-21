import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/useAuth";
const LoginView = () => import("../views/Authentication/LoginView.vue");
const ForgotPasswordView = () =>
  import("../views/Authentication/forgotPassword.vue");
const VerifyAccountView = () =>
  import("../views/Authentication/VerifyAccount.vue");
const SettingView = () =>
  import("../views/Authentication/SettingVeiw.vue");
const DashboardLayout = () => import("../components/Layout/Dashboard.vue");
const HomeView = () => import("@/views/HomeView.vue");
const ProfileView = () => import("@/views/Profile/ProfileView.vue");
const NotFoundView = () => import("@/views/NotFoundView.vue");
const GenerationsView = () => import("@/views/Generations/Generations.vue");
const CategoryView = () => import("@/views/Category/CategoryView.vue");
const EventView = () => import("@/views/Event/EventView.vue");
const ParticipantView = () => import("@/views/Event/EventParticipantView.vue");
const ManagerAlumniView = () =>
  import("@/views/Manage Alumni/ManagerAlumni.vue");
const DepartmentView = () => import("@/views/Department/DepartmentView.vue");

const DEFAULT_TITLE = "ប្រព័ន្ធគ្រប់គ្រងអតីតនិស្សិត";

const readFirstValue = (value) => Array.isArray(value) ? value[0] : value;

const redirectToEmailChangeVerification = (to) => {
  const token = readFirstValue(to.params.token) ||
    readFirstValue(to.query.token) ||
    readFirstValue(to.query.verificationToken) ||
    readFirstValue(to.query.emailChangeToken) ||
    readFirstValue(to.query.changeEmailToken);
  const query = { ...to.query };

  delete query.verificationToken;
  delete query.emailChangeToken;
  delete query.changeEmailToken;

  if (token) query.token = token;
  query.verifyEmailChange = "1";

  return {
    name: "settings",
    query,
  };
};

const routes = [
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { requiresAuth: false, title: "ចូលប្រើប្រាស់" },
  },
  {
    path: "/forgot-password",
    name: "forgot-password",
    component: ForgotPasswordView,
    meta: { requiresAuth: false, title: "ភ្លេចពាក្យសម្ងាត់" },
  },
  {
    path: "/verify-account",
    name: "verify-account",
    component: VerifyAccountView,
    meta: { requiresAuth: false, title: "ផ្ទៀងផ្ទាត់គណនី" },
  },
  {
    path: "/reset-password/:token?",
    name: "reset-password",
    component: ForgotPasswordView,
    meta: { requiresAuth: false, title: "កំណត់ពាក្យសម្ងាត់ឡើងវិញ" },
  },
  {
    path: "/verify-change-email/:token?",
    name: "verify-change-email",
    redirect: redirectToEmailChangeVerification,
  },
  {
    path: "/confirm-email-change/:token?",
    name: "confirm-email-change",
    redirect: redirectToEmailChangeVerification,
  },
  {
    path: "/auth/verify-change-email/:token?",
    name: "auth-verify-change-email",
    redirect: redirectToEmailChangeVerification,
  },
  {
    path: "/api/v1/auth/verify-change-email/:token?",
    name: "api-verify-change-email",
    redirect: redirectToEmailChangeVerification,
  },
  {
    path: "/",
    component: DashboardLayout,
    redirect: "/dashboard",
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
    children: [
      {
        path: "dashboard",
        name: "home",
        component: HomeView,
        meta: { title: "ផ្ទាំងគ្រប់គ្រង" },
      },
      {
        path: "profile",
        name: "profile",
        component: ProfileView,
        meta: { title: "ព័ត៌មានផ្ទាល់ខ្លួន" },
      },
      {
        path: "settings",
        name: "settings",
        component: SettingView,
        meta: { title: "ការកំណត់" },
      },
      {
        path: "generations",
        name: "generations",
        component: GenerationsView,
        meta: { title: "គ្រប់គ្រងជំនាន់" },
      },
      {
        path: "manager-alumni",
        name: "manager-alumni",
        component: ManagerAlumniView,
        meta: { title: "គ្រប់គ្រងអតីតនិស្សិត" },
      },
      {
        path: "department",
        name: "department",
        component: DepartmentView,
        meta: { title: "ដេប៉ាតឺម៉ង់" },
      },
      {
        path: "category",
        name: "category",
        component: CategoryView,
        meta: { title: "ប្រភេទ" },
      },
      {
        path: "event",
        name: "event",
        component: EventView,
        meta: { title: "ព្រឹត្តិការណ៍" },
      },
      {
        path: "participant/:id?",
        name: "participant",
        component: ParticipantView,
        props: true,
        meta: { title: "ព្រឹត្តិការណ៍​ / អ្នកចូលរួម" },
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundView,
    meta: { requiresAuth: false, title: "រកមិនឃើញទំព័រ" },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.afterEach((to) => {
  const pageTitle = [...to.matched]
    .reverse()
    .find((route) => route.meta?.title)?.meta.title;

  document.title = pageTitle ? `${pageTitle}` : DEFAULT_TITLE;
});

/**
 * Navigation Guard
 */
router.beforeEach((to) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isLogined;
  const isAdmin = authStore.isAdmin;
  const requiresAuth = to.matched.some((route) => route.meta.requiresAuth);
  const requiresAdmin = to.matched.some((route) => route.meta.requiresAdmin);

  // 1. If route requires auth and user is NOT logged in -> Go to Login
  if (requiresAuth && !isAuthenticated) {
    return {
      name: "login",
      query: { redirect: to.fullPath },
    };
  }

  // 2. If route requires admin and logged-in user is NOT admin -> Clear session and Go to Login
  if (requiresAdmin && !isAdmin) {
    authStore.clearAuth();
    return { name: "login" };
  }

  // 3. If admin user tries to access Login page -> Go to Dashboard
  if (to.name === "login" && isAuthenticated && isAdmin) {
    return { name: "home" };
  }

  // 4. Otherwise, proceed as normal
  return true;
});

export default router;
