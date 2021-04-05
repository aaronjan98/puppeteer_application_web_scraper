const puppeteer = require('puppeteer')

;(async () => {

    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 500,
        args: ['--start-maximized'] 
    })

    const webChromeEndpointUrl = 'ws://localhost:9222/devtools/browser/a6fedaa0-5f94-4fdf-af55-fc1b35c677d5'
    const websocket_connection = await puppeteer.connect({
        browserWSEndpoint: webChromeEndpointUrl,
    })

    const page = await websocket_connection.newPage()

    try {
        await page.goto('https://www.indeed.com/', {waitUntil: 'load'})
        await page.setViewport({
            width: 1920,
            height: 1080 ,
            deviceScaleFactor: 1,
        })
        const whatInputVal = "Software Engineer"
        const whereInputVal = "Remote"
        await page.type('#text-input-what', whatInputVal)
        //await page.$eval('#text-input-where', el => el.value = 'Remote');
        //await page.evaluate(() => document.getElementById("text-input-where").value = "")
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
