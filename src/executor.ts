import { Context } from './Context'
import { Action } from './actions/Action'
import { client, responseFormatter, setContext } from './client'

export const executor = async (context: Context, actions: { [name: string]: Action }) => {
  const report: Array<{ name: string; status: boolean; executed: boolean; caughtError: any }> = []
  let status = true

  client.use(setContext(context))
  client.use(responseFormatter)

  for (const [name, action] of Object.entries(actions)) {
    let caughtError = null

    if (!status) {
      report.push({ name, status, executed: false, caughtError })
    }

    try {
      status = await action(context)
    } catch (error: any) {
      caughtError = error
      status = false
    } finally {
      report.push({ name, status, executed: true, caughtError })
    }
  }

  return report
}
