'use strict'
const puppeteer = require('puppeteer')
const axios = require('axios')
const util = require('util')
const { exec } = require('child_process')
const timer = ms => new Promise( res => setTimeout(res, ms))

// import job_board files
const indeed = require('./job_boards/indeed.js')
const page_tests = require('./util/helper_functions/page_tests.js')

async function open_websocket_debugger() {
    // need to launch Chrome with the "--remote-debugging-port=9222 argument to connect to an existing browser session
    try {
        await exec("osascript /Users/jan/Documents/dev/shellscript/run.scpt")
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

async function configureBrowser() {
    let webChromeEndpointUrl

    // connect to local browser instance
    const browser_websocket_up = await axios.get('http://127.0.0.1:9222/json/version').then(async res => {
        webChromeEndpointUrl = await res.data.webSocketDebuggerUrl
    }).catch(error => {
        console.error({ error })
    })

    await puppeteer.defaultArgs({
        args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials'
        ],
        devtools: true,
        headless: true
    })
    const websocket_connection = await puppeteer.connect({
        browserWSEndpoint: webChromeEndpointUrl,
        slowMo: 10
    })

    return websocket_connection.newPage()
}


;(async () => {
    await axios.get("http://127.0.0.1:9222/json/version").then(response => {
        console.log('port 9222 is running')
    }).catch(async error => {
        console.log('opening port 9222')
        await open_websocket_debugger()
    })

    const page = await configureBrowser()
    page.setDefaultNavigationTimeout(0)
    // Bypass the bot detection systems
    await page_tests.preparePageForTests(page)

    await indeed.indeed(page)

    //await browser_websocket_up.close()
})()
