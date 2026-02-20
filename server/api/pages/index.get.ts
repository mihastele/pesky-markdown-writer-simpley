import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const query = getQuery(event)
    const workspaceId = query.workspaceId as string | undefined

    // If a specific workspace is requested, verify membership
    if (workspaceId) {
        const member = db.prepare(
            'SELECT id FROM WorkspaceMember WHERE userId = ? AND workspaceId = ?'
        ).get(user.id, workspaceId)

        if (!member) {
            throw createError({ statusCode: 403, statusMessage: 'Not a member of this workspace' })
        }

        const pages = db.prepare(
            'SELECT id, title, parentId, updatedAt FROM Page WHERE workspaceId = ? ORDER BY updatedAt DESC'
        ).all(workspaceId)

        return pages
    }

    // Default: get pages from user's first workspace membership
    const member = db.prepare(
        'SELECT workspaceId FROM WorkspaceMember WHERE userId = ? LIMIT 1'
    ).get(user.id) as any

    if (!member) {
        return []
    }

    const pages = db.prepare(
        'SELECT id, title, parentId, updatedAt FROM Page WHERE workspaceId = ? ORDER BY updatedAt DESC'
    ).all(member.workspaceId)

    return pages
})
