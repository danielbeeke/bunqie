import installation from './actions/installation'
import session from './actions/session.ts'

const apiKey = 'sandbox_7faf14ed150764a497a4add6a06b99040805235b0e420bb83a7bb5b3'
const installed = await installation(apiKey)
if (!installed) throw new Error('Could not install')
const userSession = await session(apiKey)
