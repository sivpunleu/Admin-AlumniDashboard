<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/API/api';
import logger from '@/utils/logger';

const router = useRouter();

// ១. State សម្រាប់ទុកទិន្នន័យ
const stats = ref({
  total: 0,
  approved: 0,
  pending: 0,
  deactivated: 0,
  events: 0,
  upcomingEvents: 0
});
const recentRegistrations = ref([]);
const upcomingEvents = ref([]);
const isLoading = ref(true);

const PRIMARY_COLOR = '#216477';

const quickActions = [
  { label: 'គ្រប់គ្រងអតីតនិស្សិត', icon: 'bi-people-fill', path: '/manager-alumni', tone: 'primary' },
  { label: 'ព្រឹត្តិការណ៍', icon: 'bi-calendar-event-fill', path: '/event', tone: 'info' },
  { label: 'ការចូលរួម', icon: 'bi-person-check-fill', path: '/participant', tone: 'success' },
  { label: 'ដេប៉ាតឺម៉ង់', icon: 'bi-diagram-3-fill', path: '/department', tone: 'warning' }
];
const recentSkeletonRows = Array.from({ length: 5 }, (_, index) => index);
const upcomingSkeletonRows = Array.from({ length: 3 }, (_, index) => index);

const normalizeStatus = (value) => String(value || 'PENDING').toUpperCase();

const getUserEmail = (user) => {
  const email = user?.email;
  return typeof email === 'string' && email.trim() ? email.trim() : '-';
};

const getUserDisplayName = (user) => {
  const profileName = user?.profile?.fullname || user?.profile?.fullName;
  const name = profileName || user?.fullname || user?.fullName || user?.name || user?.username;
  if (typeof name === 'string' && name.trim()) return name.trim();

  const email = getUserEmail(user);
  return email !== '-' ? email.split('@')[0] : 'Unknown';
};

const getUserInitial = (user) => getUserDisplayName(user).charAt(0).toUpperCase();

const formatRegistrationDate = (user) => {
  const value = user?.registeredAt || user?.createdAt || user?.created_at || user?.profile?.registeredAt || user?.profile?.createdAt || user?.profile?.created_at || user?.updatedAt;
  if (!value) return '-';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('km-KH');
};

const formatEventDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('km-KH');
};

