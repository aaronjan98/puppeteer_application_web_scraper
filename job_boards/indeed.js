'use strict'
const { question_pool } = require('../util/helper_functions/answer_question.js')

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
            let step = await page.$eval('div.ia-Navigation-steps', step => step.innerText.match(/step\s+(.)\s+of/)[1])
            console.log({ step })
            if (step == '1') {
                // check which heading
                // check to see if title has the class of ia-BasePage-heading
                let answer_choices = await page.$$('div.ia-BasePage div.ia-Questions-item')
                /*
                let answer_choices = await page.evaluateHandle(() => {
                    //const base_page_children = apply_portal_container.children
                    const base_page_children = document.querySelector('div.ia-BasePage').children
                    const base_page_heading = base_page_children[0].innerText
                    const base_page_component = base_page_children[1]
                    //const base_page_footer = base_page_children[2]

                    //console.log({ base_page_heading })
                    // check if header contains 'resume' or 'questions'
                    if (base_page_heading.includes('resume')) {
                        // Indeed saves previously uploaded resume, so don't need to do anything
                        //console.log({ base_page_heading })
                    } else if (base_page_heading.includes('Questions')) {
                        // retrieve questions from the DOM
                        const all_questions = base_page_component.querySelectorAll('div.ia-Questions-item')
                        console.log({ all_questions })
                        return all_questions
                        
                        return Array.from(all_questions).map(q => {
                            const question = q.querySelector('span').innerText
                            // need to retrieve answer choices here to be passed into question_pool
                            //! what about error checking!
                            const answer_choices_container = q.querySelectorAll('fieldset > label')
                            // inside each answer choice, i'm retrieving the text

                            //Array.from(answer_choices_container).forEach(choice => console.log(choice)) // empty [] is return for text input questions
                            //* also get the optional text if provided
                            let answer_choices = Array.from(answer_choices_container).map(choice => choice.lastChild.innerText)
                            //let answer_input = Array.from(answer_choices_container).map(choice => choice.click())
                            return answer_choices
                        })
                        
                    } // end of else if (answering employer questions)
                }) // end of page.$eval apply_portal_container
                */
                console.log(answer_choices)
                for (let i = 0; i < answer_choices.length; i++) {
                    const element_handle = await answer_choices[i]
                    //const answer_choice = element_handle.$('span').getProperty('innerText').jsonValue()

                    const question = await element_handle.$eval('span', question => {
                        console.log('question: ', question.innerText)
                        return question.innerText
                    })
                    console.log('q: ', question)
                    //const answer_choice = await (await answer_choices[i].getProperty('innerText')).jsonValue()

                    /*
                    let answer_choices_container = await element_handle.$$('fieldset > label')
                    let answers = await Array.from(await answer_choices_container).map(async choice => {
                        //console.log(await choice.getProperty('innerText').value())
                        //return await choice.getProperty('innerText').jsonValue()
                        console.log(await (await choice.getProperty('innerText')).jsonValue())
                        return await (await choice.getProperty('innerText')).jsonValue()
                    })
                    */
                    //const answers = await element_handle.$eval('fieldset > label', el => {
                        //console.log(el.innerText)
                        //return el.innerText
                    //})
                    let answers = await page.evaluate(async element_handle => {
                        let el = element_handle.querySelectorAll('fieldset > label')
                        console.log('el: ', el)
                        let foo =  await Array.from(el).map(x => {
                            //console.log('x: ', x.innerText)
                            //return await (await x.getAttribute('innerText')).jsonValue()
                            return x.innerText
                        })
                        console.log({ foo })
                        return await foo
                    }, element_handle)
                    //console.log('a: ', answer_choice)
                    console.log('answer_choices:', await answers)
                    //question_pool(question, answer_choices)
                }

                /*
                Array.from(answer_choices).map(q => {
                    console.log('inside')
                    const question = q.$eval('span', question => question.innerText)
                    //const question = q.querySelector('span').innerText
                    console.log(question)

                    // need to retrieve answer choices here to be passed into question_pool
                    //! what about error checking!
                    const answer_choices_container = q.querySelectorAll('fieldset > label')
                    // inside each answer choice, i'm retrieving the text

                    //Array.from(answer_choices_container).forEach(choice => console.log(choice)) // empty [] is return for text input questions
                    //* also get the optional text if provided
                    let answer_choices = Array.from(answer_choices_container).map(choice => choice.lastChild.innerText)
                    //let answer_input = Array.from(answer_choices_container).map(choice => choice.click())
                    console.log(answer_choices)
                })
                */

                /*
                const answer = question_pool(question, answer_choices)

                if (answer == null) { // this question is optional
                // pass
                } else if (answer == undefined) { // if question isn't found, provide a default answer
                // if multiple choice, select first one
                    answer_input[0].click()
                // if an input question (How many years...), type '1'
                } else {
                    console.log({ answer })
                    // select the answer that matches answer
                    Array.from(answer_choices_container).forEach(choice => {
                        if (choice.lastChild.innerText == answer) {
                //answer_input[0].click()
                            choice[1].click()
                        }
                    })
                }
                */ 
            }
            //await page.click('button.ia-continueButton')
            //await navigationPromise
        } else {
            console.log('apply on company website')
            // temporarily, add to a file to manually apply to later
            // check if the job has been applied through the website by cross-referencing the excel sheet
            // apply through the website eventually
        }
        await page.waitForTimeout(3000)
    } // end of jobs_on_page loop
}

module.exports = { indeed }
