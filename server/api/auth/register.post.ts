import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
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

    const existingUser = await prisma.user.findUnique({
        where: { email },
    })

    if (existingUser) {
        throw createError({
            statusCode: 400,
            statusMessage: 'User already exists',
        })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Transaction to create user, workspace, and member
    const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        })

        const newWorkspace = await tx.workspace.create({
            data: {
                name: `${name || email}'s Workspace`,
                ownerId: newUser.id,
            },
        })

        await tx.workspaceMember.create({
            data: {
                userId: newUser.id,
                workspaceId: newWorkspace.id,
                role: 'OWNER',
            },
        })

        // Create initial page
        await tx.page.create({
            data: {
                title: 'Welcome to Pesky Writer',
                content: '<p>Start writing your notes here...</p>',
                workspaceId: newWorkspace.id,
            }
        })

        return newUser
    })

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '7d' })

    // Set cookie
    setCookie(event, 'auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    })

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
        },
    }
})
