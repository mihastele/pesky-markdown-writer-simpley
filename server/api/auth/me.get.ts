export default defineEventHandler(async (event) => {
    const user = event.context.user

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    }

    // Fetch full user details including workspaces
    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
            ownedWorkspaces: true,
            workspaces: {
                include: {
                    workspace: true
                }
            }
        }
    })

    if (!dbUser) {
        throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    return {
        user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            ownedWorkspaces: dbUser.ownedWorkspaces,
            workspaces: dbUser.workspaces.map(m => m.workspace)
        }
    }
})
