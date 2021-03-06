/*
/ Needs to implment ping-pong messages to exchange
/ with clients
*/

// system and package imports
const { WebSocketServer } = require('ws')
const {createServer} = require('http')
const fs = require('fs')
const path = require("path")
const {v4} = require('uuid')
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
})

//application imports
const { Channel, Broker } = require("./messageBroker.js")
const { secToDict} = require('./helpers.js')


const HOST = process.env.HOST_BROKER
const PORT = process.env.PORT_BROKER

const options = {
    // key: fs.readFileSync("../certificates/real_time.test.key"),
    // cert: fs.readFileSync("../certificates/real_time.test.crt")
}

const server = createServer(options)
const wss = new WebSocketServer({server});
const broker = new Broker()
const securities = JSON.parse(fs.readFileSync("securities.json"))


// securities and add channels to message brokers
const dictSec = secToDict(securities) // Object: pid => securites
securities.forEach(s => {
    broker.add(new Channel(s.ticker))
})
let publishers = new Map()


//clients connected
const clientsConnected = new Map()


// Gets the Websocket Broker to Work
wss.on('connection', function connection(ws, req) {
    // set client entry conditions
    ws.isAlive = true
    console.log(`${req.socket.remoteAddress}:${req.socket.remotePort} connected @ ${new Date()}`)
    const clientId = v4()
    clientsConnected.set(clientId, ws)

    ws.on('pong', () => { ws.isAlive = true
                          console.log(`Client ${clientId} is alive!`)
                          console.log(Array.from(clientsConnected.keys()).length)
                        })

    ws.on('message', function message(data) {
        let msg
        try {
            msg = JSON.parse(data.toString())
        }
        catch(e){
            console.log("Message of wrong type")
            return 
         }

        //Routing of messages
        const msgType = msg.type.toUpperCase()
        switch (msgType) { //types: CONNECTION, INPUT, SUBSCRIBE, UNSUBSCRIBE

        // Connections between publisher and broker
        case 'CONNECTION':
            publishers.set(msg.publisher, 'ACTIVE')
            break
            
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

    ws.on('close', function() {
        broker.unsubscribe(ws, Array.from(broker.channels.keys()))
        clientsConnected.delete(clientId)
        console.log(`${req.socket.remoteAddress}:${req.socket.remotePort} disconnected @ ${new Date()}`)
        console.log(`Total number of clients is now: ${Array.from(clientsConnected.keys()).length}`)
    })
});


// checks and mantains alive clients
const pingInterval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);


// logs the publishers currently active
const intervalPublishers = setInterval(function () {
    console.log(`Publishers connected @ ${new Date()}:`)
    if (publishers.size> 0){
        publishers.forEach( (v,k,m)  => {
            console.log(`publisher ${k} is ${v}`)
        })
    } else {
        console.log("No publisher is feeding de broker")
    }
    console.log("\n")
}, 2000)


wss.on('close', () => {
    console.log("Shutting Broker Server!")
    clearInterval(pingInterval);
    clearInterval(intervalPublishers);
})


console.log(`Message Broker is up and running on port ${PORT}` )

server.listen({ port: PORT ,hostname: HOST})
