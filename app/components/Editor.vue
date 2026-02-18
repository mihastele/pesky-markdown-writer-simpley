<template>
  <div class="editor max-w-3xl mx-auto py-8 px-4">
    <div v-if="editor" class="mb-4 border-b border-gray-200 pb-2 flex gap-2">
       <!-- Toolbar -->
       <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'bg-gray-200': editor.isActive('bold') }" class="p-1 rounded hover:bg-gray-100">
         <span class="font-bold">B</span>
       </button>
       <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'bg-gray-200': editor.isActive('italic') }" class="p-1 rounded hover:bg-gray-100">
         <span class="italic">I</span>
       </button>
       <button @click="editor.chain().focus().toggleStrike().run()" :class="{ 'bg-gray-200': editor.isActive('strike') }" class="p-1 rounded hover:bg-gray-100">
         <span class="line-through">S</span>
       </button>
       <div class="w-px h-6 bg-gray-300 mx-1"></div>
       <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="{ 'bg-gray-200': editor.isActive('heading', { level: 1 }) }" class="p-1 rounded hover:bg-gray-100">
         H1
       </button>
       <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'bg-gray-200': editor.isActive('heading', { level: 2 }) }" class="p-1 rounded hover:bg-gray-100">
         H2
       </button>
       <button @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'bg-gray-200': editor.isActive('bulletList') }" class="p-1 rounded hover:bg-gray-100">
         List
       </button>
       <button @click="addImage" class="p-1 rounded hover:bg-gray-100">
         Image
       </button>
    </div>
    <editor-content :editor="editor" class="prose prose-emerald max-w-none focus:outline-none" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'

const props = defineProps<{
  modelValue: string
  editable?: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const addImage = () => {
  const url = window.prompt('URL')
  if (url) {
    editor.value?.chain().focus().setImage({ src: url }).run()
  }
}

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Image,
    Placeholder.configure({
      placeholder: 'Type something...',
    }),
  ],
  editable: props.editable !== false,
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

// Watch for external content changes
watch(() => props.modelValue, (newValue) => {
  if (editor.value && newValue !== editor.value.getHTML()) {
    // Only update if content is different to avoid cursor jumps
    // Actually, comparing HTML might be tricky. proper way is to keep track of transaction.
    // But for now, simple implementation.
    // This might cause cursor jumps if external update happens while typing.
    // But since we only update locally on type, it should be fine.
    // The issue is if we switch pages, modelValue changes completely.
    editor.value.commands.setContent(newValue, false)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style>
.ProseMirror:focus {
  outline: none;
}
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
</style>
