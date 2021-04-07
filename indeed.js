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
            width: 1800,
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
            await page.waitForXPath('//*[@id="resultsBody"]')
        }

        const options = await page.$$eval('.jobsearch-SerpJobCard', jobs => {
            let jobs_to_apply = []

            Array.from(jobs).map(async (job_info) => {
                let job = {
                    'title': await job_info.querySelector('h2.title > a').innerText,
                    'company': await job_info.querySelector('div.sjcl > div > span.company').innerText,
                    'location': await job_info.querySelector('div.sjcl > div.location').textContent,
                    'summary': await Array.from(job_info.querySelector('div.summary > ul')).map( li => {
                        console.log({ li })
                        return 'hi'
                    }),
                }
                console.log(job_info.querySelector('div.summary > ul'))
                jobs_to_apply.push(job)
            })
            return jobs_to_apply
        })

        console.log({ options })
    } catch (error) {
        console.error(error)
    }

    //await browser_websocket_up.close()
})()
