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
        <div class="hidden group-hover:flex items-center absolute right-1 bg-gray-100 pl-1 rounded">
          <button @click.stop="openMenu($event, page.id)" class="p-0.5 hover:bg-gray-200 rounded text-gray-500" title="Options">
             <MoreHorizontal class="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <!-- Recursion -->
      <div v-if="isExpanded(page.id) && page.children?.length" class="pl-4 border-l border-gray-200 ml-2.5 mt-0.5">
        <PageTree :pages="page.children" />
      </div>
    </li>
    
    <!-- Menu Portal -->
    <Teleport to="body">
      <div v-if="activeMenuId" class="fixed inset-0 z-40" @click="closeMenu"></div>
      <div 
        v-if="activeMenuId" 
        class="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 py-1 w-40"
        :style="{ top: `${menuY}px`, left: `${menuX}px` }"
      >
         <button @click="renamePage(activeMenuId)" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
            <Edit class="w-3 h-3 mr-2" /> Rename
         </button>
         <button @click="createChild(activeMenuId)" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
            <FilePlus class="w-3 h-3 mr-2" /> Add sub-page
         </button>
         <div class="border-t border-gray-100 my-1"></div>
         <button @click="deletePage(activeMenuId)" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
            <Trash2 class="w-3 h-3 mr-2" /> Delete
         </button>
      </div>
    </Teleport>
  </ul>
</template>

<script setup lang="ts">
import { MoreHorizontal, FilePlus, Trash2, Edit } from 'lucide-vue-next'

const props = defineProps<{
  pages: any[]
}>()

const route = useRoute()
const pagesStore = usePagesStore()
const expanded = ref<Set<string>>(new Set())

const activeMenuId = ref<string | null>(null)
const menuX = ref(0)
const menuY = ref(0)

const isExpanded = (id: string) => expanded.value.has(id)
const toggleExpand = (id: string) => {
  if (expanded.value.has(id)) {
    expanded.value.delete(id)
  } else {
    expanded.value.add(id)
  }
}

const isActive = (id: string) => route.params.id === id

const openMenu = (event: MouseEvent, id: string) => {
    activeMenuId.value = id
    // Position menu
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    menuX.value = rect.right + 5
    if (menuX.value + 160 > window.innerWidth) {
        menuX.value = rect.left - 165
    }
    menuY.value = rect.top
}

const closeMenu = () => {
    activeMenuId.value = null
}

const createChild = async (parentId: string | null) => {
  closeMenu()
  if (!parentId) return // Should not happen in context menu logic here
  await pagesStore.createPage('Untitled', parentId)
  expanded.value.add(parentId)
}

const deletePage = async (id: string | null) => {
  closeMenu()
  if (!id) return
  if (confirm('Are you sure you want to delete this page?')) {
    await pagesStore.deletePage(id)
    if (isActive(id)) {
      navigateTo('/')
    }
  }
}

const renamePage = async (id: string | null) => {
    closeMenu()
    if (!id) return
    const page = props.pages.find(p => p.id === id) || { title: '' } // This might fail if deep nested, need store lookup?
    // Actually we can just find it in store pages list
    const currentTitle = pagesStore.pages.find(p => p.id === id)?.title || ''
    
    const newTitle = prompt('Enter new page title', currentTitle)
    if (newTitle !== null && newTitle !== currentTitle) {
        await pagesStore.updatePage(id, { title: newTitle })
    }
}
</script>

<script lang="ts">
export default {
    name: 'PageTree'
}
</script>
