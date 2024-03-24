import { Context } from '../Context'

export type Action = (context: Context) => Promise<boolean>
