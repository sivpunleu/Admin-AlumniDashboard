<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/API/api';
import logger from '@/utils/logger';
import { fetchPaginatedCollection } from '@/utils/paginatedCollection';
import * as alumniStore from '@/stores/managerAlumni';

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
const pendingApprovals = ref([]);
const activityLog = ref([]);
const isLoading = ref(true);

const PRIMARY_COLOR = '#216477';

const quickActions = [
  { label: 'គ្រប់គ្រងអតីតនិស្សិត', icon: 'bi-people-fill', route: { name: 'manager-alumni' }, tone: 'primary' },
  { label: 'ព្រឹត្តិការណ៍', icon: 'bi-calendar-event-fill', route: { name: 'event' }, tone: 'info' },
  { label: 'ការចូលរួម', icon: 'bi-person-check-fill', route: { name: 'participant' }, tone: 'success' },
  { label: 'ដេប៉ាតឺម៉ង់', icon: 'bi-diagram-3-fill', route: { name: 'department' }, tone: 'warning' }
];
const recentSkeletonRows = Array.from({ length: 5 }, (_, index) => index);
const upcomingSkeletonRows = Array.from({ length: 3 }, (_, index) => index);
const approvalSkeletonRows = Array.from({ length: 3 }, (_, index) => index);
const activitySkeletonRows = Array.from({ length: 4 }, (_, index) => index);

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

const getUserDateValue = (user) => (
  user?.registeredAt ||
  user?.createdAt ||
  user?.created_at ||
  user?.profile?.registeredAt ||
  user?.profile?.createdAt ||
  user?.profile?.created_at ||
  user?.updatedAt
);

const formatRegistrationDate = (user) => {
  const value = getUserDateValue(user);
  if (!value) return '-';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('km-KH');
};

const formatEventDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('km-KH');
};

const formatActivityDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('km-KH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getEventDateValue = (event) => (
  event?.updatedAt ||
  event?.updated_at ||
  event?.createdAt ||
  event?.created_at ||
  event?.startDate ||
  event?.start_date ||
  event?.date
);

const getTimestamp = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const goToQuickAction = async (action) => {
  try {
    await router.push(action.route);
  } catch (error) {
    logger.error('Quick action navigation failed:', action.route, error);
  }
};

const goToPendingApprovals = () => router.push({
  name: 'manager-alumni',
  query: { status: 'PENDING' },
});

const goToAlumniRecords = () => router.push({ name: 'manager-alumni' });

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

const getAlumniStatusRouteValue = (status) => (
  status === 'DEACTIVATED' ? 'REJECT' : status
);

const getAlumniSearchTarget = (user) => {
  if (user?.id) return String(user.id);

  const email = getUserEmail(user);
  if (email !== '-') return email;

  return getUserDisplayName(user);
};

const getAlumniRecordRoute = (user) => {
  const status = getUserStatus(user);
  const query = {
    status: getAlumniStatusRouteValue(status),
    search: getAlumniSearchTarget(user),
  };

  if (user?.id) {
    query.focus = String(user.id);
  }

  return {
    name: 'manager-alumni',
    query,
  };
};

const goToAlumniRecord = (user) => router.push(getAlumniRecordRoute(user));

const canApproveUser = (user) => getUserStatus(user) === 'PENDING' && Boolean(user?.id);

const handleApproveFromDashboard = async (user) => {
  if (!user?.id) return;
  await alumniStore.handleApproveUser(user.id);
  await fetchDashboardData();
};

const handleChangeStatusFromDashboard = async (user) => {
  if (!user?.id) return;
  await alumniStore.handleChangeStatus(user.id, getUserStatus(user));
  await fetchDashboardData();
};

