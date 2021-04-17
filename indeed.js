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
        args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins',
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
    page.setDefaultNavigationTimeout(0)
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
        const input = await page.$('#text-input-where')
        await input.click({ clickCount: 3 })
        await page.keyboard.press('Backspace')
        await page.type('#text-input-where', whereInputVal)

        const [button] = await page.$x("//*[@id='whatWhereFormId']/div[3]/button[contains(., 'Find jobs')]")

        if (button) {
            await button.click()
            await page.waitForXPath('//*[@id="resultsBody"]')
        }

    } catch (error) {
        console.error(error)
    }

    // click on the job you want to apply for...
    await page.click('#pj_47e12f963a510960 h2')
    //await page.setDefaultNavigationTimeout(0) 
    await page.waitForNavigation({waitUntil: 'domcontentloaded'})

    await page.waitForSelector('iframe#vjs-container-iframe')
    const iframeElement = await page.$('iframe#vjs-container-iframe')
    await page.waitForTimeout(3000)

    // iframe will pop up to the right with the JD and application...
    const job_header = await page.evaluate(async iframeElement => {
        const iframe = await document.querySelector('#vjs-container-iframe')
        const iframeDoc = await iframe.contentWindow.document || iframe.contentDocument
        const job_info = await {
            apply_thro_indeed: await iframeDoc.body.querySelector('#indeedApplyWidget > div.icl-u-lg-hide.is-embedded > button > span.jobsearch-HighlightIndeedApplyButton-text').innerText == 'Apply with Indeed',
            job_title: await iframeDoc.body.querySelector('h1').innerText,
            company: await iframeDoc.body.querySelector('#viewJobSSRRoot > div > div.jobsearch-JobComponent-embeddedHeader > div > div:nth-child(2) > div.jobsearch-CompanyInfoWithoutHeaderImage.jobsearch-CompanyInfoWithReview.jobsearch-CompanyInfoEji > div > div > div.jobsearch-InlineCompanyRating.icl-u-xs-mt--xs.icl-u-xs-mb--md > div.icl-u-lg-mr--sm.icl-u-xs-mr--xs > a').innerText,
            job_location: await iframeDoc.body.querySelector('#viewJobSSRRoot > div > div.jobsearch-JobComponent-embeddedHeader > div > div:nth-child(2) > div.jobsearch-CompanyInfoWithoutHeaderImage.jobsearch-CompanyInfoWithReview.jobsearch-CompanyInfoEji > div > div > div:nth-child(2)').innerText,
            job_description: await iframeDoc.body.querySelector('#jobDescriptionText').innerText
        }

        if (job_info.apply_thro_indeed) {
            await Promise.all([iframeDoc.body.querySelector('#indeedApplyWidget > div.icl-u-lg-hide.is-embedded > button > span.jobsearch-HighlightIndeedApplyButton-text').click()])
        }

        return await job_info
    }, iframeElement)
    await console.log(job_header)

    //await Promise.all([ page.click("button[type=submit]" ])
    await page.waitForTimeout(3000)
    if (job_header.apply_thro_indeed) {
        await page.waitForSelector("div.indeed-apply-popup")
        //await page.waitForNavigation({waitUntil: 'domcontentloaded'})
        //await page.waitForNavigation({waitUntil: 'domcontentloaded'})
        //await page.waitForXPath("//*[@id='indeedapply-modal-preload-1618642111867-iframe']")
        //const [job_portal] = await page.$x("//*[@id='indeedapply-modal-preload-1618642111867-iframe']")
        //const [job_portal] = await page.$x("//*[@id='ia-ApplyFormScreen']")
        //const job_portal = await page.$("#ia-ApplyFormScreen")
        //console.log({ job_portal })

        const continue_application = await page.evaluate(async () => {
            //const apply_form = await document.querySelector("iframe[title='Job application form']").src
            const apply_form = await document.querySelector("div.indeed-apply-popup > div.indeed-apply-container > div.indeed-apply-bd  > iframe[title='Job application form container']")

            console.log(apply_form)
            // this only works when you inspect an element in the js console
            // document.querySelector("iframe[title='Job application form']").contentWindow.document.querySelector('#form-action-continue') 
            return apply_form
        })
        console.log(continue_application)
    }
    
    //await browser_websocket_up.close()
})()
