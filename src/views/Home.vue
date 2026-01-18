<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { Box, HardDrive, Image, Activity, TrendingUp, Package } from "lucide-vue-next";

const router = useRouter();

const containers = ref([]);
const volumes = ref([]);
const images = ref([]);
const loading = ref(false);
const apiUrl = ref("");

// Metrics
const totalContainers = computed(() => containers.value.length);
const runningContainers = computed(() => containers.value.filter((c) => c.state === "running").length);
const totalVolumes = computed(() => volumes.value.length);
const totalImages = computed(() => images.value.length);

let refreshInterval = null;

async function fetchContainers() {
  try {
    const response = await fetch(`${apiUrl.value}/api/containers`);
    const data = await response.json();
    if (data.success) {
      containers.value = data.containers;
    }
  } catch (error) {
    console.error("Failed to fetch containers:", error);
  }
}

async function fetchVolumes() {
  try {
    const response = await fetch(`${apiUrl.value}/api/volumes`);
    const data = await response.json();
    if (data.success) {
      volumes.value = data.volumes || [];
    }
  } catch (error) {
    console.error("Failed to fetch volumes:", error);
  }
}

async function fetchImages() {
  try {
    const response = await fetch(`${apiUrl.value}/api/images`);
    const data = await response.json();
    if (data.success) {
      images.value = data.images || [];
    }
  } catch (error) {
    console.error("Failed to fetch images:", error);
  }
}

onMounted(async () => {
  loading.value = true;
  await Promise.all([fetchContainers(), fetchVolumes(), fetchImages()]);
  loading.value = false;

  refreshInterval = setInterval(() => {
    fetchContainers();
    fetchVolumes();
    fetchImages();
  }, 10000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-20">
        <div class="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
        <div class="text-gray-600 font-medium">Loading...</div>
      </div>

      <!-- Stats Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <!-- Containers Card -->
        <div
          @click="router.push('/containers')"
          class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all cursor-pointer group"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Box :size="24" class="text-blue-600" />
            </div>
            <Activity :size="16" class="text-green-500" />
          </div>
          <div class="text-3xl font-bold text-gray-900 mb-1">{{ totalContainers }}</div>
          <div class="text-sm text-gray-600 mb-2">Containers</div>
          <div class="text-xs text-green-600 font-semibold">{{ runningContainers }} running</div>
        </div>

        <!-- Volumes Card -->
        <div
          @click="router.push('/volumes')"
          class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all cursor-pointer group"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <HardDrive :size="24" class="text-purple-600" />
            </div>
            <TrendingUp :size="16" class="text-gray-400" />
          </div>
          <div class="text-3xl font-bold text-gray-900 mb-1">{{ totalVolumes }}</div>
          <div class="text-sm text-gray-600 mb-2">Volumes</div>
          <div class="text-xs text-gray-500 font-semibold">Storage units</div>
        </div>

        <!-- Images Card -->
        <div
          @click="router.push('/images')"
          class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all cursor-pointer group"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Image :size="24" class="text-indigo-600" />
            </div>
          </div>
          <div class="text-3xl font-bold text-gray-900 mb-1">{{ totalImages }}</div>
          <div class="text-sm text-gray-600 mb-2">Images</div>
          <div class="text-xs text-gray-500 font-semibold">Downloaded</div>
        </div>

        <!-- Apps Card -->
        <div
          @click="router.push('/apps')"
          class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all cursor-pointer group"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package :size="24" class="text-green-600" />
            </div>
          </div>
          <div class="text-3xl font-bold text-gray-900 mb-1">Store</div>
          <div class="text-sm text-gray-600 mb-2">Browse Apps</div>
          <div class="text-xs text-gray-500 font-semibold">Discover more</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button @click="router.push('/apps')" class="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left">
            <Package :size="20" class="text-indigo-600" />
            <div>
              <div class="font-semibold text-gray-900">Browse Apps</div>
              <div class="text-xs text-gray-600">Install new applications</div>
            </div>
          </button>

          <button @click="router.push('/containers')" class="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left">
            <Box :size="20" class="text-blue-600" />
            <div>
              <div class="font-semibold text-gray-900">Manage Containers</div>
              <div class="text-xs text-gray-600">View and control containers</div>
            </div>
          </button>

          <button @click="router.push('/volumes')" class="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left">
            <HardDrive :size="20" class="text-purple-600" />
            <div>
              <div class="font-semibold text-gray-900">Browse Volumes</div>
              <div class="text-xs text-gray-600">Explore volume data</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
