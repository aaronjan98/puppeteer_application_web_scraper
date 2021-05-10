'use strict'
const axios = require('axios')
const { exec } = require('child_process')
const timer = ms => new Promise( res => setTimeout(res, ms))

async function open_websocket_debugger() {
    // need to launch Chrome with the "--remote-debugging-port=9222 argument to connect to an existing browser session
    try {
        await exec("osascript /Users/jan/Documents/dev/web_scraping/application_automation_puppeteer/util/run.scpt")
    } catch (err) {
        await err.status
    }

    await timer(5000).then(async _ => {
        await axios.get('http://127.0.0.1:9222/json').then(res => {
            console.log('port 9222 is now up')
        }).catch(async err => {
            await err.status
        })
    })
}

module.exports = { open_websocket_debugger }
