<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div @click="close" class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Create New Workspace
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500 mb-4">
                  Create a new workspace to organize your pages. You can invite members after creating it.
                </p>
                
                <input 
                  v-model="name" 
                  type="text" 
                  placeholder="Workspace name" 
                  class="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                  @keyup.enter="create"
                  ref="nameInput"
                />

                <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button @click="create" :disabled="loading || !name.trim()" type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
            {{ loading ? 'Creating...' : 'Create Workspace' }}
          </button>
          <button @click="close" type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue', 'created'])

const auth = useAuthStore()
const pagesStore = usePagesStore()
const name = ref('')
const loading = ref(false)
const error = ref('')
const nameInput = ref<HTMLInputElement | null>(null)

watch(() => props.modelValue, (val) => {
  if (val) {
    nextTick(() => nameInput.value?.focus())
  }
})

const close = () => {
    emit('update:modelValue', false)
    name.value = ''
    error.value = ''
}

const create = async () => {
    if (!name.value.trim()) return
    
    loading.value = true
    error.value = ''

    try {
        const workspace = await auth.createWorkspace(name.value.trim())
        // Refetch pages for the new workspace
        await pagesStore.fetchPages(workspace.id)
        emit('created', workspace)
        close()
        navigateTo('/')
    } catch (e: any) {
        error.value = e.data?.statusMessage || 'Failed to create workspace'
    } finally {
        loading.value = false
    }
}
</script>
