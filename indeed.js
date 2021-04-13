'use strict'
const puppeteer = require('puppeteer')
const axios = require('axios')
const { exec } = require('child_process')
const timer = ms => new Promise( res => setTimeout(res, ms))

async function execFxn() {
    try {
        await exec("osascript /Users/jan/Documents/dev/shellscript/run.scpt")
    } catch (err) {
        await err.status
    }

    await timer(3000).then(_=>console.log("port 9222 will be up"))

    // check if websocket is up on port 9222
    await axios.get('http://127.0.0.1:9222/json').then(res => {
        console.log('port 9222 is up')
    }).catch(async err => {
        await err.status
    })
}

async function configureBrowser() {
    let webChromeEndpointUrl

    // connect to local browser instance
    const browser_websocket_up = await axios.get('http://127.0.0.1:9222/json/version').then(async res => {
        console.log({ res })
        webChromeEndpointUrl = await res.data.webSocketDebuggerUrl
    }).catch(error => {
        console.error({ error })
    })
    //console.log({ browser_websocket_up.data })
    //webChromeEndpointUrl = await browser_websocket_up.data.webSocketDebuggerUrl
    const websocket_connection = await puppeteer.connect({
        browserWSEndpoint: webChromeEndpointUrl
    })

    return websocket_connection.newPage()
}

;(async () => {
    await axios.get("http://127.0.0.1:9222/json/version").then((response) => {
        console.log(true)
    }).catch(async error => {
        console.log(false)
        await execFxn()
    })

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
            await page.click('#pj_969ba00119193de1 h2') // Clicking the link will indirectly cause a navigation
            await page.waitForTimeout(2000)
            await page.reload()
            // waiting for the header of the card we clicked so that we can confirm the titles
            await page.waitForXPath('//*[@id="viewJobSSRRoot"]/div/div[2]')
            let job_header = await page.$x('//*[@id="viewJobSSRRoot"]/div/div[2]/div/div[1]/div[1]/h1').innerText
            console.log(job_header)
            // iwebvisit
        }

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
        
        //console.log({ response })
    } catch (error) {
        console.error(error)
    }

    //await browser_websocket_up.close()
})()
