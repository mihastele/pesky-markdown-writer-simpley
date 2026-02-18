<template>
  <div class="h-full flex flex-col">
    <div v-if="page" class="flex-1 overflow-y-auto">
      <!-- Title input -->
      <div class="max-w-3xl mx-auto pt-8 px-4 flex justify-between items-center">
        <input 
          v-model="title" 
          @blur="updateTitle"
          class="w-full text-4xl font-bold border-none focus:ring-0 placeholder-gray-300 px-0 bg-transparent" 
          placeholder="Untitled"
        />
        <div class="text-sm text-gray-400 whitespace-nowrap ml-4">
             <span v-if="saving">Saving...</span>
             <span v-else-if="saveError" class="text-red-500">Error saving!</span>
             <span v-else>Saved</span>
        </div>
      </div>
      
      <ClientOnly>
        <Editor v-model="content" @update:modelValue="onContentChange" />
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
const route = useRoute()
const pagesStore = usePagesStore()

const pageId = computed(() => route.params.id as string)
const page = ref<any>(null)
const loading = ref(true)
const title = ref('')
const content = ref('')

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
  content.value = newContent
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    updatePage({ content: newContent })
  }, 1000)
}
</script>
