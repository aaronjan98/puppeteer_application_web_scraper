const puppeteer = require('puppeteer')
const axios = require('axios')

;(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 500,
        args: ['--start-maximized'] 
    })
    let webChromeEndpointUrl

    // connect to local browser instance
    try {
        const browser_websocket_up = await axios.get('http://127.0.0.1:9222/json/version').catch(error => console.error(error))
        webChromeEndpointUrl = browser_websocket_up.data.webSocketDebuggerUrl

    } catch(error) {
        console.error('not listening to port 9222', error)
    }
    const websocket_connection = await puppeteer.connect({
        browserWSEndpoint: webChromeEndpointUrl,
    })
    const page = await websocket_connection.newPage()

    // scraping indeed for jobs
    try {
        await page.goto('https://www.indeed.com/', {waitUntil: 'load'})
        await page.setViewport({
            width: 1920,
            height: 1080 ,
            deviceScaleFactor: 1,
        })
        const whatInputVal = "Software Engineer Entry Level"
        const whereInputVal = "Remote"
        await page.type('#text-input-what', whatInputVal)
        // Indeed saves this field with the last input so this clears it
        const input = await page.$('#text-input-where');
        await input.click({ clickCount: 2 })
        await page.keyboard.press('Backspace')
        await page.type('#text-input-where', whereInputVal)

        const [button] = await page.$x("//*[@id='whatWhereFormId']/div[3]/button[contains(., 'Find jobs')]")

        if (button) {
            await button.click()
        }
    } catch (error) {
        console.error(error)
    }

    //await browser.close();
})()
