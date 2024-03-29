/// <reference types="vite/client" />
import { Bunqy } from './Bunqie'

const client = new Bunqy({ apiKey: import.meta.env.VITE_BUNQ })
await client.init()
