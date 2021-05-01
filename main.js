'use strict'
const axios = require('axios')
// import job_board files and helper fxns
const { indeed } = require('./job_boards/indeed.js')
const { preparePageForTests } = require('./util/helper_functions/page_tests.js')
const { configureBrowser } = require('./util/helper_functions/setup_page.js')
const { open_websocket_debugger } = require('./util/helper_functions/connect_browser.js')

;(async () => {
    // check if connection to browser instance is established
    await axios.get("http://127.0.0.1:9222/json/version").then(response => {
        console.log('port 9222 is running')
    }).catch(async error => {
        await open_websocket_debugger()
    })

    const page = await configureBrowser()
    page.setDefaultNavigationTimeout(0)
    await preparePageForTests(page) // Bypass the bot detection systems

    // job boards to scrape
    await indeed(page)

    //await page.close()
})()
