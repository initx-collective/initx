import type { BuildConfig } from 'unbuild'

import { defu } from 'defu'

const commonBuildConfig: BuildConfig = {
  rollup: {
    esbuild: {
      minify: true
    },
    inlineDependencies: true,
    json: {
      compact: true,
      namedExports: false,
      preferConst: false
    },
    commonjs: {
      requireReturnsDefault: 'auto'
    },
    dts: {
      respectExternal: false
    }
  },
  clean: true,
  declaration: true
}

export function mergeDefaultBuildConfig(config: BuildConfig): BuildConfig {
  return defu(
    commonBuildConfig,
    config
  )
}
