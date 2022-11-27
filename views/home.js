'use strict';

const socket = new WebSocket(`ws://localhost:3003`);
socket.addEventListener('open', ()=> {
    socket.send("WS Client Connected!");
});
socket.addEventListener("message", event =>{
    const pName = JSON.parse(event.data).pName;
    const mDate = JSON.parse(event.data).mDate
    const bpm = JSON.parse(event.data).bpm;
    const name = document.querySelector(".name");
    const date = document.querySelector(".date");
    const hr = document.querySelector(".hr");
    name.innerText = "Patient name: " + pName;
    date.innerText = "Measurement date: " + mDate;
    hr.innerText = "Heart rate: " + bpm;
    socket.send("client" + event.data.toString())
});