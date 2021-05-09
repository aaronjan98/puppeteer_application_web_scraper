'use strict'
const { answer_indeed_questions } = require('./read_indeed_questions.js')

async function employer_questions(page) {
    const step_heading = await page.$eval('.ia-BasePage-heading', el => el.innerText)
    if (step_heading.includes('Questions')) {
        await answer_indeed_questions(page)
        return true
    } else {
        return false
    }
}

async function upload_resume(page) {
    const step_heading = await page.$eval('.ia-BasePage-heading', el => el.innerText)
    // Indeed saves previously uploaded resume, so don't need to do anything
    return step_heading.includes('resume') ? true : false
}

// Select a past job that shows relevant experience
async function show_relevant_experience(page) {
    const step_heading = await page.$eval('.ia-BasePage-heading', el => el.innerText)
    // relevant experience is automatically check marked so don't need to do anything
    return step_heading.includes('Select a past job that shows relevant experience') ? true : false
}

async function cover_letter(page) {
    const step_heading = await page.$eval('.ia-BasePage-heading', el => el.innerText)
    // this is optional, but you can upload a cover letter here or paste it in the text box
    return step_heading.includes('Consider adding supporting documents') ? true : false
}

async function review_application(page) {
    const step_heading = await page.$eval('.ia-BasePage-heading', el => el.innerText)
    // you can click to be notified of similar jobs
    return step_heading.includes('Please review your application') ? true : false
}

async function application_submitted(page) {
    const heading = await page.$eval('h1', el => el.innerText)
    return step_heading.includes('Your application has been submitted!') ? true : false
}

async function steps(page) {
    const navigationPromise = page.waitForNavigation() // Set up the wait for navigation before clicking the link.
    // may want to wait for different element
    await page.waitForXPath('//*[@id="ia-container"]/div/div[1]/div/main/div[2]/div[2]/div/div/div[2]/div/button/span[contains(., "Continue")]')
    // check which step the application is on
    let step = await page.$eval('div.ia-Navigation-steps', step => step.innerText.match(/step\s+(.)\s+of/)[1])
    const total_steps = await page.$eval('div.ia-Navigation-steps', step => step.innerText.match(/\sof\s+(.)/)[1])

    // check what each step is asking for and call the corresponding fxn
    for (let i = 0; i <= total_steps; i++) {
        await employer_questions(page)
        await upload_resume(page)
        await show_relevant_experience(page)
        await cover_letter(page)
        await review_application(page)

        await page.click('button.ia-continueButton')
        await page.waitForTimeout(1500)
    }
    await application_submitted(page)
    // Click `Return to job search` button
    await page.$$eval('button > span', btns => {
        btns.forEach(btn => {
            if (btn.innerText == 'Return to job search') {
                btn.click()
            }
        })
    })
    await navigationPromise
}

module.exports = { steps }
