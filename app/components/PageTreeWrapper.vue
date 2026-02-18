<template>
  <div>
    <div class="px-2 mb-2 flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider group">
      <span>Pages</span>
      <button @click="createRootPage" class="hover:bg-gray-200 p-0.5 rounded text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
         <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    </div>
    <PageTree :pages="pagesStore.pageTree" />
  </div>
</template>

<script setup lang="ts">
const pagesStore = usePagesStore()
const auth = useAuthStore()

const fetchPagesForWorkspace = () => {
  const wsId = auth.activeWorkspaceId
  pagesStore.fetchPages(wsId || undefined)
}

onMounted(() => {
  fetchPagesForWorkspace()
})

// Re-fetch when active workspace changes
watch(() => auth.activeWorkspaceId, () => {
  fetchPagesForWorkspace()
})

const createRootPage = async () => {
  const wsId = auth.activeWorkspaceId
  const page = await pagesStore.createPage('Untitled', undefined, wsId || undefined)
  navigateTo(`/pages/${page.id}`)
}
</script>
