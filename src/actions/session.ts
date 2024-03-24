import { Action } from './Action'
import { client } from '../client'
import { Context } from '../Context'
import { getServerKeys } from '../keyManagement'

export const createSession: Action = async (context: Context) => {
  const sessionServerPost = client.path('/session-server').method('post').create()
  const serverKeys = await getServerKeys(context.apiKey)

  const { data: sessionData } = await sessionServerPost(
    { secret: context.apiKey },
    { headers: { 'X-Bunq-Client-Authentication': serverKeys.Token.token } }
  )

  if (sessionData.Token.token) {
    context.token = sessionData.Token.token
    return true
  }

  return false
}
