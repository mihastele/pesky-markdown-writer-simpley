// DOM polyfill MUST be set up before any @tiptap or prosemirror imports.
// These libraries check for window/document/DOMParser at module evaluation time.
// We use linkedom to provide a lightweight DOM implementation for Node.js.
import { parseHTML } from 'linkedom'

const { window, document, DOMParser, Node } = parseHTML('<!DOCTYPE html><html><body></body></html>')

// @ts-ignore - Setting DOM globals for tiptap/prosemirror
globalThis.window = window as any
// @ts-ignore
globalThis.document = document
// @ts-ignore
globalThis.DOMParser = DOMParser
// @ts-ignore
globalThis.Node = Node
// navigator is a getter-only property in Node 22+, use Object.defineProperty
try {
    if (!globalThis.navigator) {
        Object.defineProperty(globalThis, 'navigator', {
            value: { userAgent: 'node' },
            writable: true,
            configurable: true,
        })
    }
} catch {
    // navigator already exists in this environment, which is fine
}

// --- Now safe to import tiptap modules ---
import { Server } from '@hocuspocus/server'
import { SQLite } from '@hocuspocus/extension-sqlite'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import * as Y from 'yjs'

// Dynamic imports for tiptap modules that need DOM globals to be set first.
// In ESM, static imports are hoisted and evaluated before module body code.
// Dynamic import() ensures these modules load AFTER our polyfill code runs.
const { generateJSON, generateHTML, getSchema } = await import('@tiptap/core')
const { default: StarterKit } = await import('@tiptap/starter-kit')
const { default: Image } = await import('@tiptap/extension-image')
const { prosemirrorJSONToYDoc, yDocToProsemirrorJSON } = await import('@tiptap/y-tiptap')

// Build the same extensions/schema as the client editor
// (excluding Collaboration, Placeholder, and client-only extensions)
const extensions = [
    StarterKit.configure({
        history: false,
    }),
    Image.configure({
        inline: false,
        allowBase64: true,
    }),
]
const schema = getSchema(extensions)

// --- Database setup ---
let dbPath = process.env.DATABASE_URL || './dev.db'
if (dbPath.startsWith('file:')) {
    dbPath = dbPath.slice(5)
}

const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
}

// Open a better-sqlite3 connection for reading/writing Page.content.
// The @hocuspocus/extension-sqlite uses the async `sqlite3` package internally
// for persisting Yjs binary state to the `documents` table.
// This is a separate connection for our custom Page.content synchronization.
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

/**
 * Extract the page ID from a Hocuspocus document name.
 * The client connects with name format: "page.<pageId>"
 */
function extractPageId(documentName: string): string | null {
    const match = documentName.match(/^page\.(.+)$/)
    return match ? match[1] : null
}

/**
 * Convert HTML content to a Yjs update that can be applied to a Y.Doc.
 */
function htmlToYUpdate(html: string): Uint8Array | null {
    if (!html || html.trim() === '') return null

    try {
        const json = generateJSON(html, extensions)
        const ydoc = prosemirrorJSONToYDoc(schema, json, 'default')
        return Y.encodeStateAsUpdate(ydoc)
    } catch (e) {
        console.error('[Collab] Failed to convert HTML to Yjs update:', e)
        return null
    }
}

/**
 * Convert a Y.Doc to HTML content.
 */
function yDocToHTML(ydoc: Y.Doc): string {
    try {
        const json = yDocToProsemirrorJSON(ydoc, 'default')
        if (!json || !json.content || json.content.length === 0) {
            return ''
        }
        return generateHTML(json, extensions)
    } catch (e) {
        console.error('[Collab] Failed to convert Yjs to HTML:', e)
        return ''
    }
}

// --- Hocuspocus Server ---
const server = new Server({
    port: 1234,

    async onConnect(data) {
        console.log(`[Collab] New connection: ${data.documentName}`)
    },

    extensions: [
        new SQLite({
            database: dbPath,
        }),
    ],

    // After all extensions have loaded (including SQLite extension which loads Yjs
    // binary state from the `documents` table), check if the document is still empty.
    // If so, seed it from the Page.content HTML column.
    // This bridges the gap between the HTTP-saved HTML content and Yjs state.
    async onLoadDocument(data) {
        const pageId = extractPageId(data.documentName)
        if (!pageId) return

        // The SQLite extension runs before this hook (extensions are processed
        // before inline hooks). Check if any fragment has content.
        const defaultFragment = data.document.getXmlFragment('default')
        const prosemirrorFragment = data.document.getXmlFragment('prosemirror')

        if (defaultFragment.length > 0 || prosemirrorFragment.length > 0) {
            console.log(`[Collab] Document ${data.documentName} loaded from Yjs store`)
            return
        }

        // No Yjs state exists - seed from Page.content
        console.log(`[Collab] No Yjs state for ${data.documentName}, seeding from Page.content...`)

        try {
            const page = db.prepare('SELECT content FROM Page WHERE id = ?').get(pageId) as any
            if (!page || !page.content || page.content.trim() === '') {
                console.log(`[Collab] No HTML content for page ${pageId}, starting empty`)
                return
            }

            const update = htmlToYUpdate(page.content)
            if (update) {
                Y.applyUpdate(data.document, update)
                console.log(`[Collab] Seeded ${data.documentName} from Page.content (${page.content.length} chars)`)
            }
        } catch (e) {
            console.error(`[Collab] Failed to seed from Page.content:`, e)
        }
    },

    // When the Yjs document is persisted (triggered by the Hocuspocus server after
    // changes, typically with a debounce), also save the HTML representation
    // back to the Page.content column. This keeps the REST API's view of content
    // in sync with the collaborative editing state.
    async onStoreDocument(data) {
        const pageId = extractPageId(data.documentName)
        if (!pageId) return

        try {
            const html = yDocToHTML(data.document)
            const now = new Date().toISOString()

            db.prepare(
                'UPDATE Page SET content = ?, updatedAt = ? WHERE id = ?'
            ).run(html, now, pageId)

            console.log(`[Collab] Saved HTML for ${data.documentName} (${html.length} chars)`)
        } catch (e) {
            console.error(`[Collab] Failed to save HTML to Page.content:`, e)
        }
    },
    async onAuthenticate(data) {
        // For now, allow all connections - in production you'd want to validate tokens
        return { token: 'authenticated' }
    },
    async onLoadDocument(data) {
        console.log(`Loading document: ${data.documentName}`)
        // You could load initial document content from database here if needed
        return null
    },
    async onStoreDocument(data) {
        console.log(`Storing document: ${data.documentName}`)
        // You could persist document content to database here if needed
    }
})

server.listen()
console.log('[Collab] Collaboration server running on port 1234')
