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
            console.log('🟢 Store fetchPages called:', { workspaceId })
            this.loading = true
            try {
                const query = workspaceId ? `?workspaceId=${workspaceId}` : ''
                console.log('🟢 Store fetching pages from API:', `/api/pages${query}`)
                const pages = await $fetch<Page[]>(`/api/pages${query}`)
                console.log('🟢 Store fetched pages:', { 
                    count: pages.length, 
                    firstPagePreview: pages[0] ? { id: pages[0].id, title: pages[0].title, contentLength: pages[0].content?.length || 0 } : null 
                })
                this.pages = pages
            } catch (e) {
                console.error('🟢 Store fetchPages failed:', e)
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
            console.log('🟢 Store updatePage called:', { id, updates, isContentUpdate: updates.hasOwnProperty('content') })
            
            // Don't do optimistic updates for content to avoid conflicts with collaboration
            // Only do optimistic updates for metadata like title
            const isContentUpdate = updates.hasOwnProperty('content')
            
            if (!isContentUpdate) {
                // Optimistic update for non-content changes
                const index = this.pages.findIndex(p => p.id === id)
                if (index !== -1) {
                    console.log('🟢 Store doing optimistic update for non-content')
                    this.pages[index] = { ...this.pages[index], ...updates } as Page
                }
            } else {
                console.log('🟢 Store skipping optimistic update for content')
            }

            try {
                console.log('🟢 Store sending API request to update page')
                const response = await $fetch<Page>(`/api/pages/${id}`, {
                    method: 'PUT',
                    body: updates
                })
                
                console.log('🟢 Store API response received:', { 
                    responseId: response.id, 
                    responseTitle: response.title,
                    responseContentLength: response.content?.length || 0,
                    responseContentPreview: response.content?.substring(0, 100) + '...'
                })
                
                // Update with server response for all changes
                const updatedIndex = this.pages.findIndex(p => p.id === id)
                if (updatedIndex !== -1) {
                    console.log('🟢 Store updating local state with server response')
                    this.pages[updatedIndex] = { ...this.pages[updatedIndex], ...response }
                }
                
                return response
            } catch (e) {
                console.error('🟢 Store updatePage failed:', e)
                // Revert optimistic changes and refetch
                if (!isContentUpdate) {
                    console.log('🟢 Store reverting and refetching due to error')
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
