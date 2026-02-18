

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const id = getRouterParam(event, 'id')

    const page = await prisma.page.findUnique({
        where: { id },
        include: {
            parent: {
                select: { id: true, title: true }
            }
        }
    })

    if (!page) {
        throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    }

    // Verify access (check if page belongs to user's workspace)
    const member = await prisma.workspaceMember.findFirst({
        where: {
            userId: user.id,
            workspaceId: page.workspaceId
        }
    })

    if (!member) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    return page
})
