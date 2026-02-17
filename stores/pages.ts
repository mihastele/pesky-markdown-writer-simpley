import { defineStore } from 'pinia'

type Page = {
    id: string
    title: string
    parentId: string | null
    updatedAt: string
    children?: Page[]
    // content is not needed in tree usually, but we might want it for preview? No.
}

export const usePagesStore = defineStore('pages', {
    state: () => ({
        pages: [] as Page[],
        loading: false
    }),
    getters: {
        pageTree: (state) => {
            const buildTree = (parentId: string | null): Page[] => {
                return state.pages
                    .filter(p => p.parentId === parentId)
                    .map(p => ({
                        ...p,
                        children: buildTree(p.id)
                    }))
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            }
            return buildTree(null)
        }
    },
    actions: {
        async fetchPages() {
            this.loading = true
            try {
                const pages = await $fetch<Page[]>('/api/pages')
                this.pages = pages
            } catch (e) {
                console.error('Failed to fetch pages', e)
            } finally {
                this.loading = false
            }
        },
        async createPage(title: string, parentId?: string) {
            const page = await $fetch<Page>('/api/pages', {
                method: 'POST',
                body: { title, parentId }
            })
            this.pages.push(page)
            return page
        },
        async updatePage(id: string, updates: Partial<Page>) {
            // Optimistic update
            const index = this.pages.findIndex(p => p.id === id)
            if (index !== -1) {
                this.pages[index] = { ...this.pages[index], ...updates }
            }

            try {
                await $fetch(`/api/pages/${id}`, {
                    method: 'PUT',
                    body: updates
                })
            } catch (e) {
                // Revert or fetch?
                this.fetchPages()
            }
        },
        async deletePage(id: string) {
            // Optimistic delete?
            // Removing from state is tricky because of children.
            // Easiest is to filter out locally first.

            this.pages = this.pages.filter(p => p.id !== id)
            // Also remove children? 
            // If we fetched flat list, children are just items with parentId = id.
            // We need to recursively remove them from local state too.

            const removeRecursive = (parentId: string) => {
                const children = this.pages.filter(p => p.parentId === parentId)
                children.forEach(c => {
                    this.pages = this.pages.filter(k => k.id !== c.id)
                    removeRecursive(c.id)
                })
            }
            removeRecursive(id)

            await $fetch(`/api/pages/${id}`, { method: 'DELETE' })
        }
    }
})
