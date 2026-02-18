
<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      
      <div @click="close" class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Invite Member
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500 mb-4">
                  Enter the email address of the user you want to invite to this workspace.
                </p>
                
                <input 
                  v-model="email" 
                  type="email" 
                  placeholder="user@example.com" 
                  class="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                  @keyup.enter="invite"
                />

                <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
                <p v-if="success" class="text-emerald-500 text-sm mt-2">{{ success }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button @click="invite" :disabled="loading" type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
            {{ loading ? 'Inviting...' : 'Invite' }}
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
  workspaceId: string
}>()

const emit = defineEmits(['update:modelValue'])

const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

const close = () => {
    emit('update:modelValue', false)
    email.value = ''
    error.value = ''
    success.value = ''
}

const invite = async () => {
    if (!email.value) return
    
    loading.value = true
    error.value = ''
    success.value = ''

    try {
        await $fetch(`/api/workspaces/${props.workspaceId}/members`, {
            method: 'POST',
            body: { email: email.value }
        })
        success.value = 'User added successfully!'
        email.value = ''
        setTimeout(() => {
             close()
        }, 1500)
    } catch (e: any) {
        error.value = e.data?.statusMessage || 'Failed to invite user'
    } finally {
        loading.value = false
    }
}
</script>
