import { Action } from './Action'
import { client } from '../client'
import { createKeyPair, getKeyPair, getServerKeys, publicKeyToPEM, saveServerKeys } from '../keyManagement'
import { Context } from '../Context'

export const ensureInstalled: Action = async (context: Context) => {
  const getInstallations = client.path('/installation').method('get').create()
  const postInstallation = client.path('/installation').method('post').create()
  const postDeviceServer = client.path('/device-server').method('post').create()

  try {
    const serverKeys = await getServerKeys(context.apiKey)
    const { data: installationData } = await getInstallations(undefined as never, {
      headers: { 'X-Bunq-Client-Authentication': serverKeys.Token.token },
    })

    /** @ts-expect-error The typing seems off */
    if (installationData?.Id?.id) return true
  } catch (error) {
    let keyPair = await getKeyPair(context.apiKey)
    if (!keyPair) keyPair = await createKeyPair(context.apiKey)
    const client_public_key = await publicKeyToPEM(keyPair.publicKey)

    const { data: installationData } = await postInstallation({ client_public_key })
    await saveServerKeys(context.apiKey, installationData)

    const { data: deviceData } = await postDeviceServer(
      {
        description: 'Bunqie',
        secret: context.apiKey,
        permitted_ips: ['*'],
      },
      {
        headers: { 'X-Bunq-Client-Authentication': installationData.Token.token },
      }
    )

    /** @ts-expect-error The typing seems off */
    return !!deviceData.Id.id
  }

  return false
}
