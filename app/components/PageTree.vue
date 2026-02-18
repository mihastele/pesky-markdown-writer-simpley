<template>
  <ul class="space-y-0.5">
    <li v-for="page in pages" :key="page.id">
      <div 
        class="group flex items-center px-2 py-1 text-sm font-medium rounded-md cursor-pointer hover:bg-gray-100 relative"
        :class="{ 'bg-emerald-50 text-emerald-700': isActive(page.id) }"
      >
        <button 
          @click.stop="toggleExpand(page.id)"
          class="p-0.5 rounded-sm hover:bg-gray-200 text-gray-400 mr-1"
          :class="{ 'invisible': !page.children?.length }"
        >
           <svg 
             class="w-3 h-3 transition-transform duration-200" 
             :class="{ 'transform rotate-90': isExpanded(page.id) }"
             xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
           >
             <path d="M9 18l6-6-6-6" />
           </svg>
        </button>
        
        <NuxtLink :to="`/pages/${page.id}`" class="flex-1 truncate" @click.stop>
          {{ page.title || 'Untitled' }}
        </NuxtLink>

        <!-- Actions -->
        <div class="hidden group-hover:flex items-center space-x-1 absolute right-1 bg-gray-100 pl-1">
          <button @click.stop="createChild(page.id)" class="p-0.5 hover:bg-gray-200 rounded text-gray-500" title="Add sub-page">
            <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button @click.stop="deletePage(page.id)" class="p-0.5 hover:bg-gray-200 rounded text-gray-500" title="Delete">
            <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
      
      <!-- Recursion -->
      <div v-if="isExpanded(page.id) && page.children?.length" class="pl-4 border-l border-gray-200 ml-2.5 mt-0.5">
        <PageTree :pages="page.children" />
      </div>
    </li>
    
    <!-- Add new page button if at root and list is provided (hacky check for root) -->
    <!-- Ideally we pass a prop 'isRoot' -->
  </ul>
</template>

<script setup lang="ts">
const props = defineProps<{
  pages: any[]
}>()

const route = useRoute()
const pagesStore = usePagesStore()
const expanded = ref<Set<string>>(new Set())

const isExpanded = (id: string) => expanded.value.has(id)
const toggleExpand = (id: string) => {
  if (expanded.value.has(id)) {
    expanded.value.delete(id)
  } else {
    expanded.value.add(id)
  }
}

const isActive = (id: string) => route.params.id === id

const createChild = async (parentId: string) => {
  await pagesStore.createPage('Untitled', parentId)
  expanded.value.add(parentId)
}

const deletePage = async (id: string) => {
  if (confirm('Are you sure you want to delete this page?')) {
    await pagesStore.deletePage(id)
    if (isActive(id)) {
      navigateTo('/')
    }
  }
}

// Auto expand parent of active page
// This requires knowing the path up. Simple implementation: expand all or traverse.
// Since we have flat list in store, we can find parents.
// For now, let's keep it simple.
</script>

<script lang="ts">
export default {
    name: 'PageTree'
}
</script>
