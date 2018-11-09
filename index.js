const rl = require('readline').createInterface({
    input:  process.stdin,
    output: process.stdout
})

function getData() {
    return new Promise(resolve => {
        rl.prompt()
        rl.on('line', (input) => {
            let data = input.trim()
            if (data == '') {
                resolve(data);
            }

            rl.close();
        })
    })
}

async function getUsername() {
    rl.setPrompt('Username: ')
    let username = await getData()
    console.log(username)
}

getUsername()

// module.exports 
