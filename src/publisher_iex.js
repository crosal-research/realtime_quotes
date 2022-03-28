const eventSource = require('eventsource')
const WebSocket = require('ws')
const fs = require("fs")
const path = require("path")
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
})

const MY_TOKEN = process.env.MY_TOKEN_SAND
const securities = JSON.parse(fs.readFileSync("./securities.json").toString())
const symbols = securities.filter( s => s.publisher === 'Alpaca').map(s => s.ticker)
// const url = `https://sandbox-sse.iexapis.com/stable/last?token=${process.env.MY_TOKEN_SAND}&symbols=${symbols}`
// const url = `https://sandbox-sse.iexapis.com/stable/stocksUS?symbols=${symbols}&token=${process.env.MY_TOKEN_SAND}`
// const url = `https://cloud-sse.iexapis.com/stable/stocksUS?symbols=${symbols}&token=${process.env.MY_TOKEN}`
console.log(url)


const wp = new WebSocket(process.env.MESSAGE_BROKER) //websocket to server
const sse = new eventSource(url) //subscript to iex sse service


sse.onopen = function ()  {
        console.log('Connection with iex is open!')
    }


let data = {};
sse.onmessage = function (message) {
    const new_data = JSON.parse(message.data)[0]
    if (!new_data || new_data.length == 0){
        return 
    }
    
    if (data[new_data.symbol] === undefined){
        data[new_data.symbol] = {
            ticker: new_data.symbol,
            pid: new_data.symbol,
            last_numeric: new_data.iexRealtimePrice,
            pcp: Math.round(((new_data.iexRealtimePrice/new_data.iexClose)-1)*10000)/100,
            time: new_data.iexLastUpdated,
            type: 'INPUT',
            publisher: "iex"
        }
        wp.send(JSON.stringify(data[new_data.symbol]))
        return 
        }

    if (new_data.time == data[new_data.symbol].time){
        return
        } else {
            data[new_data.symbol] = {
                ticker: new_data.symbol,
                pid: new_data.symbol,
                last_numeric: new_data.iexRealtimePrice,
                pcp: Math.round(((new_data.iexRealtimePrice/new_data.iexClose)-1)*10000)/100,
                timestamp: new_data.iexLastUpdated,
                type: 'INPUT',
                publisher: "iex"
            }
            wp.send(JSON.stringify(data[new_data.symbol]))
            return
        }
}


sse.close= function () {
    console.log("Server is closed. Bye")
}

sse.onerror = function (err) {
    console.log(err)
    sse.close()
}
