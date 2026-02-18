import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { db, randomUUID } from '../../utils/db'

const SECRET = process.env.JWT_SECRET || 'changethis'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { email, password, name } = body

    if (!email || !password) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Email and password are required',
        })
    }

    const existingUser = db.prepare('SELECT id FROM User WHERE email = ?').get(email)

    if (existingUser) {
        throw createError({
            statusCode: 400,
            statusMessage: 'User already exists',
        })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Transaction to create user, workspace, and member
    const now = new Date().toISOString()
    const userId = randomUUID()
    const workspaceId = randomUUID()
    const memberId = randomUUID()
    const pageId = randomUUID()

    const createUser = db.transaction(() => {
        db.prepare(
            'INSERT INTO User (id, email, password, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(userId, email, hashedPassword, name || null, now, now)

        db.prepare(
            'INSERT INTO Workspace (id, name, ownerId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
        ).run(workspaceId, `${name || email}'s Workspace`, userId, now, now)

        db.prepare(
            'INSERT INTO WorkspaceMember (id, userId, workspaceId, role, createdAt) VALUES (?, ?, ?, ?, ?)'
        ).run(memberId, userId, workspaceId, 'OWNER', now)

        db.prepare(
            'INSERT INTO Page (id, title, content, workspaceId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(pageId, 'Welcome to Pesky Writer', '<p>Start writing your notes here...</p>', workspaceId, now, now)
    })

    createUser()

    const token = jwt.sign({ id: userId, email }, SECRET, { expiresIn: '7d' })

    // Set cookie
    setCookie(event, 'auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    })

    return {
        user: {
            id: userId,
            email,
            name: name || null,
        },
    }
})
