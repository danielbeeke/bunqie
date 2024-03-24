const apiKey = 'sandbox_b29e8a99fe1b26f95d675f47bb8587e944cadfbd009daf4dbf0e3b5d'

import { Context } from './Context'
import { ensureInstalled } from './actions/installation'
import { createSession } from './actions/session'
import { client } from './client'
import { executor } from './executor'

const context: Context = {
  apiKey,
}

const report = await executor(context, {
  ensureInstalled,
  createSession,
})

const user = client.path('/user').method('get').create()
const { data } = await user({})

console.log(data)
