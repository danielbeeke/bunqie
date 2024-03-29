import { Bunqy } from './Bunqie'

const client = new Bunqy({ apiKey: import.meta.env.VITE_BUNQ })
await client.init()

const user = await client.request('get', '/user')
client.context.userID = user[0].UserPerson.id

const account = await client.request('get', '/user/{userID}/monetary-account')

console.log(account[0].MonetaryAccountBank)
