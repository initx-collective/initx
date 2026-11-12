import type { InitxBaseContext, LoadPluginResult, MatchedPlugin } from '@initx-plugin/core'

export interface CliLogger {
  setLevel: (level: 'debug' | 'info' | 'success' | 'warn' | 'error') => void
  debug: (message: string) => void
  info: (message: string) => void
  success: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
}

export interface CliDeps {
  detectManager: () => Promise<boolean>
  installManager: () => Promise<void>
  loadPlugins: () => Promise<LoadPluginResult[]>
  matchPlugins: (plugins: LoadPluginResult[], context: InitxBaseContext, ...others: string[]) => Promise<MatchedPlugin[]>
  select: (message: string, options: string[]) => Promise<number>
  loadingFunction: <T>(message: string, fn: () => Promise<T>) => Promise<T>
  logger: CliLogger
}

export interface ParsedCliInput {
  key?: string
  others: string[]
  cliOptions: Record<string, any>
}

export type CliParseResult
  = | {
    type: 'help'
  }
  | {
    type: 'version'
  }
  | {
    type: 'run'
    input: ParsedCliInput
  }
