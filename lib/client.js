const ffi = require('ffi-napi')
const EventEmitter = require('events')
const path = require('path')
const input = require('./input')
const uuid = require('./uuid')
const Api = require('./api')

class Client extends EventEmitter {
	constructor(options = {}) {
		super()
		
		const defaults = {
			apiId: null,
			apiHash: null,
			libraryFile: process.platform === 'win32' && 'tdjson' || 'libtdjson',
			databaseDirectory: '.tlg/db',
			filesDirectory: '.tlg/files',
			verbosityLevel: 0,
			useTestDc: false,
			encryptionKey: ''
		}

		this.options = {...defaults, ...options}

		this.td = ffi.Library(path.resolve(this.options.libraryFile), {
			'td_json_client_create'          : ['pointer', []],
			'td_json_client_send'            : ['void'   , ['pointer', 'string']],
			'td_json_client_receive'         : ['string' , ['pointer', 'double']],
			'td_json_client_destroy'         : ['void'   , ['pointer']],
			'td_set_log_file_path'           : ['int'    , ['string']],
			'td_set_log_verbosity_level'     : ['void'   , ['int']],
			'td_set_log_max_file_size'       : ['void'   , ['string']],
			'td_set_log_fatal_error_callback': ['void'   , ['pointer']]
		})

		this.setLogVerbosityLevel(this.options.verbosityLevel)

		this.authType = null
		this.authValue = null

		this.client = null
		this.api = null
		this.fetching = new Map()

        this.on('__updateAuthorizationState', onUpdateAuthorizationState)
		
	} 

	async onUpdateAuthorizationState(response) {
		switch (response.authorization_state['@type']) {
			case 'authorizationStateWaitTdlibParameters':
				const parameters = {
					use_test_dc: this.options.useTestDc,
					api_id: this.options.apiId,
					api_hash: this.options.apiHash,
					database_directory: path.resolve(this.options.databaseDirectory),
					files_directory: path.resolve(this.options.filesDirectory),
					use_message_database: true,
					use_secret_chats: true,
					system_language_code: 'en',
					device_model: 'Desktop', //Samsung X
					system_version: 'Unknown', //Windows 10, Debian 9
					application_version: '1.0.0',
					enable_storage_optimizer: true
				}
				return this.send({'@type': 'setTdlibParameters', 'parameters': parameters}) 
			case 'authorizationStateWaitEncryptionKey':
				return this.send({'@type': 'checkDatabaseEncryptionKey', encryption_key: this.options.encryptionKey})
            case 'authorizationStateReady':
                return this.emit('ready')
            case 'authorizationStateClosed':
				return this.emit('closed')
		}
	}

	/**
	 * @param {string} authType user|bot 
	 * @param {string} authUser phoneNumber|botToken
	 */
	connect(authType = 'user', authValue = '') {
		this.authType = authType
		this.authValue = authValue

		// return new Promise((resolve, reject) => {
		// 	this.resolver = resolve
		// 	this.rejector = reject
		// 	this.init()
		// })
	} 

	async init() {
		try {
			this.client = await this.create()
			this.api = new Api(this)
		} catch(e) {
			this.rejector(e)
		}
		
		this.run()
	}