const buildActivityLog = (users = [], events = []) => {
  const userActivities = users.map((user, index) => {
    const status = getUserStatus(user);
    const dateValue = getUserDateValue(user);
    const tone = status === 'APPROVE'
      ? 'success'
      : status === 'DEACTIVATED'
        ? 'danger'
        : 'warning';
    const icon = status === 'APPROVE'
      ? 'bi-person-check'
      : status === 'DEACTIVATED'
        ? 'bi-person-x'
        : 'bi-hourglass-split';

    return {
      id: `user-${user?.id || getUserEmail(user) || index}`,
      title: getUserDisplayName(user),
      description: status === 'PENDING'
        ? 'កំពុងរង់ចាំការអនុម័តគណនី'
        : `ស្ថានភាពគណនី: ${getStatusLabel(status)}`,
      date: dateValue,
      icon,
      tone,
      to: getAlumniRecordRoute(user),
      timestamp: getTimestamp(dateValue),
    };
  });

  const eventActivities = events.map((event, index) => {
    const dateValue = getEventDateValue(event);

    return {
      id: `event-${event?.id || index}`,
      title: event?.title || 'ព្រឹត្តិការណ៍',
      description: event?.location || 'បានបន្ថែមព្រឹត្តិការណ៍ថ្មី',
      date: dateValue,
      icon: 'bi-calendar-event',
      tone: 'primary',
      to: event?.id ? { name: 'participant', params: { id: event.id } } : '/event',
      timestamp: getTimestamp(dateValue),
    };
  });

  return [...userActivities, ...eventActivities]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);
};

