import { Context } from './types'
import { createKeyPair, getKeyPair, getServerKeys, publicKeyToPEM, saveServerKeys } from './keyManagement'
import type { paths } from './schema'
import type {
  PathsWithMethod,
  HttpMethod,
  ResponseObjectMap,
  SuccessResponse,
  OperationRequestBodyMediaContent,
  JSONLike,
} from 'openapi-typescript-helpers'

export class Bunqy {
  context: Context

  constructor(context: Context) {
    this.context = context
  }

  async init() {
    const serverKeys = await getServerKeys(this.context.apiKey)

    try {
      await this.request('get', '/installation', {
        headers: { 'X-Bunq-Client-Authentication': serverKeys.Token.token },
      })
    } catch (error) {
      let keyPair = await getKeyPair(this.context.apiKey)
      if (!keyPair) keyPair = await createKeyPair(this.context.apiKey)
      const client_public_key = await publicKeyToPEM(keyPair.publicKey)
      const installationData = await this.request('post', '/installation', {}, { client_public_key })
      await saveServerKeys(this.context.apiKey, installationData)
      await this.request(
        'post',
        '/device-server',
        {
          headers: { 'X-Bunq-Client-Authentication': installationData.Token.token },
        },
        {
          description: 'Bunqie',
          secret: this.context.apiKey,
          permitted_ips: ['*'],
        }
      )
    }

    const sessionData = await this.request(
      'post',
      '/session-server',
      { headers: { 'X-Bunq-Client-Authentication': serverKeys.Token.token } },
      { secret: this.context.apiKey }
    )

    /** @ts-expect-error The typings are off */
    const tokenData = sessionData.find((response) => response.Token)

    if (tokenData.Token.token) {
      this.context.token = tokenData.Token.token
    } else {
      throw new Error('Could not initiate session')
    }
  }

  async request<
    const M extends keyof paths[P] & HttpMethod,
    P extends PathsWithMethod<paths, M>,
    B extends JSONLike<OperationRequestBodyMediaContent<paths[P][M]>>
  >(method: M, path: P, init: RequestInit = {}, body?: B) {
    const lat = 5.3833993
    const lng = 52.1562025

    const mergedInit = Object.assign({
      method: method as string,
      headers: Object.assign(
        {
          'User-Agent': 'Bunqie',
          'X-Bunq-Language': 'nl_NL',
          'X-Bunq-Region': 'nl_NL',
          'X-Bunq-Client-Request-Id': new Date().toISOString(),
          'X-Bunq-Geolocation': `${lng} ${lat} 0 100 NL`,
        },
        init.headers ?? {}
      ),
    })

    if (body) {
      const keyPair = await getKeyPair(this.context.apiKey)
      const encoder = new TextEncoder()
      const encoded = encoder.encode(init.body as string)
      const signatureAsArrayBuffer = await window.crypto.subtle.sign('RSASSA-PKCS1-v1_5', keyPair.privateKey, encoded)
      const signature = btoa(String.fromCharCode(...new Uint8Array(signatureAsArrayBuffer)))
      mergedInit.headers['X-Bunq-Client-Signature'] = signature
      mergedInit.body = JSON.stringify(body)
    }

    if (!mergedInit.headers['X-Bunq-Client-Authentication'] && this.context.token) {
      mergedInit.headers['X-Bunq-Client-Authentication'] = this.context.token
    }

    const url = `/bunq${path}`.replaceAll('{userID}', this.context.userID?.toString() ?? '')

    const response = await fetch(url, mergedInit)
    type ResponseObject = ResponseObjectMap<paths[P][M]>
    const output = await response.json()

    if (response.status === 200) return output.Response as JSONLike<SuccessResponse<ResponseObject>>

    console.error(output)
    throw new Error('Something went wrong')
  }
}
