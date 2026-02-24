import jwt from 'jsonwebtoken'
import { db } from '../utils/db'

const SECRET = process.env.JWT_SECRET || 'changethis'

export default defineEventHandler(async (event) => {
    // Skip auth check for login/register endpoints and WebSocket
    if (event.path.startsWith('/api/auth/login') || 
        event.path.startsWith('/api/auth/register') ||
        event.path.startsWith('/ws')) {
        return
    }

    const token = getCookie(event, 'auth_token')
    console.log('🔵 Auth middleware: checking token for path:', event.path, { hasToken: !!token })

    if (!token) {
        console.log('🔵 Auth middleware: no token found')
        return
    }

    try {
        const decoded: any = jwt.verify(token, SECRET)
        console.log('🔵 Auth middleware: token decoded for user ID:', decoded.id)
        
        const user = db.prepare('SELECT id, email, name FROM User WHERE id = ?').get(decoded.id) as any

        if (user) {
            console.log('🔵 Auth middleware: user found:', { id: user.id, email: user.email })
            event.context.user = user
        } else {
            console.log('🔵 Auth middleware: user not found in database for ID:', decoded.id)
        }
    } catch (e) {
        console.error('🔵 Auth middleware: token verification failed:', e)
        // Token invalid
    }
})
