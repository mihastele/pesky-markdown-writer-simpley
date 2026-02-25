import { defineStore } from 'pinia'

type Page = {
    id: string
    title: string
    content?: string
    parentId: string | null
    updatedAt: string
    workspaceId?: string
    children?: Page[]
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
        async fetchPages(workspaceId?: string) {
            this.loading = true
            try {
                const query = workspaceId ? `?workspaceId=${workspaceId}` : ''
                const pages = await $fetch<Page[]>(`/api/pages${query}`)
                this.pages = pages
            } catch (e) {
                console.error('fetchPages failed:', e)
            } finally {
                this.loading = false
            }
        },
        async createPage(title: string, parentId?: string, workspaceId?: string) {
            const page = await $fetch<Page>('/api/pages', {
                method: 'POST',
                body: { title, parentId, workspaceId }
            })
            this.pages.push(page)
            return page
        },
        async updatePage(id: string, updates: Partial<Page>) {
            // Don't do optimistic updates for content to avoid conflicts with collaboration
            // Only do optimistic updates for metadata like title
            const isContentUpdate = updates.hasOwnProperty('content')
            
            if (!isContentUpdate) {
                // Optimistic update for non-content changes
                const index = this.pages.findIndex(p => p.id === id)
                if (index !== -1) {
                    this.pages[index] = { ...this.pages[index], ...updates } as Page
                }
            }

            try {
                const response = await $fetch<Page>(`/api/pages/${id}`, {
                    method: 'PUT',
                    body: updates
                })
                
                // Update with server response for all changes
                const updatedIndex = this.pages.findIndex(p => p.id === id)
                if (updatedIndex !== -1) {
                    this.pages[updatedIndex] = { ...this.pages[updatedIndex], ...response }
                }
                
                return response
            } catch (e) {
                console.error('updatePage failed:', e)
                // Revert optimistic changes and refetch
                if (!isContentUpdate) {
                    this.fetchPages()
                }
                throw e
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
