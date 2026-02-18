<template>
  <div class="flex h-screen bg-white">
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300" :class="{ '-ml-64': !sidebarOpen }">
      <div class="h-14 flex items-center px-4 border-b border-gray-200 justify-between">
        <div class="flex items-center min-w-0">
          <span class="font-semibold text-gray-700 truncate" v-if="auth.user">{{ auth.user.name }}'s Workspace</span>
          <span class="font-semibold text-gray-700" v-else>Pesky Writer</span>
        </div>
        <button v-if="isOwner" @click="showInviteDialog = true" class="text-gray-500 hover:text-emerald-600 p-1 rounded hover:bg-gray-100" title="Invite Member">
           <UserPlusIcon class="w-4 h-4" />
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2">
        <nav class="space-y-1">
          <NuxtLink to="/" class="flex items-center px-2 py-1.5 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 group">
             <!-- Icon home -->
             <svg class="mr-3 h-4 w-4 text-gray-500 group-hover:text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
             </svg>
             Home
          </NuxtLink>
          
          <!-- Page Tree -->
          <div class="mt-4">
             <PageTreeWrapper v-if="auth.user" />
             <div v-else class="px-2 text-xs text-gray-400">Please login to see pages</div>
          </div>
        </nav>
      </div>

      <div class="p-4 border-t border-gray-200">
        <button v-if="auth.user" @click="auth.logout" class="flex items-center w-full px-2 py-1.5 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900">
           <!-- Icon logout -->
           <svg class="mr-3 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
           </svg>
           Logout
        </button>
        <NuxtLink v-else to="/login" class="flex items-center w-full px-2 py-1.5 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900">
           Login
        </NuxtLink>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top header for mobile sidebar toggle or breadcrumbs -->
      <div class="h-14 border-b border-gray-200 flex items-center px-4" v-if="!sidebarOpen">
         <button @click="sidebarOpen = true" class="text-gray-500 hover:text-gray-900">
            <!-- Icon menu -->
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
         </button>
      </div>
      
      <div class="flex-1 overflow-y-auto">
        <slot />
      </div>
    </main>

    
    <InviteMemberDialog 
      v-if="auth.user && isOwner"
      v-model="showInviteDialog" 
      :workspace-id="auth.user.ownedWorkspaces[0]?.id"
    />
  </div>
</template>

<script setup lang="ts">
import { UserPlus as UserPlusIcon } from 'lucide-vue-next'
const auth = useAuthStore()
const sidebarOpen = ref(true)
const showInviteDialog = ref(false)

const isOwner = computed(() => {
    return auth.user?.ownedWorkspaces && auth.user.ownedWorkspaces.length > 0
})

onMounted(async () => {
  if (!auth.user) {
    await auth.fetchUser()
  }
})
</script>
