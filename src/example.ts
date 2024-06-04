import { Bunqy } from './Bunqie.ts'

const client = new Bunqy({ apiKey: import.meta.env.VITE_BUNQ })
await client.init()

const users = await client.get('/user')

client.context.userID = users[0].UserPerson.id

// const monetaryAccounts = await client.get('/user/{userID}/monetary-account')

// console.table(
//   monetaryAccounts
//     .map((i) => {
//       const thingKey = Object.keys(i)
//       const thing = i[thingKey]
//       return thing
//     })
//     .map((i) => ({
//       status: i.status,
//       description: i.description,
//       id: i.id,
//     }))
// )

client.context['monetary-accountID'] = 7401863

const payments = await client.get('/user/{userID}/monetary-account/{monetary-accountID}/payment')

console.log(payments)

// console.log(monetaryAccount, payments)

// client.context.userID = user[0].UserPerson.id

// const account = await client.get('/user/{userID}/monetary-account')

// console.log(account[0].MonetaryAccountBank)
