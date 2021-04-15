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

    await puppeteer.defaultArgs({
        headless: true
    })
    const websocket_connection = await puppeteer.connect({
        browserWSEndpoint: webChromeEndpointUrl,
        slowMo: 10
    })

    return websocket_connection.newPage()
}

// Bypass the bot detection systems
const preparePageForTests = async (page) => {
  // Pass the User-Agent Test.
  const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36'
  await page.setUserAgent(userAgent)

  // Pass the Webdriver Test.
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    })
  })

  // Pass the Chrome Test.
  await page.evaluateOnNewDocument(() => {
    // We can mock this in as much depth as we need for the test.
    window.chrome = {
      runtime: {},
      // etc.
    }
  })

  // Pass the Permissions Test.
  await page.evaluateOnNewDocument(() => {
    const originalQuery = window.navigator.permissions.query;
    return window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    )
  })

  // Pass the Plugins Length Test.
  await page.evaluateOnNewDocument(() => {
    // Overwrite the `plugins` property to use a custom getter.
    Object.defineProperty(navigator, 'plugins', {
      // This just needs to have `length > 0` for the current test,
      // but we could mock the plugins too if necessary.
      get: () => [1, 2, 3, 4, 5],
    })
  })

  // Pass the Languages Test.
  await page.evaluateOnNewDocument(() => {
    // Overwrite the `plugins` property to use a custom getter.
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    })
  })
}

;(async () => {
    await axios.get("http://127.0.0.1:9222/json/version").then(response => {
        console.log('port 9222 is already running')
    }).catch(async error => {
        console.log('opening port 9222')
        await open_websocket_debugger()
    })

    const page = await configureBrowser()
    await preparePageForTests(page)

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
            //const frame = await iframeElement.contentWindow()
            //console.log({ frame })
            //console.log(util.inspect(frame).contentDocument)
            /*
             Running this in the DOM works:
             document.querySelector('iframe#vjs-container-iframe').contentDocument.querySelector('#viewJobSSRRoot > div > div.jobsearch-JobComponent-embeddedHeader > div > div:nth-child(2) > div.jobsearch-JobInfoHeader-title-container.jobsearch-JobInfoHeader-title-containerEji > h1').innerText
            */
            //const aHandle = await page.evaluateHandle(() => document.querySelector('iframe#vjs-container-iframe').contentDocument)
            //const resultHandle = await page.evaluateHandle(body => body.querySelector('#viewJobSSRRoot').innerHTML, aHandle)
            //console.log(await resultHandle.jsonValue());
            //await resultHandle.dispose();
            //const h1_title = await frame.$('#viewJobSSRRoot > div > div.jobsearch-JobComponent-embeddedHeader > div > div:nth-child(2) > div.jobsearch-JobInfoHeader-title-container.jobsearch-JobInfoHeader-title-containerEji > h1')
            const h1_title = await frame.$('body')
            console.log({ h1_title })
            /*
            const job_header = await page.evaluateHandle(async iframeElement => {
                console.log('iframe doc: ', await iframeElement.contentDocument)
                console.log('document.iframe: ', await document.querySelector('iframe#vjs-container-iframe').contentDocument)
                console.log('src: ', await document.querySelector('iframe#vjs-container-iframe').contentDocument.src)

                let foo = await document.querySelector('iframe#vjs-container-iframe').contentDocument.querySelector('#viewJobSSRRoot > div > div.jobsearch-JobComponent-embeddedHeader > div > div:nth-child(2) > div.jobsearch-JobInfoHeader-title-container.jobsearch-JobInfoHeader-title-containerEji > h1').innerText
                console.log({ foo })
                return foo
            }, iframeElement)
            console.log({ job_header })
            */
        }

    } catch (error) {
        console.error(error)
    }
    //await browser_websocket_up.close()
})()
