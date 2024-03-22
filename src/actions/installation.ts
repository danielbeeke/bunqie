import { createKeyPair, publicKeyToPEM, saveServerKeys } from '../keyManagement'
import { client } from '../client'
import { isInstalled } from '../keyManagement'
import { getHeaders } from '../getHeaders'

export default async (apiKey: string) => {
  if (await isInstalled(apiKey)) {
    console.log('Already installed')
    return true
  } else {
    console.log('Installing...')
  }

  const keyPair = await createKeyPair(apiKey)
  const pem = await publicKeyToPEM(keyPair.publicKey)
  const { data: rawInstallationData, error: installationError } = await client.POST('/installation', {
    params: {
      /** @ts-expect-error The typing for these headers are wrong in the open-api spec */
      header: {
        'User-Agent': 'Bunqie',
      },
    },
    body: {
      client_public_key: pem,
    },
  })

  if (installationError) {
    console.log(installationError)
    throw new Error('Could not install the key.')
  }

  /** @ts-expect-error The typings do something wrong so we have to massage the data a bit before it matches */
  const installationData: typeof rawInstallationData = Object.assign({}, ...rawInstallationData.Response)

  await saveServerKeys(apiKey, installationData)

  if (!installationData.Token?.token) {
    console.log(installationData)
    throw new Error('The server did not give a token')
  }

  const { data: rawDeviceData, error: deviceError } = await client.POST('/device-server', {
    params: {
      /** @ts-ignore */
      header: getHeaders({
        clientAuthentication: installationData.Token.token,
      }),
    },
    body: {
      description: 'Bunqie',
      secret: apiKey,
      permitted_ips: ['*'],
    },
  })

  if (deviceError) {
    console.log(deviceError)
    throw new Error('Had an error trying to register the device')
  }

  /** @ts-expect-error The typings do something wrong so we have to massage the data a bit before it matches */
  const deviceData: { Id?: string } = Object.assign({}, ...rawDeviceData.Response)

  if (!deviceData?.Id) throw new Error('Could not finish the installation')

  return true
}
