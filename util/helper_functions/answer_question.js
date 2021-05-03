'use strict'
const fs = require('fs')
const path = require('path')
const questions_file_path = path.resolve(__dirname, '../indeed_questions.md')

function question_pool(question, answer_choices) {
    try {
        // read contents of the file
        const data = fs.readFileSync(questions_file_path, 'UTF-8')

        // split the contents by new line
        const lines = data.split(/\r?\n/)
        let found_question = false
        let saved_q = null

        // find the question in the file
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            if (line.slice(0, 3) == '1. ') { // if we're on a question
                saved_q = line.slice(2).trim() // retrieve it
                if (found_question) {
                    // didn't find the answer as we reached the question after it w/o stumbling upon an answer
                    return null 
                } else if (saved_q == question) { // Eureka, found the question
                    found_question = true
                }
            } else if (line.trim().length != 0 && line.trim().slice(0, 1) != '>' && found_question) { // make sure we're grabbing the answer and not a comment
                return line.trim()
            } else if (i != 0 && line.trim().slice(0, 1) == '#') { // if not the first line and line starts with '#'
                //append question to the very end of the file
                fs.appendFileSync(questions_file_path, '\n1. '+question+'  ')
                //copy over the answer choices in a comment
                answer_choices.forEach(answer_choice => {
                    fs.appendFileSync(questions_file_path, '\n> '+answer_choice+'  ')
                })
                fs.appendFileSync(questions_file_path, '\n'+'  ')
            }
        }
        return undefined // if the question was not found
    } catch (err) {
        console.error(err)
    }
}

module.exports = { question_pool }
