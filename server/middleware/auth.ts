import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'changethis'

export default defineEventHandler(async (event) => {
    // Skip auth check for login/register endpoints
    if (event.path.startsWith('/api/auth/login') || event.path.startsWith('/api/auth/register')) {
        return
    }

    const token = getCookie(event, 'auth_token')

    if (!token) {
        // If API request, maybe return 401? But for SSR we might want to just not set user.
        // Let's just return if no token, user will be undefined.
        return
    }

    try {
        const decoded: any = jwt.verify(token, SECRET)
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, name: true }
        })

        if (user) {
            event.context.user = user
        }
    } catch (e) {
        // Token invalid
    }
})
