'use strict'

const Client = require('./client')

class SecretChatClient extends Client {
	constructor(options = {}) {
		super(options)
	}
 
	async getSecretChats() {
		let {chat_ids: chats} = await this.getChats()
		chats = chats.map(id => this.getChat(id))
		chats = await Promise.all(chats)
		chats = chats.filter(chat => chat.type['@type'] === 'chatTypeSecret')
		return chats
	}

	async getSecretChat(id) {
		return this.request('getSecretChat', {secret_chat_id: id})
	}

	async createSecretChat(id) {
		return this.request('createSecretChat', {secret_chat_id: id})
	}

	async closeSecretChat(id) {
		return this.request('closeSecretChat', {secret_chat_id: id})
	}

	async deleteSecretChat(id) {
		return this._deleteChat(id)
	}

    async createNewSecretChat(user) {
		let user_id
		if (isNaN(user)){
			user_id = (await this.searchPublicChat(user)).id
		} else {
			user_id = (await this.getUser(parseInt(user))).id
		}
        
		const chats = await this.getSecretChats()
		const result = chats.find(chat => chat.type.user_id === user_id)
		if (result) {
			return result
		}
        return this.request('createNewSecretChat', { user_id: user_id })
    }
}

module.exports = SecretChatClient
