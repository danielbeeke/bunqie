import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/bunq': {
        target: 'https://public-api.sandbox.bunq.com/v1/',
        changeOrigin: true,
        cookiePathRewrite: {
          '*': '/',
        },
        rewrite: (path: string) => {
          console.log(path)
          return path.replace('/bunq', '')
        },
      },
    },
  },
})
