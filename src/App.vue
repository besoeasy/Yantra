<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Box, Boxes, Images, ClipboardList, AlertTriangle, Github } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const isActive = (name) => route.name === name
</script>

<template>
  <div class="min-h-screen flex bg-white text-gray-900">
    <!-- Minimal Sidebar -->
    <aside class="bg-white flex flex-col items-center border-r border-gray-200 w-20 py-6 px-2 fixed h-screen z-50">
      <!-- Logo -->
      <h1 class="text-lg font-bold text-gray-900 mb-8 uppercase leading-tight text-center">
        Yan<br/>tra
      </h1>

      <!-- Navigation -->
      <nav class="flex flex-col items-center gap-3 mb-auto">
        <!-- Apps Tab -->
        <router-link 
          to="/apps"
          :class="isActive('apps') ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'"
          class="relative w-12 h-12 rounded-full flex items-center justify-center transition-all smooth-shadow"
          title="Apps">
          <Box :size="20" />
        </router-link>

        <!-- Containers Tab -->
        <router-link 
          to="/containers"
          :class="isActive('containers') ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'"
          class="relative w-12 h-12 rounded-full flex items-center justify-center transition-all smooth-shadow"
          title="Containers">
          <Boxes :size="20" />
        </router-link>

        <!-- Images Tab -->
        <router-link 
          to="/images"
          :class="isActive('images') ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'"
          class="relative w-12 h-12 rounded-full flex items-center justify-center transition-all smooth-shadow"
          title="Images">
          <Images :size="20" />
        </router-link>

        <!-- Logs Tab -->
        <router-link 
          to="/logs"
          :class="isActive('logs') ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'"
          class="relative w-12 h-12 rounded-full flex items-center justify-center transition-all smooth-shadow"
          title="Logs">
          <ClipboardList :size="20" />
        </router-link>
      </nav>

      <!-- Bottom Actions -->
      <div class="flex flex-col items-center gap-3 mt-4">
        <!-- GitHub -->
        <a 
          href="https://github.com/besoeasy/Yantra" 
          target="_blank"
          class="w-12 h-12 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all"
          title="View on GitHub">
          <Github :size="20" />
        </a>

        <!-- Report Issue -->
        <a 
          href="https://github.com/besoeasy/Yantra/issues/new" 
          target="_blank"
          class="w-12 h-12 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all"
          title="Report Issue">
          <AlertTriangle :size="20" />
        </a>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="ml-20 flex-1 min-h-screen">
      <router-view />
    </main>
  </div>
</template>