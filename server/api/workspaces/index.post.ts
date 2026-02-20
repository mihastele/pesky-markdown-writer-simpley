import { db, randomUUID } from '../../utils/db'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const body = await readBody(event)
    const { name } = body

    if (!name || !name.trim()) {
        throw createError({ statusCode: 400, statusMessage: 'Workspace name is required' })
    }

    const now = new Date().toISOString()
    const workspaceId = randomUUID()
    const memberId = randomUUID()
    const pageId = randomUUID()

    const createWorkspace = db.transaction(() => {
        db.prepare(
            'INSERT INTO Workspace (id, name, ownerId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
        ).run(workspaceId, name.trim(), user.id, now, now)

        db.prepare(
            'INSERT INTO WorkspaceMember (id, userId, workspaceId, role, createdAt) VALUES (?, ?, ?, ?, ?)'
        ).run(memberId, user.id, workspaceId, 'OWNER', now)

        // Create initial welcome page
        db.prepare(
            'INSERT INTO Page (id, title, content, workspaceId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(pageId, 'Welcome', '<p>Start writing in your new workspace...</p>', workspaceId, now, now)
    })

    createWorkspace()

    return {
        id: workspaceId,
        name: name.trim(),
        ownerId: user.id,
        createdAt: now,
        updatedAt: now,
    }
})
