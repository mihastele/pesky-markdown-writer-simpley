<template>
  <div class="flex h-screen bg-white">
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300" :class="{ '-ml-64': !sidebarOpen }">
      <!-- Workspace Switcher -->
      <div class="h-14 flex items-center px-3 border-b border-gray-200 gap-1">
        <div class="relative flex-1 min-w-0" ref="workspaceSwitcherRef">
          <button 
            @click="showWorkspaceSwitcher = !showWorkspaceSwitcher"
            class="flex items-center w-full px-2 py-1.5 text-sm font-semibold text-gray-700 rounded-md hover:bg-gray-100 truncate gap-1"
          >
            <span class="truncate">{{ auth.activeWorkspace?.name || 'Select Workspace' }}</span>
            <svg class="w-3 h-3 text-gray-400 flex-shrink-0 ml-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <!-- Workspace dropdown -->
          <Teleport to="body">
            <div v-if="showWorkspaceSwitcher" class="fixed inset-0 z-40" @click="showWorkspaceSwitcher = false"></div>
            <div 
              v-if="showWorkspaceSwitcher" 
              class="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 py-1 w-56"
              :style="workspaceSwitcherStyle"
            >
              <div class="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Workspaces</div>
              <button
                v-for="ws in auth.allWorkspaces"
                :key="ws.id"
                @click="switchWorkspace(ws.id)"
                class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                :class="{ 'bg-emerald-50 text-emerald-700': ws.id === auth.activeWorkspaceId }"
              >
                <span class="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {{ ws.name.charAt(0).toUpperCase() }}
                </span>
                <span class="truncate flex-1">{{ ws.name }}</span>
                <span v-if="ws.role === 'OWNER'" class="text-xs text-gray-400">Owner</span>
              </button>
              <div class="border-t border-gray-100 my-1"></div>
              <button
                @click="showCreateWorkspace = true; showWorkspaceSwitcher = false"
                class="w-full text-left px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
              >
                <PlusIcon class="w-4 h-4" />
                Create new workspace
              </button>
            </div>
          </Teleport>
        </div>

        <button v-if="auth.isOwnerOfActiveWorkspace" @click="showInviteDialog = true" class="text-gray-500 hover:text-emerald-600 p-1 rounded hover:bg-gray-100 flex-shrink-0" title="Invite Member">
           <UserPlusIcon class="w-4 h-4" />
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2">
        <nav class="space-y-1">
          <NuxtLink to="/" class="flex items-center px-2 py-1.5 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 group">
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
      <div class="h-14 border-b border-gray-200 flex items-center px-4" v-if="!sidebarOpen">
         <button @click="sidebarOpen = true" class="text-gray-500 hover:text-gray-900">
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
      v-if="auth.user && auth.isOwnerOfActiveWorkspace && auth.activeWorkspace"
      v-model="showInviteDialog" 
      :workspace-id="auth.activeWorkspace.id"
    />

    <CreateWorkspaceDialog
      v-if="auth.user"
      v-model="showCreateWorkspace"
    />
  </div>
</template>

<script setup lang="ts">
import { UserPlus as UserPlusIcon, Plus as PlusIcon } from 'lucide-vue-next'

const auth = useAuthStore()
const pagesStore = usePagesStore()
const sidebarOpen = ref(true)
const showInviteDialog = ref(false)
const showCreateWorkspace = ref(false)
const showWorkspaceSwitcher = ref(false)
const workspaceSwitcherRef = ref<HTMLElement | null>(null)

const workspaceSwitcherStyle = computed(() => {
  if (!workspaceSwitcherRef.value) return {}
  const rect = workspaceSwitcherRef.value.getBoundingClientRect()
  return {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
  }
})

const switchWorkspace = (id: string) => {
  auth.setActiveWorkspace(id)
  showWorkspaceSwitcher.value = false
  pagesStore.fetchPages(id)
  navigateTo('/')
}

onMounted(async () => {
  if (!auth.user) {
    await auth.fetchUser()
  }
})
</script>
