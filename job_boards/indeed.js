'use strict'
const { answer_indeed_questions } = require('../util/helper_functions/read_indeed_questions.js')

async function indeed(page) {
    // scraping indeed for jobs
    try {
        await page.goto('https://www.indeed.com/', { waitUntil: 'networkidle0' })
        await page.setViewport({
            width: 1440,
            height: 800 ,
            deviceScaleFactor: 1,
        })
        //const whatInputVal = "Software Engineer Entry Level"
        const whatInputVal = "Entry Level Software Engineer Heartdub"
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
        // re-executing selectors bc ElementHandles auto-dispose when their origin frame gets navigated
        jobs_on_page = await page.$$('.jobsearch-SerpJobCard')
        jobs_on_page[i].$eval('h2.title', async job => {
            await job.click()
        }).catch(e => console.log('failing here'))

        await page.waitForNavigation({waitUntil: 'domcontentloaded'})
        await page.waitForSelector('iframe#vjs-container-iframe')
        const iframeElement = await page.$('iframe#vjs-container-iframe')
        await page.waitForTimeout(3000)

        // iframe will pop up to the right with the JD and application...
        const job_header = await page.evaluate(async iframeElement => {
            const iframeDoc = await iframeElement.contentWindow.document || iframeElement.contentDocument
            let apply_indeed = false
            try {
                await iframeDoc.body.querySelector('#indeedApplyButton > div > span').innerText
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
            // add to a file
            //console.log({ job_info })
            return await job_info
        }, iframeElement)
        await console.log(job_header)
        // page frame is navigated to a different url
        // save this data in an excel sheet

        await page.waitForTimeout(3000)
        if (job_header.apply_thro_indeed) { // if I'm able to apply through Indeed
            console.log('able to apply through Indeed')
            // Set up the wait for navigation before clicking the link.
            const navigationPromise = page.waitForNavigation()
            //await page.on('framedetached', () => { console.log('frame detached') })
            await iframeElement.evaluate(async frame => await frame.contentDocument.querySelector('#indeedApplyButton').click())
            await page.waitForTimeout(3000)
            // The navigationPromise resolves after navigation has finished
            await navigationPromise

            await page.waitForXPath('//*[@id="ia-container"]/div/div[1]/div/main/div[2]/div[2]/div/div/div[2]/div/button/span[contains(., "Continue")]')
            // check which step the application is on
            //let step = await page.$eval('div.ia-Navigation-steps', step => step.innerText.match(/step\s+(.)\s+of/)[1])

            const step_heading = await page.$eval('.ia-BasePage-heading', el => el.innerText)
            console.log(step_heading)
            if (step_heading.includes('resume')) {
                // Indeed saves previously uploaded resume, so don't need to do anything
            } else if (step_heading.includes('Questions')) {
                // retrieve questions from the DOM
                await answer_indeed_questions(page)
            }

            await page.click('button.ia-continueButton')
            await navigationPromise
        } else {
            console.log('apply on company website')
            // temporarily, add to a file to manually apply to later
            // check if the job has been applied through the website by cross-referencing the excel sheet
            // apply through the website eventually
        }
        await page.waitForTimeout(3000)
    } // end of jobs_on_page loop
} // fxn indeed

module.exports = { indeed }
