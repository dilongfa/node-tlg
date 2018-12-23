'use strict'

const { randomBytes } = require('crypto')

const charset = '0123456789abcdef'
const hex = []
for(let i = 0; i < 16; i++) {
	for(let n = 0; n < 16; n++) {
		hex.push(charset[i] + charset[n])
	}
}

module.exports = () => {
    const rnds = randomBytes(16)
    rnds[6] = (rnds[6] & 0x0f) | 0x40
    rnds[8] = (rnds[8] & 0x3f) | 0x80
    
    let str = ''
    for(let i = 0; i < 16; i++) {
        str += hex[rnds[i]]
    }

    return str
}
