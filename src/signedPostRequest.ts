import { getServerKeys } from './keyManagement'
import { client } from './client'
import { getHeaders } from './getHeaders'
import { getKeyPair } from './keyManagement'
import { ClientMethod } from 'openapi-fetch'
import type { paths } from './schema'

type PostParameters = Parameters<typeof client.POST>

export const signedPostRequest = async function <T extends PostParameters>(url: T[0], clientArguments?: T[1]) {
  // const serverKeys = await getServerKeys(identifier)
  // if (!serverKeys?.Token?.token) throw new Error('Could not get the token')

  // const keyPair = await getKeyPair(identifier)

  // const encoder = new TextEncoder()
  // const encoded = encoder.encode(body)

  // if (!keyPair) throw new Error('The key pair returned empty from storage')

  // console.log(keyPair.privateKey)

  // const signatureAsArrayBuffer = await window.crypto.subtle.sign('RSASSA-PKCS1-v1_5', keyPair.privateKey, encoded)
  // const signature = btoa(String.fromCharCode(...new Uint8Array(signatureAsArrayBuffer)))
  // console.log(signature)

  // const clientArguments = Object.assign({
  //   params: {
  //     headers: getHeaders({
  //       clientAuthentication: serverKeys.Token.token,
  //       clientSignature: signature,
  //     }),
  //   },
  //   body,
  // }) as PostParameters[1]

  return client.POST(url, clientArguments)
}

signedPostRequest('/session-server', {
  params: {
    headers: {
      'User-Agent': 'Bunqie',
      'X-Bunq-Language': 'nl_NL',
      'X-Bunq-Region': 'nl_NL',
      'X-Bunq-Client-Request-Id': new Date().toISOString(),
      'X-Bunq-Geolocation': `0 0 0 100 NL`,
    },
  },
  body: {},
})
