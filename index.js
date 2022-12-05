"use strict";
//You may change the values up until line 6
let bkrAddr = "mqtt://10.0.0.4:1883"; //18.198.188.151:21883";//10.0.0.4:1883"
let clntID = "joe";
let topic = "Joe/HR";
let debug = "debug";
//you may not edit anything below this line

const path = require("path");
const {WebSocketServer} = require("ws");
const http = require("http");
const express = require("express");
const mqtt = require("mqtt");
const sqlite3 = require("sqlite3");
const app = express();
const db = new sqlite3.Database(path.resolve(__dirname, "patient"));
let port = 3003;
let client = mqtt.connect(bkrAddr, {clientId: clntID});
let server = http.createServer(app).listen(port);

app.use("/views", express.static(path.resolve(__dirname, "views")));
app.use("/style", express.static(path.resolve(__dirname, "style")))
app.use("/static", express.static(path.resolve(__dirname, "static")));


const wss = new WebSocketServer({
    server: server,
    clientTracking: true,
});

wss.on("connection", (ws) => {
    console.log("WebSocket Connected");
    ws.on("message", (message) => {
        console.log(message.toString());
    });
});

client.on("connect", () => {
    console.log("MQTT connected");
    client.subscribe(topic);
    client.subscribe("history");
    console.log("MQTT subscribed to topic: " + topic);
});

client.on("error", (error) => {
    console.log("Can't connect" + error);
    process.exit(1);
});

client.on("message", (topic, message) => {
    let pData = JSON.parse(message);
    db.run(
        "insert into pData(pName, mDate, mTime, bpm)values ($pName, $mDate, $mTime, $bpm)",
        {
            $pName: pData.pName,
            $mDate: pData.mDate,
            $mTime: pData.mTime,
            $bpm: pData.bpm
        });
    for (const ws of wss.clients) {
        ws.send(message.toString());
    }
});

app.get("/", (req, res) => {
    const query = 'CREATE TABLE IF NOT EXISTS tData (id INTEGER PRIMARY KEY AUTOINCREMENT, pName STRING, mDate STRING NOT NULL, mTime STRING NOT NULL, bpm INT NOT NULL);'
    db.run(query);
    db.get(
        "select pName, mDate, mTime, bpm from pData order by id desc limit 1;",
        (err, current) => {
            const pData = []
            if (current === undefined) {
                pData[0] = {
                    "pName": "",
                    "mDate": "",
                    "mTime": "",
                    "bpm": 0
                };
            } else {
                pData.push(current);
            }
            res.render(path.resolve(__dirname, "views/home.ejs"), pData[0]);
        }
    );
});

app.get("/history", (req, res) => {
    res.render(path.resolve(__dirname, "views/history.ejs"));
});

app.get("/historydata", async (req, res) => {
    try {
        console.log("fetching data");
        db.all(
            "select pName, mDate, mTime, bpm from pData;",
            (err, current) => {
                res.json(current);
            }
        );
    } catch (e) {
        console.log(e);
        res.status(404).send(e);
    }
});

app.delete ("/clear", async(req, res) => {
    try {
        await db.run("DELETE FROM pData;", () => {
            res.status(200);
        });
    } catch (e) {
        res.status(204).send(e);
    }
});

app.delete("/deletelast", (req,res) => {
    db.run("DELETE FROM pData WHERE id = (SELECT MAX(id))");
});

app.get("/home.js", (req, res) =>
    res.sendFile(path.resolve(__dirname, "views/home.js"))
);

app.get("/data.js", (req, res) =>
    res.sendFile(path.resolve(__dirname, "views/data.js"))
);

app.get("/style.css", (req, res) =>
    res.sendFile(path.resolve(__dirname, "style/style.css"))
);

app.get("/heart.png", (req, res )=> {
    res.sendFile(path.resolve(__dirname, "static/heart.png"));
});
app.listen(3000);
