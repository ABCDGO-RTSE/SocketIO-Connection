const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
require('dotenv').config()
const bodyParser = require("body-parser");
var firebase = require('firebase');
var sem = require('semaphore')(1);

var firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: "rtse-smms.firebaseapp.com",
    projectId: "rtse-smms",
    storageBucket: "rtse-smms.appspot.com",
    messagingSenderId: "850598274220",
    appId: "1:850598274220:web:24fb52aaadc86f5bc9eb09",
    measurementId: "G-4TP5NQGESD",
    databaseURL: "https://rtse-smms-default-rtdb.asia-southeast1.firebasedatabase.app"
};

firebase.initializeApp(firebaseConfig);

let rtdb = firebase.database();

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
var color = "green";
var threshold = 1;
let logs = [];

get_threshold();

app.get('/send_data', (req, res) => {
    res.send(JSON.stringify(req.body))
})

// ? POST data from api
app.post('/send_data', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify(req.body));

    io.emit('receive_data', req.body.data)
    io.emit('threshold', req.body.threshold)
    io.emit('motor_stat', req.body.motor)

    data = req.body.data;
    color = req.body.motor;
    threshold = parseInt(req.body.threshold);

});

app.post('/set_threshold', (req, res) => {

    let operator = "";

    console.log(threshold);

    // sem.take(function () {
    operator = req.body.threshold;

    console.log(operator);

    if (operator == "plus") {
        if (threshold < 100) {
            threshold++;
        }
    } else {
        if (threshold > 0) {
            threshold--;
        }
    }

    set_threshold(threshold);

    logs.push(threshold);

    res.status(200).end(JSON.stringify(req.body));
    // sem.leave();
    // });

})

app.get('/get_threshold', (req, res) => {

    get_threshold();
    res.status(200).end(JSON.stringify(threshold));

})

app.get('/logs', (req, res) => {

    res.status(200).end(JSON.stringify(logs));

})

app.get('/get_data', (req, res) => {

    let arr = { data_value: data, color_value: color, threshold_value: threshold };

    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify(arr))
})

io.emit('threshold', threshold);

// ? database function
function set_threshold(threshold) {
    rtdb.ref('rtse').set({
        threshold: threshold
    });
}

function get_threshold() {
    rtdb.ref("rtse/threshold").on("value", (snapshot) => {
        threshold = snapshot.val();
    })
}