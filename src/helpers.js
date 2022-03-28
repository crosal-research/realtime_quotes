/*
 * Helper functions to work with securities
 */

/**
 * converts from human readtalbe ticker to pids
 * @param {Array} tickers - ticker in human readable notation
 * @param {Array} securites - Objets where pids are keys
 * @return {Array} 
 */
function convertToPids(tickers, securities) {
     let pids = []
    securities.forEach(s => {
        if (tickers.includes(s.ticker)){
            pids.push(s.pid)
        }
    })
    return pids
}

/**
 * Generates Objet with keys give by pids and values are securites
 * @param {Array} securites - Objets where pids are keys
 * @return {Object} 
 */
function secToDict(securities){
    let dictSec = {}
    securities.forEach(s => dictSec[s.pid] = s)
    return dictSec
}


module.exports = {
    convertToPids: convertToPids,
    secToDict: secToDict
}
