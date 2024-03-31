import { createKeyPair, getKeyPair, getServerKeys, publicKeyToPEM, saveServerKeys } from './keyManagement.ts'
import type { paths } from './schema.d.ts'
import type {
  PathsWithMethod,
  HttpMethod,
  ResponseObjectMap,
  SuccessResponse,
  OperationRequestBodyMediaContent,
  JSONLike,
  ResponseContent,
  OkStatus,
  FilterKeys,
} from './types'

export type Context = {
  apiKey?: string
  token?: string
  userID?: number
}

export class Bunqy {
  constructor(public context: Context) {}

  async init(): Promise<void> {
    const serverKeys = await getServerKeys(this.context.apiKey)

    try {
      await this.get('/installation', {
        headers: { 'X-Bunq-Client-Authentication': serverKeys.Token.token },
      })
    } catch (error) {
      let keyPair = await getKeyPair(this.context.apiKey)
      if (!keyPair) keyPair = await createKeyPair(this.context.apiKey)
      const client_public_key = await publicKeyToPEM(keyPair.publicKey)
      const installationData = await this.post('/installation', {}, { client_public_key })
      await saveServerKeys(this.context.apiKey, installationData)
      await this.post(
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

    const sessionData = await this.post(
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
  >(
    method: M,
    path: P,
    init: RequestInit = {},
    body?: B
  ): Promise<JSONLike<ResponseContent<FilterKeys<ResponseObjectMap<paths[P][M]>, OkStatus>>>> {
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

    const variableMatches = [...path.matchAll(/{(.*?)}/g)]

    let replacedPath: string = path

    if (variableMatches.length) {
      for (const [token, name] of variableMatches) {
        if (!this.context[name]) throw new Error(`Used the variable ${name} but it was not set in the context`)
        replacedPath = replacedPath.replaceAll(token, this.context[name])
      }
    }

    const url = `/bunq${replacedPath}`

    const response = await fetch(url, mergedInit)
    type ResponseObject = ResponseObjectMap<paths[P][M]>
    const output = await response.json()

    if (!output.Error) {
      return output.Response as JSONLike<SuccessResponse<ResponseObject>>
    }

    console.error(output)
    throw new Error('Something went wrong')
  }

  async post<
    P extends PathsWithMethod<paths, 'post'>,
    B extends JSONLike<OperationRequestBodyMediaContent<paths[P]['post']>>
  >(
    path: P,
    init: RequestInit = {},
    body?: B
  ): Promise<JSONLike<ResponseContent<FilterKeys<ResponseObjectMap<paths[P]['post']>, OkStatus>>>> {
    return this.request('post', path, init, body) as unknown as Promise<
      JSONLike<ResponseContent<FilterKeys<ResponseObjectMap<paths[P]['post']>, OkStatus>>>
    >
  }

  async get<
    P extends PathsWithMethod<paths, 'get'>,
    B extends JSONLike<OperationRequestBodyMediaContent<paths[P]['get']>>
  >(
    path: P,
    init: RequestInit = {},
    body?: B
  ): Promise<JSONLike<ResponseContent<FilterKeys<ResponseObjectMap<paths[P]['get']>, OkStatus>>>> {
    return this.request('get', path, init, body) as unknown as Promise<
      JSONLike<ResponseContent<FilterKeys<ResponseObjectMap<paths[P]['get']>, OkStatus>>>
    >
  }
}
