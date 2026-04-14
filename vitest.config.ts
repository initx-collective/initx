import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const r = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@initx-plugin/core': r('./packages/core/src/index.ts'),
      '@initx-plugin/utils': r('./packages/utils/src/index.ts')
    }
  }
})
