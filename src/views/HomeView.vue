<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/API/api';

const router = useRouter();

// ១. State សម្រាប់ទុកទិន្នន័យ
const stats = ref({
  total: 0,
  approved: 0,
  pending: 0,
  deactivated: 0
});
const recentRegistrations = ref([]);
const isLoading = ref(true);

const PRIMARY_COLOR = '#216477';

const normalizeStatus = (value) => String(value || 'PENDING').toUpperCase();

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
    const response = await api.get('/users' + '?_page=1&_per_page=100');

    // ទាញយកទិន្នន័យពី API តាមរូបភាព [image_ccffa6.png]
    const allUsers = response.data?.data?.items || response.data?.items || [];

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
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<template>
  <div class="dashboard-container p-4">
    <!-- ផ្នែកក្បាល (Header Section) -->
    <div class="d-flex justify-content-between align-items-center mb-4">
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
    <div class="row g-3 mb-5">
      <!-- អតីតនិស្សិតសរុប -->
      <div class="col-md-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 h-100 border-start border-4"
          :style="{ borderColor: PRIMARY_COLOR + ' !important' }">
          <div class="d-flex align-items-center">
            <div class="icon-box me-3"><i class="bi bi-people fs-4"></i></div>
            <div>
              <p class="text-muted small mb-0">អតីតនិស្សិតសរុប</p>
              <h3 class="fw-bold mb-0">{{ stats.total }}</h3>
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
              <h3 class="fw-bold mb-0">{{ stats.approved }}</h3>
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
              <h3 class="fw-bold mb-0">{{ stats.pending }}</h3>
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
              <h3 class="fw-bold mb-0">{{ stats.deactivated }}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <!-- តារាងការចុះឈ្មោះថ្មីៗ -->
      <div class="col-lg-12">
        <div class="card border-0 shadow-sm rounded-4 p-4 h-100">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="fw-bold mb-0">ការចុះឈ្មោះថ្មីៗ</h5>
            <button @click="router.push('/manager-alumni')"
              class="btn btn-light btn-sm rounded-pill px-3 border shadow-sm">មើលទាំងអស់</button>
          </div>

          <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted small">កំពុងផ្ទុកទិន្នន័យបេក្ខជន...</p>
          </div>

          <div v-else class="table-responsive">
            <table class="table align-middle table-hover">
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
                        {{ user.email.charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <div class="fw-bold text-dark small">{{ user.email.split('@')[0] }}</div>
                        <div class="text-muted extra-small">{{ user.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="small text-center text-muted">
                    {{ new Date().toLocaleDateString('km-KH') }}
                  </td>
                  <td class="text-center">
                    <span :class="['badge-status', getUserStatus(user) === 'APPROVE' ? 'approved' : 'pending']">
                      • {{ getUserStatus(user) === 'APPROVE' ? 'បានអនុម័ត' : 'រង់ចាំ' }}
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

    </div>
  </div>
</template>

<style scoped>
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
</style>