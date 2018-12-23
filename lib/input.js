'use strict'

const readline = require('readline')

module.exports = (title = '', message = '') => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    
    if (title) {
        rl.setPrompt(`${title} `) 
    }

    return new Promise(resolve => {
        rl.prompt()
        rl.on('line', (input) => {
            input = input.trim()
            if (input !== '') { 
                resolve(input)
                rl.close()
            } else {
                console.info(message) 
                rl.prompt()
            }
        })
    })
}
