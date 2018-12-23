'use strict'

const TDLib = require('./tdlib')

class Client extends TDLib {
	constructor(options = {}) {
		super(options)
	} 

	async searchPublicChat(username) {
		return this.request('searchPublicChat', {
			username: username
		})
	}
	
	async getMe(id) {
		return this.request('getMe')
	}

	async getUser(id) {
		return this.request('getUser', {
			user_id: id
		})
	}

	async getChat(id) {
		return this.request('getChat', {
			chat_id: id
		})
	}

	async getChats() {
		return this.request('getChats', {
			offset_order: '9223372036854775807',
			offset_chat_id: 0,
			limit: Math.floor(Math.random() * 9999999)
		})
	}

	async deleteChatHistory(id) {
		return this.request('deleteChatHistory', {
			chat_id: id, 
			remove_from_chat_list: true
		})
	}

	async openChat(id) {
		return this.request('openChat', {
			chat_id: id
		})
	}

	async closeChat(id) {
		return this.request('closeChat', {
			chat_id: id
		})
	}

	async _deleteChatMember(chat_id, user_id) {
		return this.request('setChatMemberStatus', {
			chat_id: chat_id,
			user_id: user_id,
			status: {'@type': 'chatMemberStatusLeft'}
		})
	}

	async _deleteChat(id) {
		const chat = await this.getChat(id)
		switch (chat.type['@type']) {
			case 'chatTypeBasicGroup':
			case 'chatTypeSupergroup':
			  	const { id: user_id } = await this.getMe()
			  	await this._deleteChatMember(id, user_id)
			break
			case 'chatTypeSecret':
				await this.request('closeSecretChat', {secret_chat_id: chat.type.secret_chat_id})
				await this.deleteChatHistory(id)
			break
			default:
				await this.closeChat(id)
				await this.deleteChatHistory(id)
		}
	}

	async createPrivateChat(id) {
		return this.request('createPrivateChat', {
			user_id: id
		})
	} 

	async getMessage(chat_id, message_id) {
		return this.request('getMessage', {
			chat_id: chat_id, 
			message_id: message_id
		})
	}

	async getMessages(chat_id, message_ids = []) {
		return this.request('getMessages', {
			chat_id: chat_id, 
			message_ids: message_ids
		})
	}

    async sendMessage(chat_id, text, type = 'text') {
        return this.request('sendMessage', {
            chat_id: chat_id, 
            reply_to_message_id: 0, 
            disable_notification: false, 
			from_background: true, 
            input_message_content: {
				'@type': 'inputMessageText', 
				text: await this.parseTextEntities(text, type), 
				disable_web_preview: true, 
				clear_draft: true
			}
        })
    }

    /**
     * @param {string} text 
     * @param {string} type text|markdown|html 
     */
    async parseTextEntities(text, type = 'text') {
        switch (type.toLowerCase()) {
            case 'markdown':
                return this.request('parseTextEntities', {text: text, parse_mode: {'@type': 'textParseModeMarkdown'} })
            case 'html':
                return this.request('parseTextEntities', {text: text, parse_mode: {'@type': 'textParseModeHTML'} })
            default:
                return {text}
        }
    }
}

module.exports = Client
