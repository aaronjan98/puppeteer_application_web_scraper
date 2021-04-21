'use strict'
const puppeteer = require('puppeteer')
const axios = require('axios')
const util = require('util')
const { exec } = require('child_process')
const timer = ms => new Promise( res => setTimeout(res, ms))

async function open_websocket_debugger() {
    // need to launch Chrome with the "--remote-debugging-port=9222 argument to connect to an existing browser session
    try {
        await exec("osascript /Users/jan/Documents/dev/shellscript/run.scpt")
    } catch (err) {
        await err.status
    }

    await timer(5000).then(async _ => {
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
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials'
        ],
        devtools: true,
        headless: true
    })
    const websocket_connection = await puppeteer.connect({
        browserWSEndpoint: webChromeEndpointUrl,
        slowMo: 50
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

async function close_suggested_opportunity() {
    try { // close suggested opportunity
        await page.waitForSelector('#popover-foreground > #popover-x')
        await page.click('#popover-foreground > #popover-x')
    } catch (e) {
        console.log('Error with closing suggested opp', e)
    }
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
        const whatInputVal = "Software Engineer Entry Level"
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
            await page.waitForTimeout(3000)
        }
    } catch (error) {
        console.error(error)
    }
    // searching through each job from search query
    let jobs_on_page = await page.$$('.jobsearch-SerpJobCard')
    for(let i = 0; i < jobs_on_page.length; i++) {
        jobs_on_page[i].$eval('h2.title', async job => {
            await job.click()
        })
        await page.waitForNavigation({waitUntil: 'domcontentloaded'})
        await page.waitForSelector('iframe#vjs-container-iframe')
        const iframeElement = await page.$('iframe#vjs-container-iframe')
        await page.waitForTimeout(3000)

        // iframe will pop up to the right with the JD and application...
        const job_header = await page.evaluate(async iframeElement => {
            const iframeDoc = await iframeElement.contentWindow.document || iframeElement.contentDocument
            let apply_indeed = false
            try {
                await iframeDoc.body.querySelector('#indeedApplyWidget > div.icl-u-lg-hide.is-embedded > button > span.jobsearch-HighlightIndeedApplyButton-text').innerText
                apply_indeed = true
            } catch {
                apply_indeed = false
            }
            const job_info = await {
                apply_thro_indeed: apply_indeed,
                application_link: 'https://www.indeed.com' + iframeElement.src,
                job_title: await iframeDoc.body.querySelector('h1').innerText,
                company: await iframeDoc.body.querySelector('.jobsearch-InlineCompanyRating div').innerText,
                job_location: await iframeDoc.body.querySelector('.jobsearch-JobInfoHeader-subtitle').lastChild.innerText,
                job_description: await iframeDoc.body.querySelector('#jobDescriptionText').innerText
            }
            console.log({ job_info })

            if (job_info.apply_thro_indeed) { // check if you can apply through Indeed
                await Promise.all([iframeDoc.body.querySelector('#indeedApplyWidget > div.icl-u-lg-hide.is-embedded > button > span.jobsearch-HighlightIndeedApplyButton-text').click()])
            }

            return await job_info
        }, iframeElement)
        await console.log(job_header)

        await page.waitForTimeout(3000)
        if (job_header.apply_thro_indeed) {
            await page.waitForSelector("div.indeed-apply-popup")
            // select nested iFrame apply.indeed.com
            const container_frame = await page.frames().find(frame => frame.name().includes('indeedapply-modal-preload'))
            const apply_frame = await container_frame.childFrames()[0]
            try { // check if the job has been applied to already
                if (await apply_frame.$eval('#ia_success', el => el.innerText.contains('You have applied'))) {
                    apply_frame.click('#close-popup')
                    close_suggested_opportunity()
                }
            } catch {
                // pass
            }
            try { // click continue
                const [response] = await Promise.all([
                  apply_frame.waitForNavigation({ timeout: 30000 }),
                  apply_frame.click('#form-action-continue'),
                ])
            } catch (e) {
                console.log('Error with #form-action-continue', e)
            }
            try { // click applied
                const [response] = await Promise.all([
                    apply_frame.waitForNavigation(),
                    apply_frame.click('#form-action-submit'),
                ])
            } catch (e) {
                console.log('Error with #form-action-submit', e)
            }
            try { // continue or close
                const [response] = await Promise.all([
                    apply_frame.waitForNavigation(),
                    apply_frame.click('#ia-container > div > div.ia-ConfirmationScreen-closeLink'),
                ])
                console.log('successfully applied')
            } catch (e) {
                console.log('Error with #ia-container > div > div.ia-ConfirmationScreen-closeLink', e)
            }
            close_suggested_opportunity()
        } else {
            console.log('apply on company website')
        }
        await page.waitForTimeout(5000)
    }
    //await browser_websocket_up.close()
})()