const normalizeCollection = (response) => {
  const payload = response.data?.data || response.data || {};
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

const getStatusClass = (status) => {
  if (status === 'APPROVE') return 'approved';
  if (status === 'DEACTIVATED') return 'deactivated';
  return 'pending';
};

const getStatusLabel = (status) => {
  if (status === 'APPROVE') return 'បានអនុម័ត';
  if (status === 'DEACTIVATED') return 'បានផ្អាក';
  return 'រង់ចាំ';
};

// ២. Function ទាញយកទិន្នន័យពី API
const getUserStatus = (user) => {
  if (!user) return 'PENDING';
  const status = normalizeStatus(
    user.profile?.status ||
    user.status ||
    (user.isVerifyEmail ? 'APPROVE' : 'PENDING') ||
    'PENDING'
  );

  if (status === 'REJECT' || status === 'DEACTIVATED') return 'DEACTIVATED';
  return status;
};

const fetchDashboardData = async () => {
  try {
    isLoading.value = true;
    const [usersResponse, eventsResponse] = await Promise.all([
      api.get('/users' + '?_page=1&_per_page=100'),
      api.get('/events' + '?_page=1&_per_page=100')
    ]);

    // ទាញយកទិន្នន័យពី API តាមរូបភាព [image_ccffa6.png]
    const allUsers = normalizeCollection(usersResponse);
    const allEvents = normalizeCollection(eventsResponse);

    if (Array.isArray(allUsers)) {
      stats.value.total = allUsers.length;

      stats.value.approved = allUsers.filter(u => getUserStatus(u) === 'APPROVE').length;
      stats.value.pending = allUsers.filter(u => getUserStatus(u) === 'PENDING').length;

      stats.value.deactivated = allUsers.filter(u =>
        ['REJECT', 'DEACTIVATED'].includes(
          normalizeStatus(u?.profile?.status || u?.status || u?.role?.name)
        )
      ).length;

      recentRegistrations.value = allUsers.slice(0, 5);
    }

    if (Array.isArray(allEvents)) {
      const now = new Date();
      const upcoming = allEvents
        .filter((event) => {
          const eventDate = new Date(event.startDate || event.start_date || event.date);
          return !Number.isNaN(eventDate.getTime()) && eventDate >= now;
        })
        .sort((a, b) => new Date(a.startDate || a.start_date || a.date) - new Date(b.startDate || b.start_date || b.date));

      stats.value.events = allEvents.length;
      stats.value.upcomingEvents = upcoming.length;
      upcomingEvents.value = upcoming.slice(0, 3);
    }
  } catch (error) {
    logger.error('Error loading dashboard data:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<template>
  <div class="dashboard-container">
    <!-- ផ្នែកក្បាល (Header Section) -->
    <div class="dashboard-page-header d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1">ទិដ្ឋភាពទូទៅ</h2>
        <p class="text-muted small">សូមស្វាគមន៍ការត្រឡប់មកវិញ។
          នេះគឺជាអ្វីដែលកំពុងកើតឡើងនៅក្នុងសហគមន៍អតីតនិស្សិតរបស់អ្នក។</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-light btn-sm rounded-pill px-3 border shadow-sm" @click="fetchDashboardData">
          <i class="bi bi-arrow-clockwise me-1"></i>ធ្វើបច្ចុប្បន្នភាព
        </button>
      </div>
    </div>

    <!-- ផ្នែកកាតស្ថិតិ (Stats Cards Section) -->
    <div class="row g-3 mb-4">
      <div v-for="action in quickActions" :key="action.path" class="col-12 col-sm-6 col-xl-3">
        <button type="button" class="quick-action w-100" :class="`quick-action--${action.tone}`"
          @click="router.push(action.path)">
          <span class="quick-action__icon">
            <i :class="['bi', action.icon]"></i>
          </span>
          <span class="quick-action__label">{{ action.label }}</span>
          <i class="bi bi-chevron-right quick-action__arrow"></i>
        </button>
      </div>
    </div>

    <div class="row g-3 mb-5">
      <!-- អតីតនិស្សិតសរុប -->
      <div class="col-md-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 h-100 border-start border-4"
          :style="{ borderColor: PRIMARY_COLOR + ' !important' }">
          <div class="d-flex align-items-center">
            <div class="icon-box me-3"><i class="bi bi-people fs-4"></i></div>
            <div>
              <p class="text-muted small mb-0">អតីតនិស្សិតសរុប</p>
              <span v-if="isLoading" class="skeleton-placeholder skeleton-stat-value"></span>
              <h3 v-else class="fw-bold mb-0">{{ stats.total }}</h3>
            </div>
          </div>
        </div>
      </div>
      <!-- បានអនុម័ត -->
      <div class="col-md-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 h-100 border-start border-4 border-success">
          <div class="d-flex align-items-center">
            <div class="icon-box text-success me-3" style="background: #e6f4ea;"><i class="bi bi-person-check fs-4"></i>
            </div>
            <div>
              <p class="text-muted small mb-0">បានអនុម័ត</p>
              <span v-if="isLoading" class="skeleton-placeholder skeleton-stat-value"></span>
              <h3 v-else class="fw-bold mb-0">{{ stats.approved }}</h3>
            </div>
          </div>
        </div>
      </div>
      <!-- កំពុងរង់ចាំពិនិត្យ -->
      <div class="col-md-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 h-100 border-start border-4 border-warning">
          <div class="d-flex align-items-center">
            <div class="icon-box text-warning me-3" style="background: #fff4e5;"><i
                class="bi bi-clock-history fs-4"></i></div>
            <div>
              <p class="text-muted small mb-0">កំពុងរង់ចាំពិនិត្យ</p>
              <span v-if="isLoading" class="skeleton-placeholder skeleton-stat-value"></span>
              <h3 v-else class="fw-bold mb-0">{{ stats.pending }}</h3>
            </div>
          </div>
        </div>
      </div>
      <!-- បានផ្អាកដំណើរការ -->
      <div class="col-md-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 h-100 border-start border-4 border-danger">
          <div class="d-flex align-items-center">
            <div class="icon-box text-danger me-3" style="background: #fdf2f2;"><i
                class="bi bi-exclamation-octagon fs-4"></i></div>
            <div>
              <p class="text-muted small mb-0">បានផ្អាកដំណើរការ</p>
              <span v-if="isLoading" class="skeleton-placeholder skeleton-stat-value"></span>
              <h3 v-else class="fw-bold mb-0">{{ stats.deactivated }}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <!-- តារាងការចុះឈ្មោះថ្មីៗ -->
      <div class="col-lg-12">
        <div class="card border-0 shadow-sm rounded-4 p-4 h-100">
          <div class="dashboard-card-header d-flex justify-content-between align-items-center mb-4">
            <h5 class="fw-bold mb-0">ការចុះឈ្មោះថ្មីៗ</h5>
            <button @click="router.push('/manager-alumni')"
              class="btn btn-light btn-sm rounded-pill px-3 border shadow-sm">មើលទាំងអស់</button>
          </div>

          <div v-if="isLoading" class="dashboard-table-skeleton" aria-busy="true" aria-live="polite"
            aria-label="កំពុងផ្ទុកការចុះឈ្មោះថ្មីៗ">
            <div class="skeleton-table-header">
              <span class="skeleton-placeholder skeleton-heading"></span>
              <span class="skeleton-placeholder skeleton-heading skeleton-heading--center"></span>
              <span class="skeleton-placeholder skeleton-heading skeleton-heading--center"></span>
              <span class="skeleton-placeholder skeleton-heading skeleton-heading--end"></span>
            </div>
            <div v-for="row in recentSkeletonRows" :key="row" class="skeleton-table-row">
              <span class="skeleton-person-cell">
                <span class="skeleton-placeholder skeleton-avatar"></span>
                <span class="skeleton-person-lines">
                  <span class="skeleton-placeholder skeleton-line skeleton-line--name"></span>
                  <span class="skeleton-placeholder skeleton-line skeleton-line--email"></span>
                </span>
              </span>
              <span class="skeleton-placeholder skeleton-line skeleton-line--date"></span>
              <span class="skeleton-placeholder skeleton-pill skeleton-pill--status"></span>
              <span class="skeleton-placeholder skeleton-dot-action"></span>
            </div>
          </div>

          <div v-else class="table-responsive">
            <div v-if="!recentRegistrations.length" class="dashboard-empty">
              <div class="dashboard-empty__icon">
                <i class="bi bi-person-plus"></i>
              </div>
              <h6 class="fw-bold mb-1">មិនទាន់មានការចុះឈ្មោះថ្មីទេ</h6>
              <p class="text-muted small mb-0">បេក្ខជនថ្មីនឹងបង្ហាញនៅទីនេះ បន្ទាប់ពីមានការចុះឈ្មោះ។</p>
            </div>

            <table v-else class="table align-middle table-hover">
              <thead class="text-muted small uppercase">
                <tr>
                  <th class="border-0">បេក្ខជន</th>
                  <th class="border-0 text-center">កាលបរិច្ឆេទចុះឈ្មោះ</th>
                  <th class="border-0 text-center">ស្ថានភាព</th>
                  <th class="border-0 text-end">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in recentRegistrations" :key="user.id">
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="avatar-sq me-3 text-white d-flex align-items-center justify-content-center shadow-sm"
                        :style="{ backgroundColor: PRIMARY_COLOR }">
                        {{ getUserInitial(user) }}
                      </div>
                      <div>
                        <div class="fw-bold text-dark small">{{ getUserDisplayName(user) }}</div>
                        <div class="text-muted extra-small">{{ getUserEmail(user) }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="small text-center text-muted">
                    {{ formatRegistrationDate(user) }}
                  </td>
                  <td class="text-center">
                    <span :class="['badge-status', getStatusClass(getUserStatus(user))]">
                      • {{ getStatusLabel(getUserStatus(user)) }}
                    </span>
                  </td>
                  <td class="text-end text-muted">
                    <i class="bi bi-three-dots cursor-pointer"></i>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ផ្នែកព័ត៌មានសហគមន៍ -->
      <div class="col-lg-12">
        <div class="card border-0 shadow-sm rounded-4 p-4 h-100">
          <div class="dashboard-card-header d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 class="fw-bold mb-1">សង្ខេបព្រឹត្តិការណ៍</h5>
              <p class="text-muted small mb-0">
                <template v-if="isLoading">
                  <span class="skeleton-placeholder skeleton-summary-line"></span>
                </template>
                <template v-else>
                  ព្រឹត្តិការណ៍សរុប {{ stats.events }} និងជិតមកដល់ {{ stats.upcomingEvents }}
                </template>
              </p>
            </div>
            <button @click="router.push('/event')" class="btn btn-light btn-sm rounded-pill px-3 border shadow-sm">
              មើលព្រឹត្តិការណ៍
            </button>
          </div>

          <div v-if="isLoading" class="upcoming-skeleton-list" aria-busy="true" aria-live="polite"
            aria-label="កំពុងផ្ទុកព្រឹត្តិការណ៍ជិតមកដល់">
            <div v-for="row in upcomingSkeletonRows" :key="row" class="upcoming-event skeleton-upcoming-event">
              <span class="skeleton-event-lines">
                <span class="skeleton-placeholder skeleton-line skeleton-line--event-title"></span>
                <span class="skeleton-placeholder skeleton-line skeleton-line--event-location"></span>
              </span>
              <span class="skeleton-event-date-lines">
                <span class="skeleton-placeholder skeleton-line skeleton-line--event-date"></span>
                <span class="skeleton-placeholder skeleton-line skeleton-line--event-link"></span>
              </span>
            </div>
          </div>

          <div v-else-if="!upcomingEvents.length" class="dashboard-empty">
            <div class="dashboard-empty__icon">
              <i class="bi bi-calendar2-plus"></i>
            </div>
            <h6 class="fw-bold mb-1">មិនទាន់មានព្រឹត្តិការណ៍ជិតមកដល់ទេ</h6>
            <p class="text-muted small mb-0">ព្រឹត្តិការណ៍ដែលមានថ្ងៃចាប់ផ្តើមខាងមុខនឹងបង្ហាញនៅទីនេះ។</p>
          </div>

          <div v-else class="upcoming-list">
            <button v-for="event in upcomingEvents" :key="event.id" type="button" class="upcoming-event"
              @click="router.push({ name: 'participant', params: { id: event.id } })">
              <div>
                <div class="fw-bold text-dark">{{ event.title || '-' }}</div>
                <div class="text-muted small">{{ event.location || '-' }}</div>
              </div>
              <div class="text-end">
                <div class="event-date">{{ formatEventDate(event.startDate || event.start_date || event.date) }}</div>
                <div class="text-muted extra-small">មើលអ្នកចូលរួម</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 1rem;
}

.dashboard-page-header,
.dashboard-card-header {
  gap: 1rem;
  flex-wrap: wrap;
}

.dashboard-page-header>div:first-child,
.dashboard-card-header>div:first-child {
  min-width: 0;
}

.icon-box {
  width: 45px;
  height: 45px;
  background: #f0f4f7;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-sq {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  font-weight: bold;
  font-size: 14px;
}

.quick-action {
  min-height: 76px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
  transition: all 0.2s ease;
}

.quick-action:hover {
  border-color: #216477;
  transform: translateY(-2px);
}

.quick-action__icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  background: #f0f7f9;
  color: #216477;
  font-size: 18px;
}

.quick-action__label {
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
  flex: 1;
  min-width: 0;
}

.quick-action__arrow {
  color: #94a3b8;
  font-size: 14px;
}

.quick-action--success .quick-action__icon {
  background: #e6f4ea;
  color: #1e7e34;
}

.quick-action--info .quick-action__icon {
  background: #e8f4ff;
  color: #0f6da8;
}

.quick-action--warning .quick-action__icon {
  background: #fff4e5;
  color: #b45309;
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

.skeleton-stat-value {
  width: 58px;
  height: 32px;
  margin-top: 0.2rem;
}

.dashboard-table-skeleton {
  overflow-x: auto;
}

.skeleton-table-header,
.skeleton-table-row {
  display: grid;
  grid-template-columns: minmax(260px, 1.5fr) minmax(160px, 0.9fr) minmax(120px, 0.75fr) minmax(80px, 0.4fr);
  align-items: center;
  gap: 1rem;
  min-width: 720px;
}

.skeleton-table-header {
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f1f1;
}

.skeleton-table-row {
  padding: 0.95rem 0;
  border-bottom: 1px solid #f1f1f1;
}

.skeleton-table-row:last-child {
  border-bottom: 0;
}

.skeleton-heading {
  width: 72px;
  height: 12px;
}

.skeleton-heading--center {
  justify-self: center;
}

.skeleton-heading--end,
.skeleton-dot-action {
  justify-self: end;
}

.skeleton-person-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  border-radius: 10px;
}

.skeleton-person-lines,
.skeleton-event-lines,
.skeleton-event-date-lines {
  display: grid;
  gap: 0.45rem;
  min-width: 0;
}

.skeleton-line {
  height: 12px;
}

.skeleton-line--name {
  width: min(180px, 75%);
}

.skeleton-line--email {
  width: min(220px, 88%);
  height: 10px;
}

.skeleton-line--date {
  width: 104px;
  justify-self: center;
}

.skeleton-pill {
  height: 24px;
}

.skeleton-pill--status {
  width: 86px;
  justify-self: center;
}

.skeleton-dot-action {
  width: 28px;
  height: 12px;
}

.skeleton-summary-line {
  width: 220px;
  height: 12px;
}

.upcoming-skeleton-list {
  display: grid;
  gap: 10px;
}

.skeleton-upcoming-event {
  pointer-events: none;
}

.skeleton-line--event-title {
  width: min(240px, 76%);
  height: 14px;
}

.skeleton-line--event-location {
  width: min(180px, 62%);
  height: 11px;
}

.skeleton-event-date-lines {
  justify-items: end;
}

.skeleton-line--event-date {
  width: 92px;
  height: 13px;
}

.skeleton-line--event-link {
  width: 118px;
  height: 10px;
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

.dashboard-empty {
  min-height: 180px;
  padding: 32px 16px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.dashboard-empty__icon {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  border-radius: 12px;
  background: #f0f7f9;
  color: #216477;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.upcoming-list {
  display: grid;
  gap: 10px;
}

.upcoming-event {
  width: 100%;
  min-height: 72px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  text-align: left;
  transition: all 0.2s ease;
}

.upcoming-event:hover {
  border-color: #216477;
  background: #f8fafc;
}

.event-date {
  color: #216477;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.extra-small {
  font-size: 11px;
}

.badge-status {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 9px;
  font-weight: 700;
  display: inline-block;
}

.badge-status.approved {
  background: #e6f4ea;
  color: #1e7e34;
}

.badge-status.pending {
  background: #fff4e5;
  color: #b45309;
}

.badge-status.deactivated {
  background: #fdf2f2;
  color: #b42318;
}

.card {
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-3px);
}

.cursor-pointer {
  cursor: pointer;
}

/* សម្រាប់កែសម្រួល Table ឱ្យដូចរូបភាព image_ccf0a4.png */
.table thead th {
  background-color: #f8f9fa;
  padding: 12px;
  letter-spacing: 0.5px;
}

.table tbody td {
  padding: 15px 12px;
  border-bottom: 1px solid #f1f1f1;
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 0;
  }

  .dashboard-page-header,
  .dashboard-card-header {
    align-items: flex-start !important;
    flex-direction: column;
  }

  .dashboard-page-header .btn,
  .dashboard-card-header .btn {
    width: 100%;
  }

  .upcoming-event {
    align-items: stretch;
    flex-direction: column;
  }

  .upcoming-event .text-end {
    text-align: left !important;
  }

  .dashboard-table-skeleton {
    overflow-x: hidden;
  }

  .skeleton-table-header {
    display: none;
  }

  .skeleton-table-row {
    grid-template-columns: 1fr;
    min-width: 0;
    gap: 0.75rem;
  }

  .skeleton-line--date,
  .skeleton-pill--status,
  .skeleton-dot-action {
    justify-self: start;
  }

  .skeleton-event-date-lines {
    justify-items: start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-placeholder::after {
    animation: none;
  }
}
</style>
