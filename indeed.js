'use strict'
const puppeteer = require('puppeteer')
const axios = require('axios')
const util = require('util')
const { exec } = require('child_process')
const timer = ms => new Promise( res => setTimeout(res, ms))

async function open_websocket_debugger() {
    try {
        await exec("osascript /Users/jan/Documents/dev/shellscript/run.scpt")
    } catch (err) {
        await err.status
    }

    await timer(3000).then(async _ => {
        await axios.get('http://127.0.0.1:9222/json').then(res => {
            console.log('port 9222 is up')
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

    const websocket_connection = await puppeteer.connect({
        browserWSEndpoint: webChromeEndpointUrl
    })

    return websocket_connection.newPage()
}

;(async () => {
    await axios.get("http://127.0.0.1:9222/json/version").then(response => {
        console.log('port 9222 is already running')
    }).catch(async error => {
        console.log('opening port 9222')
        await open_websocket_debugger()
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
        //const whatInputVal = "Software Engineer Entry Level"
        const whatInputVal = "Entry Level Software Developer - Train to Hire Opportunity"
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
            await page.waitForTimeout(2000)
            // click on the job you want to apply for...
            await page.click('#pj_47e12f963a510960 h2')
            await page.setDefaultNavigationTimeout(0) 
            await page.waitForNavigation({waitUntil: 'domcontentloaded'})

            await page.waitForSelector('iframe#vjs-container-iframe')
            const iframeElement = await page.$('iframe#vjs-container-iframe')
            const frame = await iframeElement.contentFrame()
            await frame.waitForSelector('#viewJobSSRRoot > div > div.jobsearch-JobComponent-embeddedHeader > div > div:nth-child(2) > div.jobsearch-JobInfoHeader-title-container.jobsearch-JobInfoHeader-title-containerEji > h1')

            //console.log(util.inspect(frame))

            const job_header = await page.evaluate(async frame => {
                let foo = await frame.querySelector('#viewJobSSRRoot > div > div.jobsearch-JobComponent-embeddedHeader > div > div:nth-child(2) > div.jobsearch-JobInfoHeader-title-container.jobsearch-JobInfoHeader-title-containerEji > h1').innerText
                console.log({ foo })
            }, frame)

            console.log({ job_header })
        }

    } catch (error) {
        console.error(error)
    }

    //await browser_websocket_up.close()
})()
