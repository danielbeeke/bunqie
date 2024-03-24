import { Context } from './Context'
import { getKeyPair, getServerKeys } from './keyManagement'
import type { paths } from './schema'
import { Fetcher, Middleware } from 'openapi-typescript-fetch'

const lat = 5.3833993
const lng = 52.1562025

export const client = Fetcher.for<paths>()

export const setContext =
  (context: Context): Middleware =>
  async (url, init, next) => {
    /** @ts-ignore */
    init._context = context
    return next(url, init)
  }

export const responseFormatter: Middleware = async (url, init, next) => {
  if (init.body) {
    /** @ts-ignore */
    const keyPair = await getKeyPair((init._context as Context).apiKey)
    const encoder = new TextEncoder()
    const encoded = encoder.encode(init.body as string)
    const signatureAsArrayBuffer = await window.crypto.subtle.sign('RSASSA-PKCS1-v1_5', keyPair.privateKey, encoded)
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureAsArrayBuffer)))
    init.headers.set('X-Bunq-Client-Signature', signature)
  }

  if (!init.headers.has('X-Bunq-Client-Authentication')) {
    init.headers.set('X-Bunq-Client-Authentication', init._context.token)
  }

  const response = await next(url, init)
  return Object.assign(response, { data: Object.assign({}, ...response.data.Response) })
}

client.configure({
  baseUrl: '/bunq',
  init: {
    headers: {
      'User-Agent': 'Bunqie',
      'X-Bunq-Language': 'nl_NL',
      'X-Bunq-Region': 'nl_NL',
      'X-Bunq-Client-Request-Id': new Date().toISOString(),
      'X-Bunq-Geolocation': `${lng} ${lat} 0 100 NL`,
    },
  },
})
