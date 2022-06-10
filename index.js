const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
require('dotenv').config()
const bodyParser = require("body-parser");

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const io = new Server(server, {
    cors: {
        origin: process.env.ORIGIN_URL,
        credentials: true
    }
});


const PORT = process.env.PORT || 4000

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/check', (req, res) => {
    res.send(process.env.ORIGIN_URL)
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


app.get('/send_data', (req, res) => {
    res.send(JSON.stringify(req.body))
})

// ? POST data from api
app.post('/send_data', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(req.body));

    io.emit('receive_data', req.body.data)
});