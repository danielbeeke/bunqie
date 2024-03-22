import { signedPostRequest } from '../signedPostRequest.ts'

export default async (apiKey: string) => {
  const { data: sessionData, error: sessionError } = await signedPostRequest(
    '/session-server',
    {
      secret: apiKey,
    },
    apiKey
  )

  console.log(sessionData, sessionError)
}
