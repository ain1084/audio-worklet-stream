import { defineConfig } from 'vite'

export default defineConfig({
  root: './',
  optimizeDeps: {
    exclude: ['@ain1084/audio-worklet-stream'],
  },
  plugins: [
    {
      name: 'configure-response-headers',
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
          next()
        })
      },
    },
  ],
})
