import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
    console.log('🔵 API PUT /api/pages/[id] called')
    
    const user = event.context.user
    if (!user) {
        console.log('🔵 API: No user found, returning 401')
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { title, content } = body
    
    console.log('🔵 API: Updating page:', { 
        id, 
        title: title?.substring(0, 50) + '...',
        contentLength: content?.length || 0,
        contentPreview: content?.substring(0, 100) + '...'
    })

    const existingPage = db.prepare('SELECT * FROM Page WHERE id = ?').get(id) as any

    if (!existingPage) {
        console.log('🔵 API: Page not found, returning 404')
        throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    }

    console.log('🔵 API: Existing page found:', { 
        id: existingPage.id, 
        title: existingPage.title,
        existingContentLength: existingPage.content?.length || 0
    })

    const member = db.prepare(
        'SELECT id FROM WorkspaceMember WHERE userId = ? AND workspaceId = ?'
    ).get(user.id, existingPage.workspaceId)

    if (!member) {
        console.log('🔵 API: User not authorized for this page, returning 403')
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const now = new Date().toISOString()
    // Use existing values as fallbacks so a partial update (e.g. title-only)
    // never overwrites fields that weren't included in the request body.
    const newTitle = title !== undefined ? title : existingPage.title
    const newContent = content !== undefined ? content : existingPage.content

    console.log('🔵 API: Final values to save:', { 
        newTitle: newTitle?.substring(0, 50) + '...',
        newContentLength: newContent?.length || 0,
        newContentPreview: newContent?.substring(0, 100) + '...'
    })

    const result = db.prepare(
        'UPDATE Page SET title = ?, content = ?, updatedAt = ? WHERE id = ?'
    ).run(newTitle || "Untitled", newContent, now, id)
    
    console.log('🔵 API: Database update result:', { 
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid
    })

    const updatedPage = {
        ...existingPage,
        title: newTitle || "Untitled",
        content: newContent || "",
        updatedAt: now,
    }
    
    console.log('🔵 API: Returning updated page:', { 
        id: updatedPage.id, 
        title: updatedPage.title,
        contentLength: updatedPage.content?.length || 0
    })
    
    return updatedPage
})
