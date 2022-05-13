/*
* Script to fetch data from www.investing.com websocket
* some ideas taken from: 
* https://gist.github.com/LucasMendesl/9899dde34ce50974170c0a97055a4bc2
*/

const WebSocket = require('ws')
const HttpsProxyAgent = require('https-proxy-agent')
const fs = require('fs')
const path = require("path")
const url = require('url')
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
})

const HOST = process.env.HOST_BROKER
const PORT = process.env.PORT_BROKER


const securities = JSON.parse(fs.readFileSync("securities.json"))


//proxy agent
const proxy = process.env.http_proxy || 'http://168.63.76.32:3128';

//websock to Messagebroker server

const wp = new WebSocket(`ws:${HOST}:${PORT}`)


// Investing.com
const ws = new WebSocket('wss:stream330.forexpros.com/echo/897/6lqeg2qn/websocket', {
    rejectUnauthorized: false,
    headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36'
    },
    origin: "https:br.widgets.investing.com"
})

const serialize = string => "[" + JSON.stringify(string) + "]"

ws.on('open', () => {
    console.log("Producer Bloomberg Connected to Server!")
    for (const s of securities) {
        if (s.publisher === "Bloomberg"){
            const sbs = serialize(JSON.stringify({ "_event": "subscribe", "tzID": 8, "message": `${s.pid}:`}))
        ws.send(sbs)
        } 
    }
})

wp.on('open', function open(data){
    console.log("Hello from Producer")
    wp.send(JSON.stringify({
        type: "CONNECTION",
        kind: "publisher",
        publisher: 'Bloomberg'
    }))
})


ws.on('message', (message) => {
    const messageType = message.toString().substr(0, 1)

    if (messageType === 'a') {
        const messageInput = JSON.parse(message.slice(1))[0]
        const content = JSON.parse(messageInput)

        if (content._event === 'heartbeat') {
            console.log(content)
            return;
        }
        const value = JSON.parse(content.message.split('::').slice(1)[0])
        value.type = 'INPUT'
        value.publisher = "Bloomberg"
        value.ticker = securities.filter(s => s.pid == `pid-${value.pid}`)[0].ticker
        wp.send(JSON.stringify(value))
    }
})


// source websoket
ws.on('close', () => {
    console.log('Connnection with source Closed!')
})

setInterval(() => {
    if (ws.readyState === ws.OPEN)
        ws.send(serialize(JSON.stringify({ "_event": "heartbeat", "data": "h" })));
}, 2000)


ws.on('error', err => {
    console.log(err)
})


//broker websoket
wp.on('ping', function() {
    // Delay should be equal to the interval at which your server
    // sends out pings plus a conservative assumption of the latency.
    clearTimeout(this.pingTimeout);
    this.pingTimeout = setTimeout(() => {
        this.terminate();
    }, 30000 + 1000);
})

wp.on('close', () => {
    console.log("Connection with Borker Closed!")
    ws.terminate()
})



