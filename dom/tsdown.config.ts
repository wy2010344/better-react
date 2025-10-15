import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  platform: 'neutral',
  dts: true,
  external: [
    /^wy-helper(\/)?/,
    /^wy-dom-helper(\/)?/,
    'better-react',
    'better-react-helper',
  ],
  format: ['esm', 'cjs'],
})
