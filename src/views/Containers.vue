<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Store, ArrowRight, AlertTriangle, Package, HardDrive, Activity, TrendingUp } from 'lucide-vue-next'

const router = useRouter()

const containers = ref([])
const volumes = ref([])
const loading = ref(false)
const apiUrl = ref('')
const currentTime = ref(Date.now())
const watchtowerInstalled = ref(false)

let containersRefreshInterval = null
let timeRefreshInterval = null

// Computed properties to separate volume browsers from regular containers
const volumeBrowsers = computed(() => 
  containers.value.filter(c => c.labels && c.labels['yantra.volume-browser'])
)

const regularContainers = computed(() => 
  containers.value.filter(c => !c.labels || !c.labels['yantra.volume-browser'])
)

// Metrics computed properties
const totalApps = computed(() => regularContainers.value.length)
const runningApps = computed(() => regularContainers.value.filter(c => c.state === 'running').length)
const totalVolumes = computed(() => volumes.value.length)
const activeVolumeBrowsers = computed(() => volumeBrowsers.value.length)

// Helper function to format time remaining
function formatTimeRemaining(expireAt) {
  const expirationTime = parseInt(expireAt, 10) * 1000 // Convert to milliseconds
  const remaining = expirationTime - currentTime.value
  
  if (remaining <= 0) return 'Expired'
  
  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

// Check if container is temporary
function isTemporary(container) {
  return container.labels && container.labels['yantra.expireAt']
}

// Get expiration info
function getExpirationInfo(container) {
  if (!isTemporary(container)) return null
  
  const expireAt = container.labels['yantra.expireAt']
  return {
    expireAt,
    timeRemaining: formatTimeRemaining(expireAt),
    isExpiringSoon: (parseInt(expireAt, 10) * 1000 - currentTime.value) < (60 * 60 * 1000) // < 1 hour
  }
}

// Format container uptime
function formatUptime(container) {
  if (!container.created || container.state !== 'running') return null
  
  const createdTime = container.created * 1000 // Convert to milliseconds
  const uptime = currentTime.value - createdTime
  
  if (uptime <= 0) return 'Just started'
  
  const days = Math.floor(uptime / (1000 * 60 * 60 * 24))
  const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) {
    return `${days}d ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

async function fetchContainers() {
  try {
    const response = await fetch(`${apiUrl.value}/api/containers`)
    const data = await response.json()
    if (data.success) {
      containers.value = data.containers
      
      watchtowerInstalled.value = data.containers.some(c => 
        c.name?.toLowerCase().includes('watchtower') || 
        c.Names?.some(name => name.toLowerCase().includes('watchtower'))
      )
    }
  } catch (error) {
    console.error('Failed to fetch containers:', error)
  }
}

async function fetchVolumes() {
  try {
    const response = await fetch(`${apiUrl.value}/api/volumes`)
    const data = await response.json()
    if (data.success) {
      volumes.value = data.volumes || []
    }
  } catch (error) {
    console.error('Failed to fetch volumes:', error)
  }
}

function viewContainerDetail(container) {
  router.push(`/containers/${container.id}`)
}

onMounted(async () => {
  loading.value = true
  await Promise.all([fetchContainers(), fetchVolumes()])
  loading.value = false
  
  containersRefreshInterval = setInterval(() => {
    fetchContainers()
    fetchVolumes()
  }, 10000)
  
  timeRefreshInterval = setInterval(() => {
    currentTime.value = Date.now()
  }, 60000)
})

onUnmounted(() => {
  if (containersRefreshInterval) {
    clearInterval(containersRefreshInterval)
    containersRefreshInterval = null
  }
  if (timeRefreshInterval) {
    clearInterval(timeRefreshInterval)
    timeRefreshInterval = null
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="p-4 sm:p-6 lg:p-8">
      <div class="mx-auto space-y-6">
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-20">
          <div class="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <div class="text-gray-600 font-medium">Loading...</div>
        </div>

        <!-- Empty State -->
        <div v-else-if="containers.length === 0" class="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
        <div class="text-6xl mb-4">🎯</div>
        <div class="text-gray-900 font-bold text-2xl mb-2">Welcome to Yantra!</div>
        <div class="text-gray-600 mb-6">No containers running yet. Get started by installing apps.</div>
        <router-link to="/apps"
          class="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
          <Store :size="20" />
          <span>Browse App Store</span>
        </router-link>
      </div>

      <!-- All Containers Section -->
      <div v-if="regularContainers.length > 0 || volumeBrowsers.length > 0" class="space-y-4">
        <div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); grid-auto-rows: auto;">
          <!-- Watchtower Not Installed Card -->
          <div v-if="!watchtowerInstalled"
               @click="router.push('/apps/watchtower')"
               class="relative overflow-hidden bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-orange-300">
            <!-- Animated background pattern -->
            <div class="absolute inset-0 opacity-10">
              <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 32px 32px;"></div>
            </div>
            
            <div class="relative">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-2">
                  <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <AlertTriangle :size="24" class="text-white animate-pulse" />
                  </div>
                  <div>
                    <div class="text-xs font-bold text-orange-100 uppercase tracking-wider">Action Required</div>
                    <div class="text-2xl font-black text-white tracking-tight">
                      Watchtower
                    </div>
                  </div>
                </div>
                <div class="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight :size="16" class="text-white" />
                </div>
              </div>
              
              <p class="text-white/90 text-sm leading-relaxed mb-3">
                Enable <span class="font-bold text-white">automatic updates</span> for all your apps every 3 hours.
              </p>
              
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
                  <span class="text-white/90 text-xs">🔄</span>
                  <span class="text-white text-xs font-semibold">Auto-updates</span>
                </div>
                <div class="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
                  <span class="text-white/90 text-xs">🛡️</span>
                  <span class="text-white text-xs font-semibold">Security</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Regular Application Containers -->
          <div v-for="(container, index) in regularContainers" :key="container.id"
            :style="{ animationDelay: `${index * 50}ms` }"
            @click="viewContainerDetail(container)"
            class="group bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 cursor-pointer animate-fadeIn">
            
            <div class="flex items-start gap-4 mb-4">
              <div class="shrink-0">
                <img v-if="container.app.logo" :src="container.app.logo" :alt="container.name"
                  class="w-14 h-14 object-contain rounded-lg">
                <span v-else class="text-4xl">🐳</span>
              </div>
              
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-lg text-gray-900 truncate mb-1">
                  {{ container.name }}
                </h3>
                <div class="flex items-center gap-2 flex-wrap">
                  <div :class="container.state === 'running' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
                    class="px-2 py-0.5 rounded-md text-xs font-semibold inline-flex items-center gap-1">
                    <span :class="container.state === 'running' ? 'bg-green-500' : 'bg-gray-400'" 
                      class="w-1.5 h-1.5 rounded-full"></span>
                    {{ container.state }}
                  </div>
                  <div v-if="container.state === 'running' && formatUptime(container)"
                    class="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 inline-flex items-center gap-1">
                    <Activity :size="12" />
                    {{ formatUptime(container) }}
                  </div>
                  <div v-if="isTemporary(container)" 
                    :class="getExpirationInfo(container).isExpiringSoon ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'"
                    class="px-2 py-0.5 rounded-md text-xs font-semibold">
                    ⏱️ {{ getExpirationInfo(container).timeRemaining }}
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-2 text-xs text-gray-600">
              <div class="flex items-start gap-2">
                <span class="font-semibold shrink-0">Image:</span>
                <span class="font-mono break-all">{{ container.image }}</span>
              </div>
              <div v-if="isTemporary(container)" 
                :class="getExpirationInfo(container).isExpiringSoon ? 'bg-red-50 border-red-200 text-red-700' : 'bg-orange-50 border-orange-200 text-orange-700'"
                class="px-2 py-1.5 rounded-lg border">
                <div class="font-semibold mb-0.5">⏱️ Temporary Installation</div>
                <div class="opacity-80 text-[10px]">
                  Auto-deletes in {{ getExpirationInfo(container).timeRemaining }}
                </div>
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span class="text-sm text-gray-600 group-hover:text-gray-900 font-medium transition-colors">
                View Details
              </span>
              <ArrowRight :size="16" class="text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          <!-- Divider Card -->
          <div v-if="volumeBrowsers.length > 0" 
               class="col-span-full relative overflow-hidden rounded-3xl p-px">
            <!-- Gradient border -->
            <div class="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 rounded-3xl"></div>
            
            <!-- Inner content with glassmorphism -->
            <div class="relative bg-white/95 backdrop-blur-xl rounded-3xl p-6">
              <!-- Subtle gradient overlay -->
              <div class="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-blue-50/50 rounded-3xl"></div>
              
              <div class="relative flex items-center justify-between">
                <div class="flex items-center gap-4">
                  
                  <div>
                    <h3 class="text-2xl font-bold text-gray-900 tracking-tight mb-1">Open Volumes</h3>
                    <p class="text-sm text-gray-600 font-medium flex items-center gap-1.5">
                      <span class="text-base">💡</span>
                      <span>Temporary file browsers • Safe to close anytime</span>
                    </p>
                  </div>
                </div>
                
                <!-- Badge with subtle animation -->
                <div class="relative">
                  <div class="absolute inset-0 bg-purple-400 rounded-2xl blur-md opacity-20"></div>
                  <div class="relative px-4 py-2 bg-gradient-to-br from-purple-100 to-indigo-100 border border-purple-200/50 text-purple-700 rounded-2xl font-bold tracking-tight shadow-sm">
                    {{ volumeBrowsers.length }} <span class="font-normal">active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Volume Browser Containers -->
          <div v-for="(container, index) in volumeBrowsers" :key="container.id"
            :style="{ animationDelay: `${(regularContainers.length + index) * 50}ms` }"
            @click="viewContainerDetail(container)"
            class="group relative overflow-hidden rounded-2xl cursor-pointer animate-fadeIn hover-lift">
            
            <!-- Glassmorphic background -->
            <div class="absolute inset-0 bg-gradient-to-br from-white via-purple-50/50 to-indigo-50/50 backdrop-blur-sm"></div>
            
            <!-- Border gradient -->
            <div class="absolute inset-0 bg-gradient-to-br from-purple-200/60 via-indigo-200/40 to-blue-200/60 rounded-2xl opacity-100 group-hover:opacity-0 transition-opacity duration-300"></div>
            <div class="absolute inset-0 bg-gradient-to-br from-purple-400 via-indigo-400 to-blue-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <!-- Content -->
            <div class="relative m-px bg-white/90 backdrop-blur-xl rounded-2xl p-5">
              <div class="flex items-start gap-4 mb-4">
                
                <div class="flex-1 min-w-0">
                  <h3 class="font-bold text-lg text-gray-900 truncate mb-2 group-hover:text-purple-900 transition-colors">
                    {{ container.labels['yantra.volume-browser'] }}
                  </h3>
                  <div class="flex items-center gap-2 flex-wrap">
                    <!-- Status badge -->
                    <div :class="container.state === 'running' ? 'bg-green-500/10 text-green-700 border-green-500/20' : 'bg-gray-500/10 text-gray-600 border-gray-500/20'"
                      class="px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border backdrop-blur-sm">
                      <span :class="container.state === 'running' ? 'bg-green-500' : 'bg-gray-400'" 
                        class="w-1.5 h-1.5 rounded-full shadow-sm"
                        :style="container.state === 'running' ? 'box-shadow: 0 0 4px rgba(34, 197, 94, 0.6)' : ''"></span>
                      {{ container.state }}
                    </div>
                    
                    <!-- Uptime badge -->
                    <div v-if="container.state === 'running' && formatUptime(container)"
                      class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-700 border border-blue-500/20 inline-flex items-center gap-1.5 backdrop-blur-sm">
                      <Activity :size="12" />
                      {{ formatUptime(container) }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer with smooth hover effect -->
              <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span class="text-sm text-gray-600 group-hover:text-purple-700 font-semibold transition-colors">
                  View Details
                </span>
                <div class="w-8 h-8 rounded-full bg-purple-100/50 group-hover:bg-purple-500 flex items-center justify-center transition-all duration-300">
                  <ArrowRight :size="16" class="text-purple-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  opacity: 0;
  animation: fadeIn 0.5s ease-out forwards;
}

/* Apple-like hover lift effect */
.hover-lift {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-lift:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 8px 16px -8px rgba(124, 58, 237, 0.2);
}

.hover-lift:active {
  transform: translateY(-2px) scale(1);
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Smooth backdrop blur support */
@supports (backdrop-filter: blur(20px)) or (-webkit-backdrop-filter: blur(20px)) {
  .backdrop-blur-xl {
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
  }
  
  .backdrop-blur-sm {
    -webkit-backdrop-filter: blur(4px);
    backdrop-filter: blur(4px);
  }
}
</style>
