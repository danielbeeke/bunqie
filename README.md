A tiny wrapper around the OpenAPI spec of the Bunq API.

## Usage

```
const client = new Bunqy({ apiKey: import.meta.env.VITE_BUNQ })
await client.init()
```
