import { db, randomUUID } from '../../../utils/db'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const workspaceId = getRouterParam(event, 'id') as string
    const body = await readBody(event)
    const { email } = body

    if (!email) {
        throw createError({ statusCode: 400, statusMessage: 'Email is required' })
    }

    // Check if user exists
    const userToAdd = db.prepare('SELECT id FROM User WHERE email = ?').get(email) as any

    if (!userToAdd) {
        throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    // Check if workspace exists and current user is owner
    const workspace = db.prepare('SELECT * FROM Workspace WHERE id = ?').get(workspaceId) as any

    if (!workspace) {
        throw createError({ statusCode: 404, statusMessage: 'Workspace not found' })
    }

    if (workspace.ownerId !== user.id) {
        throw createError({ statusCode: 403, statusMessage: 'Only workspace owner can add members' })
    }

    // Check if already a member
    const isMember = db.prepare(
        'SELECT id FROM WorkspaceMember WHERE workspaceId = ? AND userId = ?'
    ).get(workspaceId, userToAdd.id)

    if (isMember) {
        return { message: 'User is already a member' }
    }

    // Add member
    const memberId = randomUUID()
    const now = new Date().toISOString()
    db.prepare(
        'INSERT INTO WorkspaceMember (id, userId, workspaceId, role, createdAt) VALUES (?, ?, ?, ?, ?)'
    ).run(memberId, userToAdd.id, workspaceId, 'MEMBER', now)

    return { message: 'User added to workspace' }
})
