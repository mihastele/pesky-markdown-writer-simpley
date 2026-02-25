import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
    const user = event.context.user

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    }

    // Fetch full user details
    const dbUser = db.prepare('SELECT id, email, name FROM User WHERE id = ?').get(user.id) as any

    if (!dbUser) {
        throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    // Get owned workspaces
    const ownedWorkspaces = db.prepare('SELECT * FROM Workspace WHERE ownerId = ?').all(dbUser.id)

    // Get all workspaces user is a member of (via WorkspaceMember join)
    const workspaces = db.prepare(`
        SELECT w.* FROM Workspace w
        INNER JOIN WorkspaceMember wm ON w.id = wm.workspaceId
        WHERE wm.userId = ?
    `).all(dbUser.id)

    return {
        user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            ownedWorkspaces,
            workspaces,
        }
    }
})
