import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      // 测试直接跑源码,把包名指向 core 源码,避免依赖 dist 构建产物
      'better-react': path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
})
