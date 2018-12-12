'use strict'

class Api {
    constructor(client) {
        this.client = client
    }

    async getMe() {
        return this.client.request({'@type': 'getMe'})
    }

    async getUserId(username) {
        return (await this.searchPublicChat(username)).id
    }

    async searchPublicChat(username) {
        return this.client.request({'@type': 'searchPublicChat', username: username})
    }

    // async closeSecretChat(secret_chat_id) {
    //     this.send({_: 'closeSecretChat', secret_chat_id: secret_chat_id})
    // }

    // async createSecretChat(secret_chat_id) {
    //     this.send({_: 'createSecretChat', secret_chat_id: secret_chat_id})
    // }

    // async getSecretChat(secret_chat_id) {
    //     this.send({_: 'getSecretChat', secret_chat_id: secret_chat_id})
    // }

    async createNewSecretChat(user_id) {
        return this.client.request({'@type': 'createNewSecretChat', user_id: user_id})
    }

    // async sendMessage(text, chat_id) {
    //     const InputMessageContent = {_:'inputMessageText', text: text, disable_web_preview: 0, clear_draft: 0, entities: []}
    //     this.send({
    //         _: 'sendMessage', 
    //         chat_id: chat_id, 
    //         reply_to_message_id: 0, 
    //         disable_notification: 0, 
    //         from_background: 0, 
    //         input_message_content: InputMessageContent
    //     })
    // }

    /**
     * @param {string} text 
     * @param {string} parse_mode markdown|md|html 
     */
    async _generateFormattedText(text, parse_mode) {
        console.log(text)
        text = text.toString()
        if (!parse_mode) return {text}

        switch (parse_mode.toLowerCase()) {
            case 'md':
            case 'markdown':
                return this.client.send('parseTextEntities', {text, parse_mode: {'@type': 'textParseModeMarkdown'} })
            case 'html':
                return this.client.send('parseTextEntities', {text, parse_mode: {'@type': 'textParseModeHTML'} })
            default:
                return {text}
        }
    }

}

module.exports = Api
