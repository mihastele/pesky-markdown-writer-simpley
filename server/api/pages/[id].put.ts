import { db } from '../../utils/db'

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
    // Use existing values as fallbacks so a partial update (e.g. title-only)
    // never overwrites fields that weren't included in the request body.
    const newTitle = title !== undefined ? title : existingPage.title
    const newContent = content !== undefined ? content : existingPage.content

    db.prepare(
        'UPDATE Page SET title = ?, content = ?, updatedAt = ? WHERE id = ?'
    ).run(newTitle || "Untitled", newContent, now, id)

    return {
        ...existingPage,
        title: newTitle || "Untitled",
        content: newContent || "",
        updatedAt: now,
    }
})
