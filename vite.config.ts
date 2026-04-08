import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy: Record<string, ProxyOptions> = {}

  if (env.VITE_MMI_URL) {
    proxy['^/__proxy/mmi/.*'] = {
      target: env.VITE_MMI_URL,
      changeOrigin: true,
      secure: false,
      rewrite: (path: string) => path.replace(/^\/__proxy\/mmi/, ''),
    }
  }

  if (env.VITE_ANDJOURNAL_URL) {
    proxy['^/__proxy/andjournal/.*'] = {
      target: env.VITE_ANDJOURNAL_URL,
      changeOrigin: true,
      secure: false,
      rewrite: (path: string) => path.replace(/^\/__proxy\/andjournal/, ''),
    }
  }

  return {
    plugins: [react()],
    server: {
      proxy,
    },
  }
})
