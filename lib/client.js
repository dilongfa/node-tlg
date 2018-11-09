
class Client {
    constructor(options = {}) {
        const defaults = {
            binaryPath: 'libtdjson',
            databaseDirectory: '_td_db',
            filesDirectory: '_td_files',
            verbosityLevel: 2,
            skipOldUpdates: false,
            useTestDc: false,
            useMutableRename: false,
            tdlibParameters: {
                use_message_database: true,
                use_secret_chats: true,
                system_language_code: 'en',
                application_version: '1.0',
                device_model: 'debian-stretch-amd64',
                system_version: '9.5',
                enable_storage_optimizer: true
            }           
        }       
        this.options = {...defaults, ...options}
        this.tdl = {};
    }
}

module.exports = Client
