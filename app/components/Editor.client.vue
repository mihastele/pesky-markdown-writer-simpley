<template>
  <div class="editor-wrapper max-w-3xl mx-auto py-8 px-4" :class="{ 'is-uploading': isUploading }">
    <div v-if="editor" class="mb-4 sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 pb-2 flex flex-wrap gap-1">
       <!-- Toolbar -->
       <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'bg-gray-200 text-black': editor.isActive('bold'), 'text-gray-500 hover:bg-gray-100': !editor.isActive('bold') }" class="p-1.5 rounded transition-colors" title="Bold">
         <Bold :size="18" />
       </button>
       <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'bg-gray-200 text-black': editor.isActive('italic'), 'text-gray-500 hover:bg-gray-100': !editor.isActive('italic') }" class="p-1.5 rounded transition-colors" title="Italic">
         <Italic :size="18" />
       </button>
       <button @click="editor.chain().focus().toggleStrike().run()" :class="{ 'bg-gray-200 text-black': editor.isActive('strike'), 'text-gray-500 hover:bg-gray-100': !editor.isActive('strike') }" class="p-1.5 rounded transition-colors" title="Strikethrough">
         <Strikethrough :size="18" />
       </button>
       
       <div class="w-px h-6 bg-gray-200 mx-1 self-center"></div>
       
       <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="{ 'bg-gray-200 text-black': editor.isActive('heading', { level: 1 }), 'text-gray-500 hover:bg-gray-100': !editor.isActive('heading', { level: 1 }) }" class="p-1.5 rounded transition-colors" title="Heading 1">
         <Heading1 :size="18" />
       </button>
       <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'bg-gray-200 text-black': editor.isActive('heading', { level: 2 }), 'text-gray-500 hover:bg-gray-100': !editor.isActive('heading', { level: 2 }) }" class="p-1.5 rounded transition-colors" title="Heading 2">
         <Heading2 :size="18" />
       </button>
       <button @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'bg-gray-200 text-black': editor.isActive('bulletList'), 'text-gray-500 hover:bg-gray-100': !editor.isActive('bulletList') }" class="p-1.5 rounded transition-colors" title="Bullet List">
         <List :size="18" />
       </button>
       
       <div class="w-px h-6 bg-gray-200 mx-1 self-center"></div>
       
       <button @click="triggerImageUpload" class="p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors" title="Upload Image">
         <ImageIcon :size="18" />
       </button>
       
       <span v-if="isUploading" class="ml-auto text-xs text-gray-400 self-center animate-pulse">Uploading...</span>
    </div>
    
    <div v-if="editor" class="relative min-h-[500px]" @click="focusEditor">
        <BubbleMenu :editor="editor" v-if="editor">
          <div v-if="editor.isActive('image')" class="bg-white shadow-lg border rounded p-1 flex gap-1">
             <button @click="deleteImage" class="p-1 hover:bg-red-50 text-red-500 rounded" title="Delete Image"><Trash2 :size="16" /></button>
          </div>
          <div v-else class="bg-white shadow-lg border rounded p-1 flex gap-1">
             <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'bg-gray-100 text-black': editor.isActive('bold'), 'text-gray-500 hover:bg-gray-50': !editor.isActive('bold') }" class="p-1 rounded transition-colors" title="Bold"><Bold :size="16" /></button>
             <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'bg-gray-100 text-black': editor.isActive('italic'), 'text-gray-500 hover:bg-gray-50': !editor.isActive('italic') }" class="p-1 rounded transition-colors" title="Italic"><Italic :size="16" /></button>
             <button @click="editor.chain().focus().toggleStrike().run()" :class="{ 'bg-gray-100 text-black': editor.isActive('strike'), 'text-gray-500 hover:bg-gray-50': !editor.isActive('strike') }" class="p-1 rounded transition-colors" title="Strike"><Strikethrough :size="16" /></button>
          </div>
        </BubbleMenu>

        <EditorContent :editor="editor" class="prose prose-emerald max-w-none focus:outline-none" />
        <div v-if="isDragging" class="absolute inset-0 bg-blue-50/50 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none flex items-center justify-center">
            <span class="text-blue-500 font-medium bg-white px-4 py-2 rounded shadow-sm">Drop image to upload</span>
        </div>
    </div>
    <div v-else class="min-h-[500px] flex items-center justify-center text-gray-400">
        Loading editor...
    </div>

    <input 
      type="file" 
      ref="fileInput" 
      class="hidden" 
      accept="image/*" 
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { Bold, Italic, Strikethrough, Heading1, Heading2, List, Image as ImageIcon, Trash2 } from 'lucide-vue-next'
import { ref, watch, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  editable?: boolean
}>(), {
  editable: true,
})

