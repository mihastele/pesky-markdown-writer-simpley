<template>
  <div class="flex -space-x-2 overflow-hidden items-center">
    <div 
      v-for="user in users" 
      :key="user.clientId" 
      class="relative inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600"
      :style="{ backgroundColor: user.color }"
      :title="user.name"
    >
      {{ getInitials(user.name) }}
    </div>
    <div v-if="users.length === 0" class="text-xs text-gray-400 italic ml-2">
        No other editors
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  provider: any
}>()

const users = computed(() => {
  if (!props.provider) return []
  // Hocuspocus/Yjs awareness states
  const states = props.provider.awareness.getStates()
  return Array.from(states.entries())
    .filter(([clientId, state]: [number, any]) => clientId !== props.provider.awareness.clientID && state.user)
    .map(([clientId, state]: [number, any]) => ({ ...state.user, clientId }))
})

const getInitials = (name: string) => {
  return name ? name.substring(0, 2).toUpperCase() : '?'
}
</script>
