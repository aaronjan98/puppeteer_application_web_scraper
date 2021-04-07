'use strict'
const puppeteer = require('puppeteer')
const axios = require('axios')

async function configureBrowser() {
    let webChromeEndpointUrl
    // connect to local browser instance
    const browser_websocket_up = await axios.get('http://127.0.0.1:9222/json/version').catch(error => console.error(error))
    webChromeEndpointUrl = browser_websocket_up.data.webSocketDebuggerUrl
    const websocket_connection = await puppeteer.connect({
        browserWSEndpoint: webChromeEndpointUrl
    })

    return websocket_connection.newPage()
}

;(async () => {
    const page = await configureBrowser()

    // scraping indeed for jobs
    try {
        await page.goto('https://www.indeed.com/', { waitUntil: 'networkidle0' })
        await page.setViewport({
            width: 1440,
            height: 800 ,
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
            await page.waitForXPath('//*[@id="resultsBody"]')
            //await page.waitForNavigation()
            await page.waitForTimeout(2000)
            await page.click('#pj_b16bfe080759710e h2') // Clicking the link will indirectly cause a navigation
            await page.waitForTimeout(2000)
            await page.reload()
            //await page.waitForSelector('.jobsearch-ViewJobLayout .jobsearch-JobComponent-embeddedHeader .jobsearch-JobInfoHeader-title')
            await page.waitForXPath('//*[@id="viewJobSSRRoot"]')
            let job_header = await page.$x('//*[@id="viewJobSSRRoot"]/div/div[2]/div/div[1]/div[1]/h1').innerText
            console.log(job_header)
            // iwebvisit
        }

        /*
        const options = await page.$eval('.jobsearch-SerpJobCard', async job => {
            // we want to click on this job
            await job.click()
            // this will take us to a new tab
            // continue scraping in the new tab
            // apply and close it to continue to the list of jobs
        })

        const [response] = await Promise.all([
            page.waitForNavigation(), // The promise resolves after navigation has finished
            page.click('#pj_969ba00119193de1'), // Clicking the link will indirectly cause a navigation
        ]);
        */
        
        //console.log({ response })
    } catch (error) {
        console.error(error)
    }

    //await browser_websocket_up.close()
})()