const fetchDashboardData = async () => {
  try {
    isLoading.value = true;
    const [allUsers, allEvents] = await Promise.all([
      fetchPaginatedCollection(api, '/users'),
      fetchPaginatedCollection(api, '/events'),
    ]);

    if (Array.isArray(allUsers)) {
      stats.value.total = allUsers.length;

      stats.value.approved = allUsers.filter(u => getUserStatus(u) === 'APPROVE').length;
      stats.value.pending = allUsers.filter(u => getUserStatus(u) === 'PENDING').length;

      stats.value.deactivated = allUsers.filter(u =>
        ['REJECT', 'DEACTIVATED'].includes(
          normalizeStatus(u?.profile?.status || u?.status || u?.role?.name)
        )
      ).length;

      pendingApprovals.value = allUsers
        .filter(u => getUserStatus(u) === 'PENDING')
        .sort((a, b) => getTimestamp(getUserDateValue(b)) - getTimestamp(getUserDateValue(a)))
        .slice(0, 4);
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

    activityLog.value = buildActivityLog(allUsers, allEvents);
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
    <div class="dashboard-page-header d-flex justify-content-between align-items-center">
      <div>
        <h2 class="dashboard-title fw-bold mb-1">ទិដ្ឋភាពទូទៅ</h2>
        <p class="dashboard-subtitle text-muted small mb-0">សូមស្វាគមន៍ការត្រឡប់មកវិញ។
          នេះគឺជាអ្វីដែលកំពុងកើតឡើងនៅក្នុងសហគមន៍អតីតនិស្សិតរបស់អ្នក។</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn dashboard-refresh-btn btn-sm" @click="fetchDashboardData">
          <i class="bi bi-arrow-clockwise me-1"></i>ធ្វើបច្ចុប្បន្នភាព
        </button>
      </div>
    </div>

    <!-- ផ្នែកកាតស្ថិតិ (Stats Cards Section) -->
    <div class="quick-actions-grid row g-3">
      <div v-for="action in quickActions" :key="action.route.name" class="col-12 col-sm-6 col-xl-3">
        <button type="button" class="quick-action w-100" :class="`quick-action--${action.tone}`"
          @click="goToQuickAction(action)">
          <span class="quick-action__icon">
            <i :class="['bi', action.icon]"></i>
          </span>
          <span class="quick-action__label">{{ action.label }}</span>
          <i class="bi bi-chevron-right quick-action__arrow"></i>
        </button>
      </div>
    </div>

    <div class="stats-grid row g-3">
      <!-- អតីតនិស្សិតសរុប -->
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card metric-card metric-card--primary h-100">
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
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card metric-card metric-card--success h-100">
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
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card metric-card metric-card--warning h-100">
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
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card metric-card metric-card--danger h-100">
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

    <div class="row g-4 dashboard-workflow-row">
      <div class="col-12 col-xl-5">
        <div class="card dashboard-panel h-100">
          <div class="dashboard-card-header d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 class="fw-bold mb-1">គណនីរង់ចាំការអនុម័ត</h5>
              <p class="text-muted small mb-0">
                <template v-if="isLoading">
                  <span class="skeleton-placeholder skeleton-summary-line"></span>
                </template>
                <template v-else>
                  មាន {{ stats.pending }} គណនីត្រូវពិនិត្យ
                </template>
              </p>
            </div>
            <button @click="goToPendingApprovals" class="btn dashboard-link-btn btn-sm">
              ពិនិត្យទាំងអស់
            </button>
          </div>

          <Transition name="dashboard-content-swap" mode="out-in">
            <div v-if="isLoading" key="approval-loading" class="approval-list" aria-busy="true" aria-live="polite"
              aria-label="កំពុងផ្ទុកគណនីរង់ចាំការអនុម័ត">
              <div v-for="row in approvalSkeletonRows" :key="row" class="approval-item approval-item--skeleton">
                <span class="skeleton-placeholder skeleton-avatar"></span>
                <span class="approval-copy">
                  <span class="skeleton-placeholder skeleton-line skeleton-line--approval-name"></span>
                  <span class="skeleton-placeholder skeleton-line skeleton-line--approval-email"></span>
                </span>
                <span class="skeleton-placeholder skeleton-action-pill"></span>
              </div>
            </div>

            <div v-else-if="!pendingApprovals.length" key="approval-empty" class="dashboard-empty dashboard-empty--compact">
              <div class="dashboard-empty__icon">
                <i class="bi bi-check2-circle"></i>
              </div>
              <h6 class="fw-bold mb-1">គ្មានគណនីត្រូវពិនិត្យទេ</h6>
              <p class="text-muted small mb-0">គណនីដែលរង់ចាំការអនុម័តនឹងបង្ហាញនៅទីនេះ។</p>
            </div>

            <div v-else key="approval-list" class="approval-list">
              <button v-for="user in pendingApprovals" :key="user.id || getUserEmail(user)" type="button"
                class="approval-item" @click="goToPendingApprovals">
                <span class="approval-avatar" :style="{ backgroundColor: PRIMARY_COLOR }">
                  {{ getUserInitial(user) }}
                </span>
                <span class="approval-copy">
                  <span class="approval-title">{{ getUserDisplayName(user) }}</span>
                  <span class="approval-meta">
                    <span>{{ getUserEmail(user) }}</span>
                    <span>{{ formatRegistrationDate(user) }}</span>
                  </span>
                </span>
                <span class="approval-action">
                  <i class="bi bi-chevron-right"></i>
                </span>
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <div class="col-12 col-xl-7">
        <div class="card dashboard-panel h-100">
          <div class="dashboard-card-header d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 class="fw-bold mb-1">សកម្មភាពថ្មីៗ</h5>
              <p class="text-muted small mb-0">សង្ខេបការផ្លាស់ប្តូរចុងក្រោយពីគណនី និងព្រឹត្តិការណ៍</p>
            </div>
            <button class="btn dashboard-link-btn btn-sm" @click="fetchDashboardData">
              <i class="bi bi-arrow-clockwise"></i> ធ្វើបច្ចុប្បន្នភាព
            </button>
          </div>

          <Transition name="dashboard-content-swap" mode="out-in">
            <div v-if="isLoading" key="activity-loading" class="activity-list" aria-busy="true" aria-live="polite"
              aria-label="កំពុងផ្ទុកសកម្មភាពថ្មីៗ">
              <div v-for="row in activitySkeletonRows" :key="row" class="activity-item activity-item--skeleton">
                <span class="skeleton-placeholder skeleton-activity-icon"></span>
                <span class="activity-copy">
                  <span class="skeleton-placeholder skeleton-line skeleton-line--activity-title"></span>
                  <span class="skeleton-placeholder skeleton-line skeleton-line--activity-copy"></span>
                </span>
                <span class="skeleton-placeholder skeleton-line skeleton-line--activity-time"></span>
              </div>
            </div>

            <div v-else-if="!activityLog.length" key="activity-empty" class="dashboard-empty dashboard-empty--compact">
              <div class="dashboard-empty__icon">
                <i class="bi bi-activity"></i>
              </div>
              <h6 class="fw-bold mb-1">មិនទាន់មានសកម្មភាពថ្មីៗទេ</h6>
              <p class="text-muted small mb-0">សកម្មភាពពីគណនី និងព្រឹត្តិការណ៍នឹងបង្ហាញនៅទីនេះ។</p>
            </div>

            <div v-else key="activity-list" class="activity-list">
              <button v-for="activity in activityLog" :key="activity.id" type="button" class="activity-item"
                @click="router.push(activity.to)">
                <span :class="['activity-icon', `activity-icon--${activity.tone}`]">
                  <i :class="['bi', activity.icon]"></i>
                </span>
                <span class="activity-copy">
                  <span class="activity-title">{{ activity.title }}</span>
                  <span class="activity-description">{{ activity.description }}</span>
                </span>
                <span class="activity-time">{{ formatActivityDate(activity.date) }}</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <!-- តារាងការចុះឈ្មោះថ្មីៗ -->
      <div class="col-12 col-xl-8">
        <div class="card dashboard-panel h-100">
          <div class="dashboard-card-header d-flex justify-content-between align-items-center mb-4">
            <h5 class="fw-bold mb-0">ការចុះឈ្មោះថ្មីៗ</h5>
            <button @click="goToAlumniRecords"
              class="btn dashboard-link-btn btn-sm">មើលទាំងអស់</button>
          </div>

          <Transition name="dashboard-content-swap" mode="out-in">
            <div v-if="isLoading" key="recent-loading" class="dashboard-table-skeleton" aria-busy="true" aria-live="polite"
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

            <div v-else key="recent-data" class="table-responsive">
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
                  <tr
                    v-for="user in recentRegistrations"
                    :key="user.id || getUserEmail(user)"
                    class="dashboard-clickable-row"
                    role="button"
                    tabindex="0"
                    @click="goToAlumniRecord(user)"
                    @keydown.enter.prevent="goToAlumniRecord(user)"
                    @keydown.space.prevent="goToAlumniRecord(user)"
                  >
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
                        <span class="badge-status__dot"></span>{{ getStatusLabel(getUserStatus(user)) }}
                      </span>
                    </td>
                    <td class="text-end" @click.stop>
                      <div class="dropdown dashboard-row-menu">
                        <button
                          type="button"
                          class="table-action-btn"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          :aria-label="`បើកម៉ឺនុយសម្រាប់ ${getUserDisplayName(user)}`"
                        >
                          <i class="bi bi-three-dots"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end dashboard-action-menu">
                          <li>
                            <button type="button" class="dropdown-item" @click="goToAlumniRecord(user)">
                              <i class="bi bi-list-ul me-2"></i>មើលក្នុងបញ្ជី
                            </button>
                          </li>
                          <li v-if="canApproveUser(user)">
                            <button type="button" class="dropdown-item text-success" @click="handleApproveFromDashboard(user)">
                              <i class="bi bi-check2-circle me-2"></i>អនុម័ត
                            </button>
                          </li>
                          <li>
                            <button type="button" class="dropdown-item" @click="handleChangeStatusFromDashboard(user)">
                              <i class="bi bi-pencil-square me-2"></i>ប្តូរស្ថានភាព
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Transition>
        </div>
      </div>

      <!-- ផ្នែកព័ត៌មានសហគមន៍ -->
      <div class="col-12 col-xl-4">
        <div class="card dashboard-panel h-100">
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
            <button @click="router.push('/event')" class="btn dashboard-link-btn btn-sm">
              មើលព្រឹត្តិការណ៍
            </button>
          </div>

          <Transition name="dashboard-content-swap" mode="out-in">
            <div v-if="isLoading" key="upcoming-loading" class="upcoming-skeleton-list" aria-busy="true" aria-live="polite"
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

            <div v-else-if="!upcomingEvents.length" key="upcoming-empty" class="dashboard-empty">
              <div class="dashboard-empty__icon">
                <i class="bi bi-calendar2-plus"></i>
              </div>
              <h6 class="fw-bold mb-1">មិនទាន់មានព្រឹត្តិការណ៍ជិតមកដល់ទេ</h6>
              <p class="text-muted small mb-0">ព្រឹត្តិការណ៍ដែលមានថ្ងៃចាប់ផ្តើមខាងមុខនឹងបង្ហាញនៅទីនេះ។</p>
            </div>

            <div v-else key="upcoming-list" class="upcoming-list">
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
          </Transition>
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

/* Dashboard visual refresh */
.dashboard-container {
  --dashboard-primary: #216477;
  --dashboard-ink: #0f172a;
  --dashboard-muted: #64748b;
  --dashboard-border: #e2e8f0;
  --dashboard-soft-border: #f1f5f9;
  --dashboard-surface: #ffffff;
  --dashboard-soft: #f8fafc;
  --dashboard-ring: rgba(33, 100, 119, 0.12);

  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: grid;
  gap: 1rem;
  padding: clamp(0rem, 1vw, 0.5rem);
  color: var(--dashboard-ink);
}

.dashboard-container::before {
  content: "";
  position: absolute;
  inset: -1rem;
  z-index: 0;
  pointer-events: none;
  background:
    linear-gradient(115deg, transparent 0%, rgba(33, 100, 119, 0.08) 42%, transparent 58%),
    repeating-linear-gradient(90deg, rgba(33, 100, 119, 0.035) 0 1px, transparent 1px 68px);
  opacity: 0;
  transform: translateX(-72%);
  animation: dashboardPageSweep 9s ease-in-out infinite;
}

.dashboard-container > * {
  position: relative;
  z-index: 1;
}

.dashboard-page-header {
  position: relative;
  margin-bottom: 0;
  padding: 22px 24px;
  border: 1px solid var(--dashboard-border);
  border-left: 4px solid var(--dashboard-primary);
  border-radius: 8px;
  background: var(--dashboard-surface);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  animation: dashboardFadeRise 0.58s ease both;
}

.dashboard-page-header::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(33, 100, 119, 0.08), transparent);
  transform: translateX(-100%);
  animation: dashboardHeaderSweep 5.8s ease-in-out infinite;
}

.dashboard-page-header > * {
  position: relative;
  z-index: 1;
}

.dashboard-title {
  color: var(--dashboard-ink);
  font-size: clamp(1.4rem, 2vw, 1.75rem);
  line-height: 1.35;
  letter-spacing: 0;
}

.dashboard-subtitle {
  max-width: 760px;
  color: var(--dashboard-muted) !important;
  line-height: 1.7;
}

.dashboard-refresh-btn,
.dashboard-link-btn {
  min-height: 38px;
  padding: 0.45rem 0.85rem;
  border: 1px solid var(--dashboard-border);
  border-radius: 8px;
  background: var(--dashboard-surface);
  color: #334155;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  font-weight: 700;
  white-space: nowrap;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.dashboard-refresh-btn:hover,
.dashboard-link-btn:hover,
.dashboard-refresh-btn:focus-visible,
.dashboard-link-btn:focus-visible {
  border-color: var(--dashboard-primary);
  background: #f0f7f9;
  color: var(--dashboard-primary);
  box-shadow: 0 0 0 4px var(--dashboard-ring);
  transform: translateY(-1px);
}

.dashboard-refresh-btn:hover i,
.dashboard-refresh-btn:focus-visible i {
  animation: dashboardRefreshSpin 0.7s ease;
}

.quick-actions-grid,
.stats-grid {
  margin-bottom: 0;
}

.quick-actions-grid > *,
.stats-grid > * {
  animation: dashboardCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.quick-actions-grid > *:nth-child(2),
.stats-grid > *:nth-child(2) {
  animation-delay: 0.06s;
}

.quick-actions-grid > *:nth-child(3),
.stats-grid > *:nth-child(3) {
  animation-delay: 0.12s;
}

.quick-actions-grid > *:nth-child(4),
.stats-grid > *:nth-child(4) {
  animation-delay: 0.18s;
}

.quick-action {
  position: relative;
  min-height: 72px;
  padding: 14px;
  border-color: var(--dashboard-border);
  border-radius: 8px;
  box-shadow: none;
  overflow: hidden;
}

.quick-action::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(33, 100, 119, 0.08), transparent);
  opacity: 0;
  transform: translateX(-100%);
  transition: opacity 0.2s ease, transform 0.36s ease;
}

.quick-action:hover,
.quick-action:focus-visible {
  border-color: var(--dashboard-primary);
  box-shadow: 0 0 0 4px var(--dashboard-ring);
  outline: 0;
  transform: translateY(-1px);
}

.quick-action:hover::after,
.quick-action:focus-visible::after {
  opacity: 1;
  transform: translateX(100%);
}

.quick-action__icon {
  border-radius: 8px;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.quick-action:hover .quick-action__icon,
.quick-action:focus-visible .quick-action__icon {
  transform: scale(1.06) rotate(-2deg);
}

.quick-action__label {
  font-size: 0.9rem;
  line-height: 1.35;
  position: relative;
  z-index: 1;
}

.quick-action__arrow {
  position: relative;
  z-index: 1;
  transition: color 0.2s ease, transform 0.2s ease;
}

.quick-action:hover .quick-action__arrow,
.quick-action:focus-visible .quick-action__arrow {
  color: var(--dashboard-primary);
  transform: translateX(3px);
}

.metric-card.card {
  position: relative;
  padding: 18px;
  border: 1px solid var(--dashboard-border) !important;
  border-left-width: 4px !important;
  border-radius: 8px !important;
  background: var(--dashboard-surface);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.metric-card.card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(33, 100, 119, 0.06), transparent);
  opacity: 0;
  transform: translateX(-100%);
  transition: opacity 0.2s ease, transform 0.36s ease;
}

.metric-card.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.metric-card.card:hover::after {
  opacity: 1;
  transform: translateX(100%);
}

.metric-card.card > * {
  position: relative;
  z-index: 1;
}

.metric-card--primary {
  border-left-color: var(--dashboard-primary) !important;
}

.metric-card--success {
  border-left-color: #16a34a !important;
}

.metric-card--warning {
  border-left-color: #d97706 !important;
}

.metric-card--danger {
  border-left-color: #dc2626 !important;
}

.metric-card .icon-box {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  flex: 0 0 auto;
  transition: transform 0.2s ease;
}

.metric-card:hover .icon-box {
  transform: scale(1.06) rotate(-2deg);
}

.metric-card--primary .icon-box {
  background: #eaf5f7;
  color: var(--dashboard-primary);
}

.metric-card h3 {
  color: var(--dashboard-ink);
  font-size: 1.55rem;
  line-height: 1.1;
  animation: dashboardNumberPop 0.34s ease both;
}

.dashboard-container > .row.g-4 > * {
  animation: dashboardCardIn 0.54s cubic-bezier(0.16, 1, 0.3, 1) both 0.12s;
}

.dashboard-container > .row.g-4 > *:nth-child(2) {
  animation-delay: 0.2s;
}

.dashboard-panel.card {
  position: relative;
  padding: clamp(1rem, 1.8vw, 1.35rem);
  border: 1px solid var(--dashboard-border) !important;
  border-radius: 8px !important;
  background: var(--dashboard-surface);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.dashboard-panel.card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.07);
  transform: none;
}

