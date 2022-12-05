"use strict";

const ctx = document.getElementById("myChart");
const chart = new Chart(ctx, {
    type: "line",
    data: {
        labels: [],
        datasets: [
            {
                label: "Heart Rate",
                data: [],
                borderColor: 'rgb(143,8,8)',
                backgroundColor: 'rgb(143,8,8)',
                borderWidth: 2,
                lineTension: 0.4,
            },
        ],
    },
    options: {
        aspectRatio: 3,
        maintainAspectRatio: true,
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    },
});

const socket = new WebSocket(`ws://localhost:3003`);
socket.addEventListener("open", () => {
    socket.send("WS Client Connected!");
    socket.addEventListener("message", (event) => {
        const pName = JSON.parse(event.data).pName;
        const mDate = JSON.parse(event.data).mDate;
        const mTime = JSON.parse(event.data).mTime;
        const bpm = JSON.parse(event.data).bpm;
        const name = document.querySelector(".name");
        const date = document.querySelector(".date");
        const hr = document.querySelector(".hr");
        name.innerText = "Patient name: " + pName;
        date.innerText = "Measurement date: " + mDate;
        hr.innerText = "Heart rate: " + bpm;
        socket.send("Message received");
        addData(chart, mTime, bpm);
    });
});

(() => {
    fetch('/historydata')
        .then(res => res.json())
        .then(pData => {
            console.log(pData.length);
            for (const data of pData) {
                //console.log(datum);
                addData(chart, data.mTime, data.bpm);
            }
        });
}).call({});

function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(data);
    chart.update();
}
