

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    // Get user's workspace (assuming single workspace for now)
    const member = await prisma.workspaceMember.findFirst({
        where: { userId: user.id },
        include: { workspace: true }
    })

    if (!member) {
        return []
    }

    // Fetch all pages for the workspace
    // We will structure them on client side or we can use recursion query here?
    // Prisma doesn't support recursive queries easily.
    // Let's fetch all and build tree on client or fetch root pages and include children recursively?
    // Recursive include is limited in Prisma. 
    // Best approach: Fetch ALL pages for workspace (lightweight, just id, title, parentId) and build tree on client.

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
