<template>
  <div class="h-full flex flex-col">
    <div v-if="page" class="flex-1 overflow-y-auto">
      <!-- Title input -->
      <div class="max-w-3xl mx-auto pt-8 px-4 flex justify-between items-center mb-4">
        <input 
          v-model="title" 
          @blur="updateTitle"
          class="flex-1 min-w-0 text-4xl font-bold border-none focus:ring-0 placeholder-gray-300 px-0 bg-transparent mr-4" 
          placeholder="Untitled"
        />
        <div class="flex items-center gap-4">
             <ClientOnly>
                <Collaborators :provider="collabProvider" />
             </ClientOnly>
             <div class="text-sm text-gray-400 whitespace-nowrap">
                  <span v-if="saving">Saving...</span>
                  <span v-else-if="saveError" class="text-red-500">Error saving!</span>
                  <span v-else>Saved</span>
             </div>
        </div>
      </div>
      
      <ClientOnly>
        <Editor 
            v-model="content" 
            :page-id="pageId"
            :user="currentUser"
            @update:modelValue="onContentChange" 
            @provider="setProvider"
        />
      </ClientOnly>
    </div>
    <div v-else-if="loading" class="flex items-center justify-center h-full text-gray-400">
      Loading...
    </div>
    <div v-else class="flex items-center justify-center h-full text-gray-400">
      Page not found
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const route = useRoute()
const pagesStore = usePagesStore()
const authStore = useAuthStore()

const pageId = computed(() => route.params.id as string)
const page = ref<any>(null)
const loading = ref(true)
const title = ref('')
const content = ref('')

const collabProvider = ref<any>(null)

const currentUser = computed(() => {
    if (!authStore.user) return undefined
    // Generate a random color based on user ID or name if not available
    const stringToColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xFF;
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    }

    return {
        name: authStore.user.name || authStore.user.email,
        color: stringToColor(authStore.user.id),
    }
})

const setProvider = (p: any) => {
    collabProvider.value = p
}

const fetchPage = async () => {
  loading.value = true
  try {
    const data = await $fetch(`/api/pages/${pageId.value}`)
    page.value = data
    title.value = data.title
    content.value = data.content || ''
  } catch (e) {
    page.value = null
  } finally {
    loading.value = false
  }
}

watch(pageId, fetchPage, { immediate: true })

const saving = ref(false)
const saveError = ref(false)

const updatePage = async (updates: any) => {
  if (!page.value) return
  saving.value = true
  saveError.value = false
  try {
      await pagesStore.updatePage(pageId.value, updates)
  } catch (e) {
      saveError.value = true
      console.error(e)
  } finally {
      saving.value = false
  }
}

const updateTitle = () => {
  if (title.value !== page.value.title) {
    updatePage({ title: title.value })
  }
}

// Debounce content updates to avoid spamming API
// We need @vueuse/core or just write own debounce
// Since I haven't installed @vueuse/core, I'll write a simple debounce
let timeout: NodeJS.Timeout

const onContentChange = (newContent: string) => {
  // If we are using collaboration, we might not want to save on every keystroke
  // but rather rely on Yjs or occasional saves. 
  // For now, keep saving to DB so persistence works if server restarts.
  // Yjs syncs in-memory, but we want DB persistence too.
  
  content.value = newContent
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    updatePage({ content: newContent })
  }, 1000)
}
</script>
