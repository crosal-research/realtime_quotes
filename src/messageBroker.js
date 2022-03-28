/**
* Implelments a Pub/Sub/broker model
* to broadcast messages from data scrapped from www.investing.com
* Ideas taken from https://medium.com/unprogrammer/
* implementing-publisher-subscriber-pattern-using-javascript-nodejs-and-websockets-82036da7e174
* Basically:
* - Broker coordenates which client subscribe/unsubcribe to each channel.
* - Channels 
*/


/**
 * Description: Channel that will broadcast a message to subscribers
 *              Each channel broacasts one messages from one publisher
 * @class
 */   
class Channel {
    /**
     * Description: Channel is fed by one publisher
     * @param{string} id: id of the channel
     *
    */   
    constructor(id){
        this.id = id
        this.message = ""
        this.subscribers = []
    }

    /**
     * Description: Subscribe client to a channel  
     * @param{websocke client} client 
     * @return{void}
     *
    */   
    subscribe(client){
        if (! this.subscribers.includes(client)){
            this.subscribers.push(client)
        }
    }

    /**
     * Description: Unsubscribe client to a channel  
     * @param{websocke client} client 
     * @return{void}
     *
    */   
    unsubscribe(client){
        if (this.subscribers.includes(client)) {
            this.subscribers = this.subscribers.filter( c => c !== client)
        }
    }

    /**
     * Description: message gets published to a channel
     * @param{string} msg: message that gets publised
     * @return{void}
     *
    */   
    publish(msg) {
        this.message = msg
    }

    /**
     * Description: sends out message to all subscribers
     * @param{null} 
     * @return{void}
     *
    */   
    broadcast() {
        this.subscribers.forEach((sub) => {
            if (sub.readyState ===  1){  //if connnection is OPEN
                sub.send(this.message)
            }
        })
    }
}


/**
 * Description: Broker that pipelines messages through channels to clients
 * @class
 */   
class Broker {
    constructor(){
        this.channels = new Map()
    }

    /**
     * Description: Adds channel to message broker
     * @param{Clannel}  channel: channel to be added
     * @return{Broker}: Broker is returns to be (possibly) channeled
     *
    */   
    add(channel){
        this.channels.set(channel.id, channel)
        return this
    }
    
    /**
     * Description: Removes channel to message broker
     * @param{Clannel}  channel: channel to be removed
     * @return{Broker}: Broker is returns to be (possibly) channeled
     *
    */   
    remove(channel){
        this.channels.delete(channel.id, channel)
        return this
    }


    /**
     * Description: Subscribes client to channels
     * @param{wobsocket client}  client: client subscribing to id
     * @param{array[string]}  chanelsIds: array of channels' id
     * @return{void}:
     *
    */   
    subscribe(client, channelIds) {
        channelIds.forEach( (id) => {
            this.channels.get(id).subscribe(client)
        })
    }

    /**
     * Description: Subscribes client to channels
     * @param{wobsocket client}  client: client subscribing to id
     * @param{array[string]}  chanelsIds: array of channels' id
     * @return{void}:
     *
    */   
    unsubscribe(client, channelIds){
        channelIds.forEach( (id) =>{
            this.channels.get(id).unsubscribe(client)
        })
    }

    /**
     * Description: message gets published to a channel via broker
     * @param{string}  channelId: id of the channel
     * @param{string}  msg: message that gest published
     * @return{this}: broker to chainned
     *
    */   
    publish(channelId, msg){
        this.channels.get(channelId).publish(msg)
        return this
    }

    /**
     * Description: a channel broadcasts via broker
     * @param{string}  channelId: ids of the channel
     * @return{void}:
     *
    */   
    broadcast(channelId) {
        this.channels.get(channelId).broadcast()
        return this
    }
}

module.exports = {
    Channel: Channel,
    Broker: Broker
}
