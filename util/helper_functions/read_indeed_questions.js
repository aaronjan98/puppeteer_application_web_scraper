'use strict'
const { question_pool } = require('./answer_question.js')

async function answer_indeed_questions(page) {
    // check which heading, like if it's asking for you to answer employer questions
    // check to see if title has the class of ia-BasePage-heading
    const answer_choices = await page.$$('div.ia-BasePage div.ia-Questions-item')

    // gather all the questions and answer choices
    for (let i = 0; i < answer_choices.length; i++) {
        const choices_handle = await answer_choices[i]
        const question = await choices_handle.$eval('span', question => question.innerText)
        let answers = await page.evaluate(async choices_handle => {
            const choices = choices_handle.querySelectorAll('fieldset > label')
            return await Array.from(choices).map(choice => choice.innerText)
        }, choices_handle)
        if (!answers.length) {
            answers = 'text box answer'
        }
        const rtn_ans = question_pool(question, answers) // checks the file with the pre-saved questions
        console.log({ rtn_ans })

        // select answer on the page
        if (rtn_ans == null) { // this question is optional
        // pass
        } else if (rtn_ans == undefined) { // if question isn't found, provide a default answer
            if (answers == 'text box answer') { // text box answer
                // if an input question (How many years...), type '1'
                const num_input = await choices_handle.$('input')
                num_input.type('1', {delay: 100})
            } else { // selecting the first option if coming across new question
                await page.evaluate(choices_handle => {
                    choices_handle.querySelector('fieldset > label').click()
                }, choices_handle)
            }
        } else { // select option that matches rtn_ans
            if (answers == 'text box answer') { // text box answer
                const num_input = await choices_handle.$('input')
                num_input.type(rtn_ans, {delay: 100})
            } else { // select one of the multiple choice options
                await page.evaluate((choices_handle, rtn_ans) => {
                    const choices = choices_handle.querySelectorAll('fieldset > label')
                    Array.from(choices).forEach(choice => {
                        if (choice.innerText == rtn_ans) {
                            choice.click()
                        }
                    })
                }, choices_handle, rtn_ans)
            }
        } // else
    } // end of for looping questions
}

module.exports = { answer_indeed_questions }
