'use strict'

const { Client } = require('.')

main()

async function main() {
	const client = new Client({
		apiId: 999999, 
		apiHash: '7cb3e46a69d2e69753744e216eb4e613'
	})

	try {
		await client.connect('user', 'YOUR_PHONE_NUMBER')
		await client.sendMessage('YOUR_FRIEND_ID', 'Hello my friend')
		await client.close()
	} catch(e) {
		console.error('ERROR', e)
	}
}
