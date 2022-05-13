const WebSockets = require("ws")
const fs = require("fs")
const path = require('path')
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
        price: '-',
        time: '-',
        open: '-',
        change: '-',
        publisher: 'Cryptocompare'
    }]
}))


const ws = new WebSockets(`${url}?api_key=${MY_TOKEN}`)
const wp = new WebSockets(`ws://${process.env.HOST_BROKER}:${process.env.PORT_BROKER}`) //websock to server


ws.on('open', function open(data){
    console.log("Hello from Server")
    const msg = { 
        "action": "SubAdd",
//        "subs": securities.map(s => s.pid) 
        "subs": [securities[1]]
    }
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
        sec.price = resp.PRICE,
        sec.time = resp.LASTUPDATE,
        sec.open = resp.OPENDAY ? resp.OPENDAY : sec.open,
        sec.change = sec.open !== "-" ? Number(sec.price)/Number(sec.open) -1 : "-"
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
