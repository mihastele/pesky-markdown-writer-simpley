import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const body = await readBody(event)
    const { title, parentId } = body

    // Get user's workspace
    const member = await prisma.workspaceMember.findFirst({
        where: { userId: user.id }
    })

    if (!member) {
        throw createError({ statusCode: 404, statusMessage: 'No workspace found' })
    }

    const page = await prisma.page.create({
        data: {
            title: title || 'Untitled',
            workspaceId: member.workspaceId,
            parentId: parentId || null,
            content: ''
        }
    })

    return page
})
