import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const body = await readBody(event)
    const { name } = body

    if (!name || !name.trim()) {
        throw createError({ statusCode: 400, statusMessage: 'Workspace name is required' })
    }

    const workspace = await prisma.$transaction(async (tx) => {
        const newWorkspace = await tx.workspace.create({
            data: {
                name: name.trim(),
                ownerId: user.id,
            },
        })

        await tx.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId: newWorkspace.id,
                role: 'OWNER',
            },
        })

        // Create initial welcome page
        await tx.page.create({
            data: {
                title: 'Welcome',
                content: '<p>Start writing in your new workspace...</p>',
                workspaceId: newWorkspace.id,
            },
        })

        return newWorkspace
    })

    return workspace
})
