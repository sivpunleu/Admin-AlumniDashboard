import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/useAuth";
const LoginView = () => import("../views/LoginView.vue");
const DashboardLayout = () => import("../components/Layout/Dashboard.vue");
const HomeView = () => import("@/views/HomeView.vue");
const ProfileView = () => import("@/views/Profile/ProfileView.vue");
const NotFoundView = () => import("@/views/NotFoundView.vue");
const GenerationsView = () => import("@/views/Generations/Generations.vue");
const GategoryView = () => import("@/views/Category/CategoryView.vue");
const EventView = () => import("@/views/Event/EventView.vue");
const ParticipantView = () => import("@/views/Event/EventParticipantView.vue");
const ManagerAlumniView = () =>
  import("@/views/Manage Alumni/ManagerAlumni.vue");
const DepartmentView = () => import("@/views/Department/DepartmentView.vue");

const routes = [
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: "/",
    component: DashboardLayout,
    redirect: "/dashboard", // Redirect root to dashboard
    meta: { requiresAuth: true }, // Apply auth requirement to all children
    children: [
      {
        path: "dashboard",
        name: "home",
        component: HomeView,
        meta: { title: "DASHBOARD" },
      },
      {
        path: "profile",
        name: "profile",
        component: ProfileView,
        meta: { title: "PROFILE" },
      },
      {
        path: "generations",
        name: "generations",
        component: GenerationsView,
        meta: { title: "GROUPMANAGE" },
      },
      {
        path: "manager-alumni",
        name: "manager-alumni",
        component: ManagerAlumniView,
        meta: { title: "ALUMNI MANAGE" },
      },
      {
        path: "department",
        name: "department",
        component: DepartmentView,
        meta: { title: "DEPARTMENT" },
      },
      {
        path: "category",
        name: "category",
        component: GategoryView,
        meta: { title: "CATEGORY" },
      },
      {
        path: "event",
        name: "event",
        component: EventView,
        meta: { title: "EVENT" },
      },
      {
        path: "/events/:id/participants",
        name: "event-participants",
        component: () => import("@/views/Event/EventParticipantView.vue"),
        props: true, // ដើម្បីឱ្យយើងអាចទាញយក ID តាមរយៈ props បានងាយស្រួល
      },
    ],
  },
  // Catch-all 404 route
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundView,
    meta: { requiresAuth: false },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

/**
 * Navigation Guard
 */
router.beforeEach((to) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isLogined;

  // 1. If route requires auth and user is NOT logged in -> Go to Login
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: "login" };
  }
  // 2. If user IS logged in and tries to access Login page -> Go to Dashboard
  if (to.name === "login" && isAuthenticated) {
    return { name: "home" };
  }

  // 3. Otherwise, proceed as normal
  return true;
});

export default router;
