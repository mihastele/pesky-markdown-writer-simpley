import jwt from 'jsonwebtoken'
import { db } from '../utils/db'

const SECRET = process.env.JWT_SECRET || 'changethis'

export default defineEventHandler(async (event) => {
    // Skip auth check for login/register endpoints
    if (event.path.startsWith('/api/auth/login') || event.path.startsWith('/api/auth/register')) {
        return
    }

    const token = getCookie(event, 'auth_token')

    if (!token) {
        return
    }

    try {
        const decoded: any = jwt.verify(token, SECRET)
        const user = db.prepare('SELECT id, email, name FROM User WHERE id = ?').get(decoded.id) as any

        if (user) {
            event.context.user = user
        }
    } catch (e) {
        // Token invalid
    }
})
