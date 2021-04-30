'use strict'
const axios = require('axios')
// import job_board files and helper fxns
const indeed = require('./job_boards/indeed.js')
const page_tests = require('./util/helper_functions/page_tests.js')
const setup_page = require('./util/helper_functions/setup_page.js')
const connect_browser = require('./util/helper_functions/connect_browser.js')

;(async () => {
    // check if connection to browser instance is established
    await axios.get("http://127.0.0.1:9222/json/version").then(response => {
        console.log('port 9222 is running')
    }).catch(async error => {
        await connect_browser.open_websocket_debugger()
    })

    const page = await setup_page.configureBrowser()
    page.setDefaultNavigationTimeout(0)
    await page_tests.preparePageForTests(page) // Bypass the bot detection systems

    // job boards to scrape
    await indeed.indeed(page)

    //await page.close()
})()
