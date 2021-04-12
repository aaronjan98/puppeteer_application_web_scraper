'use strict'
const puppeteer = require('puppeteer')
const axios = require('axios')
const { exec } = require('child_process')
const express = require('express')
const app = express()
const ws = require('ws')
const wss = new ws.Server({ port: 9222, noServer: true })

wss.on('connection', socket => {
  socket.on('message', message => console.log(message))

  socket.on('close', () => {
      console.log('websocket closed')
  })
})

// `server` is a vanilla Node.js HTTP server, so use
// the same ws upgrade process described here:
// https://www.npmjs.com/package/ws#multiple-servers-sharing-a-single-https-server
const server = app.listen(3000)
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, socket => {
    wss.emit('connection', socket, request)
  })
})
// check if websocket is up on port 9222
/*
axios.get('127.0.0.1:9222/json/version').then(res => {
    console.log({ res })
}).catch(err => {
    console.log({ err })
})
*/
// if it's not, run the command: /Applications/Brave\ Browser.app/Contents/MacOS/Brave\ Browser --remote-debugging-port=9222&

/*
async function configureBrowser() {
    let webChromeEndpointUrl
    // connect to local browser instance
    await axios.get('http://127.0.0.1:9222/json/version').then(res => {
        console.log({ res })
        webChromeEndpointUrl = res.data.webSocketDebuggerUrl
    }).catch(error => {
        console.error('error')
        //console.error({ error })
        exec('echo "Hello Bitch"')
            //exec('/Applications/Brave\ Browser.app/Contents/MacOS/Brave\ Browser --remote-debugging-port=9222&')
            //configureBrowser()
        //errno: 'ECONNREFUSED'
    })
    //const websocket_connection = await puppeteer.connect({
        //browserWSEndpoint: webChromeEndpointUrl
    //})

    //return websocket_connection.newPage()
}
configureBrowser()
*/
/*
async function execFxn() {
        try {
                await execSync("python3 ~/stand-up/bot.py", { cwd: "/home/lambdapeergroup/stand-up/" });
        } catch (err) {
                err.status;
        }
}
execFxn();
*/

/*
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
*/
