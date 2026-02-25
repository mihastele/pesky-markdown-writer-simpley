import { db } from '../../utils/db'

// Allowlist of column names that may be updated to prevent SQL injection.
const ALLOWED_UPDATE_COLUMNS = new Set(['title', 'content', 'updatedAt'])

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { title, content } = body

    const existingPage = db.prepare('SELECT * FROM Page WHERE id = ?').get(id) as any

    if (!existingPage) {
        throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    }

    const member = db.prepare(
        'SELECT id FROM WorkspaceMember WHERE userId = ? AND workspaceId = ?'
    ).get(user.id, existingPage.workspaceId)

    if (!member) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const now = new Date().toISOString()
    // Build dynamic update - only update fields that were actually provided.
    // This prevents nullifying title when only content is sent, and vice versa.
    const updates: Record<string, any> = { updatedAt: now }
    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content

    // Guard against unexpected keys to prevent SQL injection via column names.
    for (const key of Object.keys(updates)) {
        if (!ALLOWED_UPDATE_COLUMNS.has(key)) {
            throw createError({ statusCode: 400, statusMessage: `Invalid field: ${key}` })
        }
    }

    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ')
    const values = Object.values(updates)

    db.prepare(
        `UPDATE Page SET ${setClauses} WHERE id = ?`
    ).run(...values, id)

    // Use existing values as fallbacks so a partial update (e.g. title-only)
    // never overwrites fields that weren't included in the request body.
    const newTitle = title !== undefined ? title : existingPage.title
    const newContent = content !== undefined ? content : existingPage.content

    return {
        ...existingPage,
        ...updates,
        title: newTitle || 'Untitled',
        content: newContent ?? '',
        updatedAt: now,
    }
})
