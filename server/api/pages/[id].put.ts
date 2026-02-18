

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { title, content } = body

    // We should verify ownership first, but simpler:
    // Find page first
    const existingPage = await prisma.page.findUnique({
        where: { id }
    })

    if (!existingPage) {
        throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    }

    const member = await prisma.workspaceMember.findFirst({
        where: {
            userId: user.id,
            workspaceId: existingPage.workspaceId
        }
    })

    if (!member) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const page = await prisma.page.update({
        where: { id },
        data: {
            title,
            content,
            updatedAt: new Date()
        }
    })

    return page
})
