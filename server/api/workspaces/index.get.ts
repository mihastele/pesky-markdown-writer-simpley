import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    // Get all workspaces the user is a member of, with owner info and counts
    const workspaces = db.prepare(`
        SELECT
            w.id,
            w.name,
            wm.role,
            u.id as ownerId,
            u.name as ownerName,
            u.email as ownerEmail,
            (SELECT COUNT(*) FROM WorkspaceMember wm2 WHERE wm2.workspaceId = w.id) as memberCount,
            (SELECT COUNT(*) FROM Page p WHERE p.workspaceId = w.id) as pageCount
        FROM WorkspaceMember wm
        INNER JOIN Workspace w ON w.id = wm.workspaceId
        INNER JOIN User u ON u.id = w.ownerId
        WHERE wm.userId = ?
    `).all(user.id) as any[]

    return workspaces.map(w => ({
        id: w.id,
        name: w.name,
        role: w.role,
        owner: { id: w.ownerId, name: w.ownerName, email: w.ownerEmail },
        memberCount: w.memberCount,
        pageCount: w.pageCount,
    }))
})
