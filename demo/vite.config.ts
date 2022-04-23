import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3252
  },
  plugins: [
    AutoImport({
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.md$/, // .md
      ],
      imports: {
        'better-react-dom': [
          'createElement',
          "Fragment"
        ]
      }
    })
  ]
})
