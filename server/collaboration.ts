import { Server } from '@hocuspocus/server'

const server = Server.configure({
    port: 1234,
    async onConnect(data) {
        console.log(`New connection: ${data.documentName}`)
    },
})

server.listen()
console.log('Collaboration server running on port 1234')
