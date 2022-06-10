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

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

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

var data = 0;
var color = "";

app.get('/send_data', (req, res) => {
    res.send(JSON.stringify(req.body))
})

// ? POST data from api
app.post('/send_data', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify(req.body));

    io.emit('receive_data', req.body.data)
    io.emit('receive_threshold', req.body.threshold)
    io.emit('motor_stat', req.body.motor)

    data = req.body.data;
    color = req.body.motor;

});

var threshold = 5;

app.post('/set_threshold', (req, res) => {

    threshold = req.body.threshold;
    res.status(200).end(JSON.stringify(req.body));
})

app.get('/get_threshold', (req, res) => {

    res.status(200).end(JSON.stringify(threshold))

})

app.get('/get_data', (req, res) => {
    let arr = [];
    arr['data'] = data;
    arr['color'] = color;
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify(arr))
})

io.emit('threshold', threshold);
