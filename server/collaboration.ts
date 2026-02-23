import { Server } from '@hocuspocus/server'

const server = new Server({
    port: 1234,
    async onConnect(data) {
        console.log(`New connection: ${data.documentName}`)
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
console.log('Collaboration server running on port 1234')
