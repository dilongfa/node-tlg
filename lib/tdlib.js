'use strict'

const EventEmitter = require('events')
const ffi 	= require('ffi-napi')
const path 	= require('path')
const input = require('./input')
const uuid 	= require('./uuid')

class TDLib extends EventEmitter {
	constructor(options = {}) {
		super()
		
		const defaults = {
			libraryFile: process.platform === 'win32' && 'tdjson' || 'libtdjson',
			databaseDirectory: '.tlg', 
			logFile: 'tlg.log',
			encryptionKey: '',
			verbosityLevel: 1
		}
		this.options = {...defaults, ...options}

		this.tdlib = ffi.Library(path.resolve(this.options.libraryFile), {
			'td_json_client_create'          : ['pointer', []],
			'td_json_client_send'            : ['void'   , ['pointer', 'string']],
			'td_json_client_receive'         : ['string' , ['pointer', 'double']],
			'td_json_client_destroy'         : ['void'   , ['pointer']],
			'td_set_log_file_path'           : ['int'    , ['string']],
			'td_set_log_verbosity_level'     : ['void'   , ['int']]
		})

		this.tdlib.td_set_log_file_path(path.resolve(this.options.logFile))
		this.tdlib.td_set_log_verbosity_level(this.options.verbosityLevel)

		this.instance = null
		this.fetching = new Map()
	} 

	async close() {
		await this.destroy()
		process.exit(1)
    }
    
	/**
	 * @param {string} type: user | bot
	 * @param {string} value: YOUR_PHONE_NUMBER | YOUR_BOT_TOKEN
	 */
	connect(type, value) {  
		return new Promise((resolve, reject) => {
            if (type === 'bot') {
                if (!value) reject('Please enter the bot token')
            } else {
                type = 'user'
                if (!value || isNaN(value)) reject('Please enter a valid phone number')
            }

			this.resolver   = resolve
            this.rejector   = reject

            this.loginType  = type
            this.loginValue = value

			this.init()
		})
    } 
    
    async init() {
        if (!this.options.apiId) {
            this.rejector('api_id is required')
        }

        if (!this.options.apiHash) {
            this.rejector('api_hash is required')
        }

        try {
            this.instance = await this.create()
        } catch(e) {
            this.rejector(e)
        }

        this.run()
    }

	async run() {
		while(true) {
			try {
                const response = await this.receive()
				if (response) {
                    this.handler(response)
                } 
			} catch(e) {
				this.rejector(e)
			}
		}
    }
    
    async handler(response) {
        switch(response['@type']) {
            case 'updateAuthorizationState':
                this.handleAuth(response)
            break
            case 'error': 
                this.handleError(response) 
            break
            default: 
                this.handleUpdate(response)
        }	
    }

	async authorizationCode() {
		const code = await input('Authentication Code:', 'Please enter authentication code')
		return this.send({'@type': 'checkAuthenticationCode', code})
	}

	async authorizationPassword() {
		const password = await input('Authentication Password:', 'Please enter authentication password')
		return this.send({'@type': 'checkAuthenticationPassword', password})
    }
        
	async handleAuth(update) {
        const authorizationState = update.authorization_state['@type']
		switch (authorizationState) {
			case 'authorizationStateWaitTdlibParameters':
                const parameters = {
                    api_id: this.options.apiId,
                    api_hash: this.options.apiHash,
                    database_directory: path.resolve(this.options.databaseDirectory),
                    use_message_database: true,
                    use_secret_chats: true,
                    system_language_code: 'en',
                    device_model: 'Desktop', //Samsung X
                    system_version: 'Unknown', //Windows 10, Debian 9
                    application_version: '1.0',
                    enable_storage_optimizer: true
                }
                return this.send({'@type': 'setTdlibParameters', 'parameters': parameters})  
			case 'authorizationStateWaitEncryptionKey':
                return this.send({'@type': 'checkDatabaseEncryptionKey', encryption_key: this.options.encryptionKey})
			case 'authorizationStateWaitPhoneNumber':
                if (this.loginType === 'bot') {
                    return this.send({'@type': 'checkAuthenticationBotToken', 'token': this.loginValue})
                }
                return this.send({'@type': 'setAuthenticationPhoneNumber', 'phone_number': this.loginValue})
			case 'authorizationStateWaitCode':
				return this.authorizationCode()
			case 'authorizationStateWaitPassword':
				return this.authorizationPassword()
			case 'authorizationStateReady':
				return this.resolver()
			case 'authorizationStateLoggingOut':
				return
			case 'authorizationStateClosing':
				return
			case 'authorizationStateClosed':
				return
		}
	} 

	async handleError(update) {
		const id = update['@extra']
		const promise = this.fetching.get(id)
		if (promise) {
			delete update['@extra']
			promise.reject(update)
			this.fetching.delete(id)
			return 
		}

		switch(update['message']) {
			case 'PHONE_CODE_EMPTY':
			case 'PHONE_CODE_INVALID': 
				console.info('Incorect code')
				return this.authorizationCode()
			case 'PASSWORD_HASH_INVALID': 
				console.info('Incorect password')
				return this.authorizationPassword()
			default:
				this.emit('__error', update)
				return this.rejector(update)
		}
	} 

	async handleUpdate(update) {
		const id = update['@extra']
		const promise = this.fetching.get(id)
		if (promise) {
			delete update['@extra']
			promise.resolve(update)
			this.fetching.delete(id)
			return
		}

		this.emit('__' + update['@type'], update)
	} 

	create() {
		return new Promise((resolve, reject) => {
			this.tdlib.td_json_client_create.async((e, client) => {
				if (e) return reject(e)
				resolve(client)
			})
		})
	} 

	send(query) {
		if (!this.instance) return
		return new Promise((resolve, reject) => {
			this.tdlib.td_json_client_send.async(this.instance, Buffer.from(JSON.stringify(query) + '\0'), e => {
				if (e) return reject(e)
				resolve()
			})
		})
	}

	receive(timeout = 10) {
		if (!this.instance) return
		return new Promise((resolve, reject) => {
			this.tdlib.td_json_client_receive.async(this.instance, timeout, (e, result) => {
				if (e) return reject(e)
                if (!result) return resolve(null)
				resolve(JSON.parse(result))
			})
		})
    }

	destroy() {
		if (!this.instance) return 
		return new Promise(resolve => {
			this.tdlib.td_json_client_destroy(this.instance)
			this.instance = null
			resolve()
		})
	}

	async request(method, query = {}) {
		const id = uuid()		
		const response = new Promise((resolve, reject) => {
			this.fetching.set(id, {resolve, reject})
		})
		query['@type'] = method
		query['@extra'] = id
		await this.send(query)
		return response
	}
}

module.exports = TDLib
