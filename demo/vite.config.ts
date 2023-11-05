import { defineConfig } from 'vite'
import path from 'path';

//@ts-ignore
const dirname = __dirname
// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3252
  },

  plugins: [
  ],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(dirname, 'src') },
    ],
  }
})
