import { get, set } from 'idb-keyval'
import type { components } from './schema.d.ts'

export interface ServerPublicKey {
  server_public_key: string
}

export const createKeyPair = async (identifier: string) => {
  const options = {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: { name: 'SHA-256' },
  }
  const keyPair = await window.crypto.subtle.generateKey(options, true, ['sign', 'verify'])

  await set(identifier + ':client:private', keyPair.privateKey)
  await set(identifier + ':client:public', keyPair.publicKey)

  return keyPair
}

export const getKeyPair = async (identifier: string) => {
  const privateKey = await get(identifier + ':client:private')
  const publicKey = await get(identifier + ':client:public')
  return privateKey && publicKey ? ({ privateKey, publicKey } as CryptoKeyPair) : undefined
}

export const publicKeyToPEM = async (publicKey: CryptoKey) => {
  const exportedKey = await window.crypto.subtle.exportKey('spki', publicKey)
  const body = btoa(String.fromCharCode(...new Uint8Array(exportedKey)))
  const cleanedBody = body.match(/.{1,64}/g)?.join('\n')
  return `-----BEGIN PUBLIC KEY-----\n${cleanedBody}\n-----END PUBLIC KEY-----`
}

export const saveServerKeys = async (
  identifier: string,
  serverResponse: components['schemas']['InstallationCreate']
) => {
  await set(identifier + ':server', serverResponse)
}

export const isInstalled = async (identifier: string) => {
  const installedKey = await get(identifier + ':server')
  return !!installedKey
}

export const getServerKeys = async (identifier: string) => {
  const data = await get(identifier + ':server')
  if (data) return data as components['schemas']['InstallationCreate']
}
