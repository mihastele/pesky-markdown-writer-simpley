

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const query = getQuery(event)
    const workspaceId = query.workspaceId as string | undefined

    // If a specific workspace is requested, verify membership
    if (workspaceId) {
        const member = await prisma.workspaceMember.findFirst({
            where: { userId: user.id, workspaceId }
        })
        if (!member) {
            throw createError({ statusCode: 403, statusMessage: 'Not a member of this workspace' })
        }

        const pages = await prisma.page.findMany({
            where: { workspaceId },
            select: {
                id: true,
                title: true,
                parentId: true,
                updatedAt: true
            },
            orderBy: { updatedAt: 'desc' }
        })
        return pages
    }

    // Default: get pages from user's first workspace membership
    const member = await prisma.workspaceMember.findFirst({
        where: { userId: user.id },
        include: { workspace: true }
    })

    if (!member) {
        return []
    }

    const pages = await prisma.page.findMany({
        where: {
            workspaceId: member.workspaceId
        },
        select: {
            id: true,
            title: true,
            parentId: true,
            updatedAt: true
        },
        orderBy: {
            updatedAt: 'desc'
        }
    })

    return pages
})
