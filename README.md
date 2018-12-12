## telegram-client

NodeJS API for the [TDLib][tdlib-getting-started].It helps you build your own Telegram clients.
[tdlib-getting-started]: https://core.telegram.org/tdlib/getting-started

### Table of Contents

- [Getting started](#getting-started)
- [API](#api)
- [Examples](#examples)
- [Requirements](#requirements)

---

<a name="getting-started"></a>
### Getting started

1. Build the binary (https://github.com/tdlib/td#building)
2. `npm install telegram-client`

---

<a name="api"></a>
### API

```js
const Client = require('telegram-client')

const client = new Client({
  apiId: 99999, // Your api_id
  apiHash: '0123456789abcdef0123456789abcdef', // Your api_hash
})
```


```js
await client.connect()
```

```js
await client.login(() => ({
  phoneNumber: 'YOUR_PHONE_NUMBER'
}))
```

Attach an event listener for iterating updates.

```js
client.on('update', console.log)
client.on('error', console.error)
```

Remove an event listener.

```js
const listener = v => {
  console.log('New update.', v)
  client.removeListener('update', listener)
}
client.on('update', listener)
```

Send asynchronous message to Telegram and receive response.  
Resolves with response, or rejects with an error.

```js
const chats = await client.send({
  '@type': 'getChats',
  offset_order: '9223372036854775807',
  offset_chat_id: 0,
  limit: 100
})
```

```js
await client.send({
  '@type': 'sendMessage',
  chat_id: 123456789,
  input_message_content: {
    '@type': 'inputMessageText',
    text: {
      '@type': 'formattedText',
      text: '👻'
    }
  }
})
```

Destroy the client.

```js
client.destroy()
```

Sets the path to the file to where the internal TDLib log will be written. By default TDLib writes logs to stderr or an OS specific log. Use this method to write the log to a file instead.

```js
client.setLogFilePath('log.txt')
```

See [docs](https://core.telegram.org/tdlib/docs/td__log_8h.html#a4b098540dd3957b60a67600cba3ebd7f).

Sets maximum size of the file to where the internal TDLib log is written before the file will be auto-rotated.   Unused if log is not written to a file. Defaults to 10 MB.

```js
client.setLogMaxFileSize(50000)
```

See [docs](https://core.telegram.org/tdlib/docs/td__log_8h.html#adcbe44e62e16d65eb4c7503aabe264b3).


Sets the verbosity level of the internal logging of TDLib.  
Default is 2.

```js
client.setLogVerbosityLevel(2)
```

See [docs](https://core.telegram.org/tdlib/docs/td__log_8h.html#a8cd6fada30eb227c667fc9a10464ae50).

Sets the callback that will be called when a fatal error happens. None of the TDLib methods can be called from the callback. The TDLib will crash as soon as callback returns. By default the callback is not set.

```js
client.setLogFatalErrorCallback(
  errorMessage => console.error('Fatal error:', errorMessage)
)
```

See [docs](https://core.telegram.org/tdlib/docs/td__log_8h.html#addebe91c4525817a6d2b448634c19d71).

<a name="examples"></a>
### Examples

See [examples/](examples) folder.

---

<a name="requirements"></a>
### Requirements

- TDLib binary (`libtdjson.so` on Linux, `libtdjson.dylib` on macOS, `tdjson.dll` on Windows)
- NodeJs version >= 10.0.0

You can also use prebuilt binaries:

- [tdlib.native](https://github.com/ForNeVeR/tdlib.native/releases)

---

### Build for me (Debian 9.5) 
```sh
apt-get update
apt-get install cmake gperf ccache libssl-dev zlib1g-dev libreadline-dev

git clone https://github.com/tdlib/td.git
cd td  
mkdir build
cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
cmake --build .

cp libtdjson.so /path/to/your-app-folder
```
