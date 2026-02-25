import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const id = getRouterParam(event, 'id')

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

    // Delete child pages first (recursive), then the page itself
    const deleteRecursive = db.transaction(() => {
        // Recursively find and delete all descendants
        const deleteChildren = (parentId: string) => {
            const children = db.prepare('SELECT id FROM Page WHERE parentId = ?').all(parentId) as any[]
            for (const child of children) {
                deleteChildren(child.id)
                db.prepare('DELETE FROM Page WHERE id = ?').run(child.id)
            }
        }
        deleteChildren(id as string)
        db.prepare('DELETE FROM Page WHERE id = ?').run(id)
    })

    deleteRecursive()

    return { success: true }
})
