import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

import vitePluginRequire from 'vite-plugin-require'
//@ts-ignore
const dirname = __dirname
// https://vitejs.dev/config/
export default defineConfig({
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: ['**/node_modules/**'], // 忽略 node_modules 目录
    },
  },
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(dirname, 'src') }],
  },
  plugins: [
    (vitePluginRequire as any).default
      ? (vitePluginRequire as any).default()
      : vitePluginRequire(),
    tailwindcss(),
  ],
})
