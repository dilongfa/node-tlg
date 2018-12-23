## node-tlg

NodeJS API for the [TDLib](https://core.telegram.org/tdlib/getting-started). It helps you build your own Telegram Client

---

### Installation

1. Build the binary (https://github.com/tdlib/td#building)
2. `npm install telegram-client`

---

### Usage

```js
const { Client } = require('tlg')

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
```
---
### Examples
See [examples/](examples) folder.

---

### Requirements

- TDLib binary (`libtdjson.so` on Linux, `libtdjson.dylib` on macOS, `tdjson.dll` on Windows)
- NodeJs version >= 10.0.0
---

### Building for Linux Debian 9.5
```sh
apt-get update
apt-get install cmake gperf ccache libssl-dev zlib1g-dev libreadline-dev clang ninja-build

git clone https://github.com/tdlib/td.git
cd td  
mkdir build
cd build

CXX=clang++ CC=clang cmake -GNinja -DCMAKE_BUILD_TYPE=Release ..
ninja

cp libtdjson.so /path/to/your-app-folder
```
