const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true
    }
});

require('dotenv').config()

const PORT = process.env.PORT || 4000

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
});

io.emit('some event', {
    someProperty: 'some value',
    otherProperty: 'other value'
}); // This will emit the event to all connected sockets

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
});

var i = 0
setInterval(() => {
    i++;
    io.emit("tick", i);
}, 1000);