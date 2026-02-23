import { writeFile, mkdir } from 'fs/promises'
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

    const config = useRuntimeConfig()
    const storageType = config.storageType || 'local'

    if (storageType !== 'local') {
        throw createError({ statusCode: 501, statusMessage: 'Storage type not implemented: ' + storageType })
    }

    const uploadedFiles = []

    // Ensure uploads directory exists.
    // In production Nitro serves static files from .output/public/, not public/.
    const uploadDir = process.env.NODE_ENV === 'production'
        ? join(process.cwd(), '.output', 'public', 'uploads')
        : join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    for (const file of files) {
        if (file.name === 'file' && file.filename) {
            const ext = file.filename.split('.').pop()
            const filename = `${randomUUID()}.${ext}`
            const path = join(uploadDir, filename)

            await writeFile(path, file.data)
            uploadedFiles.push(`/uploads/${filename}`)
        }
    }

    return {
        url: uploadedFiles[0] // Return first file URL
    }
})