.dashboard-card-header {
  margin-bottom: 1rem !important;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid var(--dashboard-soft-border);
}

.dashboard-card-header h5 {
  color: var(--dashboard-ink);
  font-size: 1rem;
  letter-spacing: 0;
}

.dashboard-workflow-row {
  margin-bottom: 0;
}

.approval-list,
.activity-list {
  display: grid;
  gap: 0.75rem;
}

.approval-item,
.activity-item {
  width: 100%;
  min-height: 74px;
  padding: 12px;
  border: 1px solid var(--dashboard-border);
  border-radius: 8px;
  background: var(--dashboard-surface);
  color: inherit;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

button.approval-item:hover,
button.approval-item:focus-visible,
button.activity-item:hover,
button.activity-item:focus-visible {
  border-color: var(--dashboard-primary);
  background: var(--dashboard-soft);
  box-shadow: 0 0 0 4px var(--dashboard-ring);
  transform: translateY(-1px);
  outline: 0;
}

.approval-avatar,
.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  font-weight: 800;
}

.approval-copy,
.activity-copy {
  min-width: 0;
  flex: 1;
  display: grid;
  gap: 0.2rem;
}

.approval-title,
.activity-title {
  color: var(--dashboard-ink);
  font-size: 0.9rem;
  font-weight: 800;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.approval-meta,
.activity-description {
  color: var(--dashboard-muted);
  font-size: 0.76rem;
  line-height: 1.45;
}

.approval-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem 0.75rem;
}

