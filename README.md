A tiny wrapper around the OpenAPI spec of the Bunq API.

## Usage

```
const client = new Bunqy({ apiKey: import.meta.env.VITE_BUNQ })
await client.init()
```

http://bunq.example.com/payment/Vakantie/2024/1?key=

## Google Sheets notation TODO

=BUNQ(
"Vakantie", // name of account
2024, // year,
1, // month,
)
