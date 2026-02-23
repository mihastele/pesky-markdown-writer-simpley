import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
    console.log('🔵 API GET /api/pages/[id] called')
    
    const user = event.context.user
    if (!user) {
        console.log('🔵 API: No user found, returning 401')
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const id = getRouterParam(event, 'id')
    console.log('🔵 API: Fetching page with ID:', id)

    const page = db.prepare('SELECT * FROM Page WHERE id = ?').get(id) as any

    if (!page) {
        console.log('🔵 API: Page not found, returning 404')
        throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    }

    console.log('🔵 API: Page found in database:', { 
        id: page.id, 
        title: page.title,
        contentLength: page.content?.length || 0,
        contentPreview: page.content?.substring(0, 100) + '...'
    })

    // Verify access (check if page belongs to user's workspace)
    const member = db.prepare(
        'SELECT id FROM WorkspaceMember WHERE userId = ? AND workspaceId = ?'
    ).get(user.id, page.workspaceId)

    if (!member) {
        console.log('🔵 API: User not authorized for this page, returning 403')
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // Get parent info if exists
    let parent = null
    if (page.parentId) {
        parent = db.prepare('SELECT id, title FROM Page WHERE id = ?').get(page.parentId)
    }

    const result = { ...page, parent }
    console.log('🔵 API: Returning page data:', { 
        id: result.id, 
        title: result.title,
        contentLength: result.content?.length || 0,
        hasParent: !!result.parent
    })
    
    return result
})
