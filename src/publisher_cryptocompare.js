const WebSockets = require("ws")
const fs = require("fs")
const path = require('path')
const { convertTopcp } = require('./helpers.js')
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
})

const MY_TOKEN = process.env.TOKEN_CRYPTOCOMPARE
const  url = 'wss://streamer.cryptocompare.com/v2'

const securities = JSON.parse(fs.readFileSync("./securities.json").toString()).
      filter(s => s.publisher === 'Cryptocompare')
let sec = {}
let infoSec = new Map(securities.map(s => {
    const ticker = `${s.pid.split("~")[2]}\/${s.pid.split("~")[3]}`
    
    return [ticker, {
        type: 'INPUT',
        ticker: ticker,
        last_numeric: '-',
        timestamp: '-',
        open: '-',
        pcp: '-',
        publisher: 'Cryptocompare'
    }]
}))


const ws = new WebSockets(`${url}?api_key=${MY_TOKEN}`)
const wp = new WebSockets(`ws://${process.env.HOST_BROKER}:${process.env.PORT_BROKER}`) //websock to server


ws.on('open', function open(data){
    console.log("Hello from Server")
    const msg = { 
        "action": "SubAdd",
        "subs": securities.map(s => s.pid) 
    }
    ws.send(JSON.stringify(msg))
})

wp.on('open', function open(data){
    console.log("Hello from Producer")
    wp.send(JSON.stringify({
        type: "CONNECTION",
        kind: "publisher",
        publisher: 'Cryptocompare'
    }))
})

ws.on('message', function message(data){
    const resp = JSON.parse(data)
    const ticker = `${resp.FROMSYMBOL}\/${resp.TOSYMBOL}`
    if (resp.TYPE === '5' && resp.LASTUPDATE && resp.PRICE){
        sec = infoSec.get(ticker)
        sec.last_numeric = resp.PRICE,
        sec.timestamp = resp.LASTUPDATE,
        sec.open = resp.OPENDAY ? resp.OPENDAY : sec.open,
        sec.pcp = sec.open !=='-' ? convertTopcp((Number(sec.last_numeric)/Number(sec.open) -1)*100) : "-"
        infoSec.set(sec)
        wp.send(JSON.stringify(sec))
    }
    if (resp.TYPE === '999'){
        console.log(resp)
    }
})


ws.on('error', function error(error){
    console.log(error)
})