	async run() {
		if (!this.client) return

		while(true) {
			try {
				const response = await this.receive()
				if (response) {
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
			} catch(e) {
				this.emit('error', e)			
				this.rejector(e)
			}
		}
	}

	async handleAuth(response) { 
		switch (response['authorization_state']['@type']) {
			case 'authorizationStateWaitTdlibParameters':
				const parameters = {
					use_test_dc: this.options.useTestDc,
					api_id: this.options.apiId,
					api_hash: this.options.apiHash,
					database_directory: path.resolve(this.options.databaseDirectory),
					files_directory: path.resolve(this.options.filesDirectory),
					use_message_database: true,
					use_secret_chats: true,
					system_language_code: 'en',
					device_model: 'Desktop', //Samsung X
					system_version: 'Unknown', //Windows 10, Debian 9
					application_version: '1.0.0',
					enable_storage_optimizer: true
				}
			return this.send({'@type': 'setTdlibParameters', 'parameters': parameters}) 
			case 'authorizationStateWaitEncryptionKey':
				return this.send({'@type': 'checkDatabaseEncryptionKey', encryption_key: this.options.encryptionKey})
				
			case 'authorizationStateWaitPhoneNumber':
				if(this.authType === 'user') {
					return this.send({'@type': 'setAuthenticationPhoneNumber', 'phone_number': this.authValue})
				} else {
					return this.send({'@type': 'checkAuthenticationBotToken', 'token': this.authValue})
				}
			case 'authorizationStateWaitCode':
				if (this.authType !== 'user') return
				const code = await input('Code:', 'Please enter code')
				return this.send({'@type': 'checkAuthenticationCode', code})
			case 'authorizationStateWaitPassword':
				if (this.authType !== 'user') return
				const passwordHint = response['authorization_state']['password_hint']
				const password = await input('Password:', `Please enter password ${passwordHint}`)
				return this.send({'@type': 'checkAuthenticationPassword', password})

			case 'authorizationStateClosed':
				this.destroy()
				return
			case 'authorizationStateReady':
				this.resolver()
				return
		}
	}

	async handleError(response) {
		const id = response['@extra']
		const promise = this.fetching.get(id)
		if (promise) {
			delete response['@extra']
			promise.reject(response)
			this.fetching.delete(id)
			return 
		}

		switch(response['message']) {
			case 'PHONE_CODE_EMPTY':
			case 'PHONE_CODE_INVALID': 
				if (this.authType !== 'user') return
				const code = await input('Code:', 'Please enter code')
				return this.send({'@type': 'checkAuthenticationCode', code})
			case 'PASSWORD_HASH_INVALID': 
				if (this.authType !== 'user') return
				const password = await input('Password:', `Please enter password`)
				return this.send({'@type': 'checkAuthenticationPassword', password})
			default:
				return this.rejector(response)
		}
	} 


	async handleUpdate(response) {
		const id = response['@extra']
		const promise = this.fetching.get(id)
		if (promise) {
			delete response['@extra']
			promise.resolve(response)
			this.fetching.delete(id)
			return
		}

		this.emit('update', response)
	} 

	async request(query) {
		const id = uuid()
		query['@extra'] = id
		const response = new Promise((resolve, reject) => {
			try {
				this.fetching.set(id, {resolve, reject})
			} catch(e) {
				this.emit('error', e)
				this.rejector(e)
			}
		})
		await this.send(query)
		return response
	}

	create() {
		return new Promise((resolve, reject) => {
			this.td.td_json_client_create.async((err, client) => {
				if (err) return reject(err)
				resolve(client)
			})
		})
	} 

	send(query) {
		return new Promise((resolve, reject) => {
			this.td.td_json_client_send.async(this.client, Buffer.from(JSON.stringify(query) + '\0'), err => {
				if (err) return reject(err)
				resolve()
			})
		})
	}
		
	receive(timeout = 10) {
		return new Promise((resolve, reject) => {
			this.td.td_json_client_receive.async(this.client, timeout, (err, res) => {
				if (err) return reject(err)
				if (!res) return resolve(null)
				resolve(JSON.parse(res))
			})
		})
	}

	destroy() {
		if (!this.client) return
		this.td.td_json_client_destroy(this.client)
		this.client = null
	}

	setLogFilePath(logFile) {
		this.td.td_set_log_file_path(path.resolve(logFile))
	}
	
	setLogMaxFileSize(maxFileSize) {
		this.td.td_set_log_max_file_size(maxFileSize)
	}

	setLogVerbosityLevel(verbosity) {
		this.td.td_set_log_verbosity_level(verbosity)
	}

	setLogFatalErrorCallback(fn) {
		this.td.td_set_log_fatal_error_callback(ffi.Callback('void', ['string'], fn))
	}

}

module.exports = Client
