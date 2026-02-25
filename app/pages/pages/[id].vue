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
                  <span v-else-if="isCollabActive">Synced</span>
                  <span v-else>Saved</span>
             </div>
        </div>
      </div>
      
      <ClientOnly>
        <Editor 
            :key="pageId"
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
    console.error('Failed to fetch page:', e)
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
      console.error('Update failed:', e)
      saveError.value = true
  } finally {
      saving.value = false
  }
}

const updateTitle = () => {
  if (title.value !== page.value.title) {
    updatePage({ title: title.value })
  }
}

// Whether collaboration is active (provider connected).
// When active, the Hocuspocus server handles content persistence via onStoreDocument.
// We should NOT save content from the client to avoid race conditions and
// overwriting the Yjs-managed content with stale/empty HTML.
const isCollabActive = computed(() => !!collabProvider.value)

// Debounce content updates to avoid spamming API
let timeout: NodeJS.Timeout

const normalizeHtmlContent = (html?: string) => {
  return (html || '')
    .replace(/<[^>]*>/g, '') // strip tags
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const onContentChange = (newContent: string) => {
  content.value = newContent

  // When collaboration is active, the Hocuspocus server persists content
  // (both Yjs binary state AND HTML to Page.content) via its onStoreDocument hook.
  // Do NOT save content from the client to avoid race conditions.
  if (isCollabActive.value) return

  // Do not save while still loading/fetching or before page is known.
  if (loading.value || !page.value) {
    content.value = newContent ?? ''
    return
  }

  // Avoid sending empty/unchanged payloads (e.g. when the editor boots with an empty doc
  // before the fetched content arrives).
  const incoming = newContent ?? ''
  const existing = page.value?.content ?? content.value ?? ''
  const normalizedIncoming = normalizeHtmlContent(incoming)
  const normalizedExisting = normalizeHtmlContent(existing)
  
  if (normalizedIncoming === normalizedExisting) {
    content.value = incoming
    return
  }

  // If the stored content has meaning but the editor emitted an empty payload, ignore it.
  if (normalizedExisting && !normalizedIncoming) {
    return
  }

  content.value = incoming
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    // Re-check collaboration state at execution time to avoid race conditions.
    if (isCollabActive.value) return
    updatePage({ content: incoming })
  }, 1000)
}
</script>
