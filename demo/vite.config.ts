import { defineConfig } from 'vite'
import path from 'path';

import vitePluginRequire from "vite-plugin-require";
// const vitePluginRequire = (xx as any).default as typeof xx
//@ts-ignore
const dirname = __dirname
// https://vitejs.dev/config/
export default defineConfig({
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: ['**/node_modules/**'], // 忽略 node_modules 目录
    }
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(dirname, 'src') },
    ],
  },
  plugins: [
    vitePluginRequire(),
  ]
})