.approval-meta span:first-child,
.activity-description {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.approval-action {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f1f5f9;
  color: var(--dashboard-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

button.approval-item:hover .approval-action,
button.approval-item:focus-visible .approval-action {
  background: #eaf5f7;
  color: var(--dashboard-primary);
  transform: translateX(2px);
}

.activity-icon {
  background: #eaf5f7;
  color: var(--dashboard-primary);
  font-size: 1rem;
}

.activity-icon--success {
  background: #e6f4ea;
  color: #15803d;
}

.activity-icon--warning {
  background: #fff4e5;
  color: #b45309;
}

.activity-icon--danger {
  background: #fdf2f2;
  color: #b42318;
}

.activity-time {
  color: var(--dashboard-muted);
  flex: 0 0 auto;
  font-size: 0.74rem;
  font-weight: 700;
  white-space: nowrap;
}

.dashboard-empty--compact {
  min-height: 240px;
}

.skeleton-line--approval-name {
  width: min(170px, 72%);
}

.skeleton-line--approval-email {
  width: min(230px, 88%);
  height: 10px;
}

.skeleton-action-pill {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex: 0 0 auto;
}

.skeleton-activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  flex: 0 0 auto;
}

.skeleton-line--activity-title {
  width: min(220px, 70%);
}

.skeleton-line--activity-copy {
  width: min(320px, 88%);
  height: 10px;
}

.skeleton-line--activity-time {
  width: 92px;
  height: 11px;
  flex: 0 0 auto;
}

.table-responsive {
  margin: 0 -0.25rem;
}

.table {
  margin-bottom: 0;
}

.table thead th {
  padding: 12px 14px;
  background-color: var(--dashboard-soft);
  color: var(--dashboard-muted);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
  white-space: nowrap;
}

.table tbody td {
  padding: 14px;
  vertical-align: middle;
}

.table tbody tr {
  animation: dashboardFieldIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.dashboard-clickable-row {
  cursor: pointer;
}

.dashboard-clickable-row:focus-visible {
  outline: 0;
}

.dashboard-clickable-row:focus-visible > * {
  background-color: var(--dashboard-soft);
  box-shadow: inset 0 0 0 2px var(--dashboard-ring);
}

.table tbody tr:nth-child(2) {
  animation-delay: 0.04s;
}

.table tbody tr:nth-child(3) {
  animation-delay: 0.08s;
}

.table tbody tr:nth-child(4) {
  animation-delay: 0.12s;
}

.table tbody tr:nth-child(5) {
  animation-delay: 0.16s;
}

.table-hover>tbody>tr:hover>* {
  background-color: var(--dashboard-soft);
}

.avatar-sq {
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.table-hover > tbody > tr:hover .avatar-sq {
  transform: scale(1.05);
}

.badge-status {
  min-width: 86px;
  padding: 6px 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 999px;
  font-size: 0.72rem;
  line-height: 1;
}

.badge-status__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex: 0 0 auto;
  animation: dashboardStatusPulse 2.4s ease-in-out infinite;
}

.table-action-btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 8px;
  background: #f1f5f9;
  color: var(--dashboard-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.table-action-btn:hover,
.table-action-btn:focus-visible {
  background: #eaf5f7;
  color: var(--dashboard-primary);
  transform: rotate(90deg);
  outline: 0;
}

.dashboard-row-menu {
  display: inline-flex;
  position: relative;
}

.dashboard-action-menu {
  min-width: 184px;
  padding: 0.35rem;
  border: 1px solid var(--dashboard-border);
  border-radius: 8px;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.14);
  z-index: 20;
}

.dashboard-action-menu .dropdown-item {
  border-radius: 6px;
  color: var(--dashboard-ink);
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.48rem 0.65rem;
}

.dashboard-action-menu .dropdown-item:hover,
.dashboard-action-menu .dropdown-item:focus {
  background: var(--dashboard-soft);
  color: var(--dashboard-primary);
}

.upcoming-list {
  gap: 0.75rem;
}

.upcoming-list > * {
  animation: dashboardFieldIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.upcoming-list > *:nth-child(2) {
  animation-delay: 0.06s;
}

.upcoming-list > *:nth-child(3) {
  animation-delay: 0.12s;
}

.upcoming-event {
  min-height: 76px;
  padding: 14px;
  border-color: var(--dashboard-border);
  border-radius: 8px;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.upcoming-event:hover,
.upcoming-event:focus-visible {
  border-color: var(--dashboard-primary);
  background: var(--dashboard-soft);
  box-shadow: 0 0 0 4px var(--dashboard-ring);
  transform: translateY(-1px);
  outline: 0;
}

.event-date {
  font-size: 0.78rem;
}

.dashboard-empty {
  min-height: 170px;
  border-radius: 8px;
  background: var(--dashboard-soft);
  animation: dashboardFadeRise 0.42s ease both;
}

.dashboard-empty__icon {
  border-radius: 8px;
  animation: dashboardEmptyIcon 3.2s ease-in-out infinite;
}

.dashboard-content-swap-enter-active,
.dashboard-content-swap-leave-active {
  transition: opacity 0.26s ease, transform 0.26s ease;
}

.dashboard-content-swap-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.dashboard-content-swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes dashboardPageSweep {
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

@keyframes dashboardHeaderSweep {
  0%,
  28% {
    opacity: 0;
    transform: translateX(-100%);
  }

  48% {
    opacity: 1;
  }

  76%,
  100% {
    opacity: 0;
    transform: translateX(100%);
  }
}

@keyframes dashboardFadeRise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dashboardCardIn {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dashboardFieldIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dashboardNumberPop {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dashboardStatusPulse {
  0%,
  100% {
    box-shadow: 0 0 0 rgba(33, 100, 119, 0);
    transform: scale(1);
  }

  50% {
    box-shadow: 0 0 0 5px rgba(33, 100, 119, 0.12);
    transform: scale(1.12);
  }
}

@keyframes dashboardEmptyIcon {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-4px);
  }
}

@keyframes dashboardRefreshSpin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    gap: 0.85rem;
    padding: 0;
  }

  .dashboard-page-header {
    padding: 18px;
  }

  .dashboard-refresh-btn,
  .dashboard-link-btn {
    width: 100%;
    justify-content: center;
  }

  .dashboard-card-header {
    gap: 0.75rem;
  }

  .approval-item,
  .activity-item {
    align-items: flex-start;
  }

  .activity-item {
    flex-wrap: wrap;
  }

  .activity-time {
    margin-left: 52px;
    width: calc(100% - 52px);
  }

  .approval-meta span:first-child,
  .activity-description {
    max-width: 100%;
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
