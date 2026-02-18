import { db, randomUUID } from '../../utils/db'

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
        const member = db.prepare(
            'SELECT id FROM WorkspaceMember WHERE userId = ? AND workspaceId = ?'
        ).get(user.id, targetWorkspaceId)

        if (!member) {
            throw createError({ statusCode: 403, statusMessage: 'Not a member of this workspace' })
        }
    } else {
        // Fallback to user's first workspace
        const member = db.prepare(
            'SELECT workspaceId FROM WorkspaceMember WHERE userId = ? LIMIT 1'
        ).get(user.id) as any

        if (!member) {
            throw createError({ statusCode: 404, statusMessage: 'No workspace found' })
        }
        targetWorkspaceId = member.workspaceId
    }

    const now = new Date().toISOString()
    const pageId = randomUUID()

    db.prepare(
        'INSERT INTO Page (id, title, content, workspaceId, parentId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(pageId, title || 'Untitled', '', targetWorkspaceId, parentId || null, now, now)

    return {
        id: pageId,
        title: title || 'Untitled',
        content: '',
        workspaceId: targetWorkspaceId,
        parentId: parentId || null,
        createdAt: now,
        updatedAt: now,
    }
})
