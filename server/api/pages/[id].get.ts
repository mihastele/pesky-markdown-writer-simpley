import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const id = getRouterParam(event, 'id')

    const page = db.prepare('SELECT * FROM Page WHERE id = ?').get(id) as any

    if (!page) {
        throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    }

    // Verify access (check if page belongs to user's workspace)
    const member = db.prepare(
        'SELECT id FROM WorkspaceMember WHERE userId = ? AND workspaceId = ?'
    ).get(user.id, page.workspaceId)

    if (!member) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // Get parent info if exists
    let parent = null
    if (page.parentId) {
        parent = db.prepare('SELECT id, title FROM Page WHERE id = ?').get(page.parentId)
    }

    return { ...page, parent }
})
