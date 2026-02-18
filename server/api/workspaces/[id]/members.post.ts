// Removed direct PrismaClient import to use singleton
// import { PrismaClient } from '@prisma/client'
// const prisma = new PrismaClient()
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const workspaceId = getRouterParam(event, 'id') as string
    const body = await readBody(event)
    const { email } = body

    if (!email) {
        throw createError({ statusCode: 400, statusMessage: 'Email is required' })
    }

    // Check if user exists
    const userToAdd = await prisma.user.findUnique({
        where: { email }
    })

    if (!userToAdd) {
        throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    // Check if workspace exists and current user is owner
    // For now, allow owners to add members.
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { members: true }
    })

    if (!workspace) {
        throw createError({ statusCode: 404, statusMessage: 'Workspace not found' })
    }

    if (workspace.ownerId !== user.id) {
        // Maybe allow members to add others? Strict owner for now.
        throw createError({ statusCode: 403, statusMessage: 'Only workspace owner can add members' })
    }

    // Check if already a member
    const isMember = await prisma.workspaceMember.findFirst({
        where: {
            workspaceId,
            userId: userToAdd.id
        }
    })

    if (isMember) {
        return { message: 'User is already a member' }
    }

    // Add member
    await prisma.workspaceMember.create({
        data: {
            workspaceId,
            userId: userToAdd.id,
            role: 'MEMBER'
        }
    })

    return { message: 'User added to workspace' }
})
