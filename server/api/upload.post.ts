import { writeFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const files = await readMultipartFormData(event)
    if (!files || files.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
    }

    const uploadedFiles = []

    for (const file of files) {
        if (file.name === 'file' && file.filename) {
            const ext = file.filename.split('.').pop()
            const filename = `${randomUUID()}.${ext}`
            const path = join(process.cwd(), 'public', 'uploads', filename)

            await writeFile(path, file.data)
            uploadedFiles.push(`/uploads/${filename}`)
        }
    }

    return {
        url: uploadedFiles[0] // Return first file URL
    }
})
