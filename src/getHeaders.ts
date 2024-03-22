export const getHeaders = ({
  clientAuthentication,
  clientSignature,
}: {
  clientAuthentication?: string
  clientSignature?: string
}) => {
  const lat = 5.3833993
  const lng = 52.1562025

  const headers: any = {
    'User-Agent': 'Bunqie',
    'X-Bunq-Language': 'nl_NL',
    'X-Bunq-Region': 'nl_NL',
    'X-Bunq-Client-Request-Id': new Date().toISOString(),
    'X-Bunq-Geolocation': `${lng} ${lat} 0 100 NL`,
  }

  if (clientAuthentication) headers['X-Bunq-Client-Authentication'] = clientAuthentication
  if (clientSignature) headers['X-Bunq-Client-Signature'] = clientSignature

  return headers
}