const emit = defineEmits(['update:modelValue'])

const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const isDragging = ref(false)

const triggerImageUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    await uploadImage(input.files[0])
  }
  input.value = '' // Reset input
}

const uploadImage = async (file: File, pos?: number) => {
  if (!file.type.startsWith('image/')) return

  isUploading.value = true
  
  const formData = new FormData()
  formData.append('file', file)

  try {
    const { url } = await $fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (url) {
        if (pos !== undefined) {
             editor.value?.chain().focus().insertContentAt(pos, { type: 'image', attrs: { src: url } }).run()
        } else {
             editor.value?.chain().focus().setImage({ src: url }).run()
        }
    }
  } catch (error) {
    console.error('Upload failed', error)
    alert('Image upload failed')
  } finally {
    isUploading.value = false
  }
}

const deleteImage = () => {
    if (editor.value) {
        const { state } = editor.value
        const { selection } = state
        const node = state.doc.nodeAt(selection.from)
        if (node && node.type.name === 'image') {
            editor.value.chain().focus().deleteRange({ from: selection.from, to: selection.from + node.nodeSize }).run()
        } else {
            editor.value.chain().focus().deleteSelection().run()
        }
    }
}

const focusEditor = () => {
    if (editor.value && !editor.value.isFocused) {
        editor.value.chain().focus().run()
    }
}

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Image.configure({
      inline: false,
      allowBase64: true,
    }),
    Placeholder.configure({
      placeholder: "Type something... (or drag & drop images)",
    }),
  ],
  editable: props.editable,
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
  editorProps: {
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const file = event.dataTransfer.files[0]
          if (file && file.type.startsWith('image/')) {
            // Calculate position
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
             if (coordinates) {
                 uploadImage(file, coordinates.pos)
                 return true // Handled
             }
          }
        }
        return false
      },
      handlePaste: (view, event, slice) => {
          const items = (event.clipboardData || (event as any).originalEvent?.clipboardData)?.items
          if (items) {
              for (const item of items) {
                  if (item.type.indexOf('image') === 0) {
                      const file = item.getAsFile()
                      if (file) {
                          uploadImage(file)
                          return true // handled
                      }
                  }
              }
          }
          return false
      },
      // Simple drag state tracking
      handleDOMEvents: {
          dragover: (view, event) => {
              isDragging.value = true
              return false
          },
          dragleave: (view, event) => {
              isDragging.value = false
              return false
          },
          drop: (view, event) => {
              isDragging.value = false
              return false
          }
      }
  }
})

// Keep editable state in sync with prop
watch(() => props.editable, (value) => {
  editor.value?.setEditable(!!value)
})

// Watch for external content changes
watch(() => props.modelValue, (newValue) => {
  if (editor.value && newValue !== editor.value.getHTML()) {
    editor.value.commands.setContent(newValue, false as any)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style>
/* Custom Scrollbar for editor if needed, or other styles */
.ProseMirror {
    min-height: 500px;
}
.ProseMirror:focus {
  outline: none;
}
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #9ca3af;
  pointer-events: none;
  height: 0;
}
/* Image styling */
.ProseMirror img {
    border-radius: 6px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    margin-top: 1rem;
    margin-bottom: 1rem;
    max-width: 100%;
}
.ProseMirror img.ProseMirror-selectednode {
    outline: 2px solid #10b981; /* Emerald-500 */
}
</style>
