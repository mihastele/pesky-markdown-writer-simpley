import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as null | { id: string; email: string; name: string },
        loading: false
    }),
    actions: {
        async fetchUser() {
            this.loading = true
            try {
                const { user } = await $fetch('/api/auth/me')
                this.user = user
            } catch (e) {
                this.user = null
            } finally {
                this.loading = false
            }
        },
        async login(password: string, email: string) {
            const { user } = await $fetch('/api/auth/login', {
                method: 'POST',
                body: { email, password }
            })
            this.user = user
            navigateTo('/')
        },
        async register(name: string, email: string, password: string) {
            const { user } = await $fetch('/api/auth/register', {
                method: 'POST',
                body: { name, email, password }
            })
            this.user = user
            navigateTo('/')
        },
        async logout() {
            // We need an endpoint to clear cookie or just clear state and redirect
            // Ideally clear cookie on server
            // For now just client side clear and reload? No, cookie persists.
            // We need a logout endpoint.
            // Let's create it quickly or just set cookie to expire.
            // But for now, let's assume we implement logout endpoint.
            // Wait, I missed logout endpoint in plan.
            // I'll add a simple logout server route or just use useCookie to remove it.
            const cookie = useCookie('auth_token')
            cookie.value = null
            this.user = null
            navigateTo('/login')
        }
    }
})
