import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    // Get all workspaces the user is a member of (including owned)
    const memberships = await prisma.workspaceMember.findMany({
        where: { userId: user.id },
        include: {
            workspace: {
                include: {
                    owner: {
                        select: { id: true, name: true, email: true }
                    },
                    _count: {
                        select: { members: true, pages: true }
                    }
                }
            }
        }
    })

    return memberships.map(m => ({
        id: m.workspace.id,
        name: m.workspace.name,
        role: m.role,
        owner: m.workspace.owner,
        memberCount: m.workspace._count.members,
        pageCount: m.workspace._count.pages,
    }))
})
