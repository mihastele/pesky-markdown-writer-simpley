<template>
  <div class="p-8 max-w-3xl mx-auto">
    <div v-if="auth.user">
      <h1 class="text-4xl font-bold mb-4">Welcome back, {{ auth.user.name }}</h1>
      <p class="text-gray-600 mb-8">Select a page from the sidebar to start writing.</p>
    </div>
    <div v-else>
      <h1 class="text-4xl font-bold mb-4">Welcome to Pesky Writer</h1>
      <p class="text-xl text-gray-600 mb-8">A simple, distraction-free markdown writer.</p>
      <div class="flex gap-4">
        <NuxtLink to="/login" class="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">Get Started</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()
</script>
