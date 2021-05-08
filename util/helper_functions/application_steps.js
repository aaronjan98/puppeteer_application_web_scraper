'use strict'
const { answer_indeed_questions } = require('./read_indeed_questions.js')

async function steps(page) {
    const navigationPromise = page.waitForNavigation() // Set up the wait for navigation before clicking the link.
    // may want to wait for different element
    await page.waitForXPath('//*[@id="ia-container"]/div/div[1]/div/main/div[2]/div[2]/div/div/div[2]/div/button/span[contains(., "Continue")]')
    // check which step the application is on
    let step = await page.$eval('div.ia-Navigation-steps', step => step.innerText.match(/step\s+(.)\s+of/)[1])
    //await navigationPromise
    if (step == '1') {
        console.log({ step })
        let step_heading = await page.$eval('.ia-BasePage-heading', el => {
            console.log(el.innerText)
            return el.innerText
        })
        if (step_heading.includes('resume')) {
            console.log(await step_heading)
            // Indeed saves previously uploaded resume, so don't need to do anything
        } else if (step_heading.includes('Questions')) {
            console.log(await step_heading)
            // retrieve questions from the DOM
            await answer_indeed_questions(page)
        }
        await page.click('button.ia-continueButton')
        await page.waitForTimeout(1500)
    }
    await navigationPromise
    step = await page.$eval('div.ia-Navigation-steps', step => step.innerText.match(/step\s+(.)\s+of/)[1])
    console.log({ step })
    if (step == '2') {
        await navigationPromise
        let step_heading = await page.$eval('.ia-BasePage-heading', el => {
            console.log(el.innerText)
            return el.innerText
        })
        if (step_heading.includes('resume')) {
            console.log(await step_heading)
            // Indeed saves previously uploaded resume, so don't need to do anything
        } else if (step_heading.includes('Questions')) {
            console.log(await step_heading)
            // retrieve questions from the DOM
            await answer_indeed_questions(page)
        }
        await page.click('button.ia-continueButton')
        await navigationPromise
    }
    //! going to have to check which step again

    await page.click('button.ia-continueButton')
    await navigationPromise
}

module.exports = { steps }
