// import { WebSocketServer } from 'ws'
// import fs from 'fs'
// import {Channel, Broker} from './messageBroker.js'
// import {convertToPids, secToDict} from './helpers.js'

const { WebSocketServer } = require('ws')
const fs = require('fs')
const { Channel, Broker } = require("./messageBroker.js")
const { secToDict} = require('./helpers.js')

const PORT = 8000
const wss = new WebSocketServer({ host: "127.0.0.1", port: PORT });
const broker = new Broker()
const securities = JSON.parse(fs.readFileSync("securities.json"))



// Intert securities and add channels to message brokers
const dictSec = secToDict(securities) // Object: pid => securites
securities.forEach(s => {
    broker.add(new Channel(s.ticker))
})

wss.on('connection', function connection(ws, req) {
    ws.on('message', function message(data) {
        let msg = JSON.parse(data.toString())
        const msgType = msg.type.toUpperCase()

        //Routing of messages
        switch (msgType) { //types: INPUT, SUBSCRIBE, UNSUBSCRIBE

        // broadcast to subscribers from publisher
        case 'INPUT': 
            delete msg.type
            broker.publish(msg.ticker, JSON.stringify(msg)).broadcast(msg.ticker)
            break

        //message from subscribers on opening connection to:
        case 'SUBSCRIBE':
            try {           
                broker.subscribe(ws, msg.tickers)
            } catch(e){
                console.log(msg)
                console.log("Subscribing message ill formed", e.message)
            } finally {
                break
            }
    
        case 'UNSUBSCRIBE':
            try {
                broker.unsubscribe(ws, msg.tickers)
            } catch(e) {
                console.log("message ill formed", e.message)
            } finally {
                break
            }

        default:
            console.log(`${msgtype} is the wrong type of message`)
        }
    });
});

console.log(`Message Broker is up and running on port ${PORT}` )
