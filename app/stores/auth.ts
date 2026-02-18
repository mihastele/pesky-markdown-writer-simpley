import { defineStore } from 'pinia'

type Workspace = {
    id: string
    name: string
    role?: string
    owner?: { id: string; name: string; email: string }
    memberCount?: number
    pageCount?: number
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as null | {
            id: string;
            email: string;
            name: string | null;
            ownedWorkspaces: { id: string; name: string }[];
            workspaces: { id: string; name: string }[];
        },
        loading: false,
        activeWorkspaceId: null as string | null,
        allWorkspaces: [] as Workspace[],
    }),
    getters: {
        activeWorkspace(state): Workspace | null {
            if (!state.activeWorkspaceId) return state.allWorkspaces[0] || null
            return state.allWorkspaces.find(w => w.id === state.activeWorkspaceId) || null
        },
        isOwnerOfActiveWorkspace(): boolean {
            const ws = this.activeWorkspace
            if (!ws || !this.user) return false
            return ws.role === 'OWNER' || ws.owner?.id === this.user.id
        }
    },
    actions: {
        async fetchUser() {
            this.loading = true
            try {
                const { user } = await $fetch('/api/auth/me')
                this.user = user
                await this.fetchWorkspaces()
            } catch (e) {
                this.user = null
            } finally {
                this.loading = false
            }
        },
        async fetchWorkspaces() {
            try {
                const workspaces = await $fetch<Workspace[]>('/api/workspaces')
                this.allWorkspaces = workspaces
                if (!this.activeWorkspaceId && workspaces.length > 0) {
                    this.activeWorkspaceId = workspaces[0]!.id
                }
            } catch (e) {
                console.error('Failed to fetch workspaces', e)
            }
        },
        setActiveWorkspace(id: string) {
            this.activeWorkspaceId = id
        },
        async createWorkspace(name: string) {
            const workspace = await $fetch<Workspace>('/api/workspaces', {
                method: 'POST',
                body: { name }
            })
            await this.fetchWorkspaces()
            this.activeWorkspaceId = workspace.id
            return workspace
        },
        async login(password: string, email: string) {
            await $fetch('/api/auth/login', {
                method: 'POST',
                body: { email, password }
            })
            await this.fetchUser()
            navigateTo('/')
        },
        async register(name: string, email: string, password: string) {
            await $fetch('/api/auth/register', {
                method: 'POST',
                body: { name, email, password }
            })
            await this.fetchUser()
            navigateTo('/')
        },
        async logout() {
            const cookie = useCookie('auth_token')
            cookie.value = null
            this.user = null
            this.activeWorkspaceId = null
            this.allWorkspaces = []
            navigateTo('/login')
        }
    }
})
