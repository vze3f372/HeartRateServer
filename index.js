'use strict';

const path = require('path');
const {WebSocketServer} = require('ws');
const http = require('http');
const express = require('express');
const mqtt = require('mqtt');
const sqlite3 = require('sqlite3');
const app = express();
const db = new sqlite3.Database(path.resolve(__dirname, "patient"));
let bkrAddr = "mqtt://10.0.0.4:1883"//18.198.188.151:21883";//10.0.0.4:1883"
let clntID = "joe";
let topic = "Joe/HR";
let debug = "debug";
let port = 3003;
let client = mqtt.connect(bkrAddr, {clientId:clntID});
let server = http.createServer(app).listen(port);

app.use('/static', express.static(path.resolve(__dirname, 'views')))

const wss = new WebSocketServer({
    server: server,
    clientTracking: true
});

wss.on("connection", (ws) => {
    console.log("WebSocket Connected");
    ws.on("message", (message)=> {
        console.log(message.toString());
    });
});

client.on("connect",() => {
    console.log("MQTT connected");
    client.subscribe(topic);
    console.log("MQTT subscribed to topic: " + topic)
});

client.on("error",error => {
    console.log("Can't connect" + error);
    process.exit(1)
});

client.on('message', (topic, message, packet) => {
    let pData = JSON.parse(message);
    db.run("insert into pData(pName, mDate, mTime, bpm)values ($pName, $mDate, $mTime, $bpm)", {
        $pName:pData.pName,
        $mDate:pData.mDate,
        $mTime:pData.mTime,
        $bpm:pData.bpm
    });
    for (const ws of wss.clients){
        ws.send(message.toString());
    }
    client.publish(debug, pData.pName.toString());
});

app.get('/', (req, res) => {
    db.get("select pName, mDate, mTime, bpm from pData order by id desc limit 1;", (err, current) => {
        let pData = Object.assign({}, current);
        res.render(path.resolve(__dirname,'views/home.ejs'), pData);
    });
});

app.get('/home.js', (req, res) => res.sendFile(path.resolve(__dirname, 'views/home.js')));
app.listen(3002);