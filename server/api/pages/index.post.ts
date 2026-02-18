

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const body = await readBody(event)
    const { title, parentId, workspaceId: requestedWorkspaceId } = body

    let targetWorkspaceId = requestedWorkspaceId

    if (targetWorkspaceId) {
        // Verify membership
        const member = await prisma.workspaceMember.findFirst({
            where: { userId: user.id, workspaceId: targetWorkspaceId }
        })
        if (!member) {
            throw createError({ statusCode: 403, statusMessage: 'Not a member of this workspace' })
        }
    } else {
        // Fallback to user's first workspace
        const member = await prisma.workspaceMember.findFirst({
            where: { userId: user.id }
        })
        if (!member) {
            throw createError({ statusCode: 404, statusMessage: 'No workspace found' })
        }
        targetWorkspaceId = member.workspaceId
    }

    const page = await prisma.page.create({
        data: {
            title: title || 'Untitled',
            workspaceId: targetWorkspaceId,
            parentId: parentId || null,
            content: ''
        }
    })

    return page
})
