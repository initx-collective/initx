export interface PluginOptions {
  /**
   * Custom plugin directory path
   * @default `~/.initx/plugins`
   */
  pluginDir?: string

  /**
   * Custom npm registry URL
   * @default 'https://registry.npmjs.org'
   */
  registry?: string

  /**
   * Custom npm executable path
   * @default 'npm'
   */
  npmPath?: string
}

export interface PluginSystem<T = any> {
  search: (keyword: string) => Promise<SearchResult[]>
  install: (packageName: string, version?: string) => Promise<void>
  uninstall: (packageName: string) => Promise<void>
  list: () => Promise<PluginInfo[]>
  update: (packageName: string, version?: string) => Promise<void>
  load: (packageName: string) => Promise<T>
  resolve: (packageName: string, ...paths: string[]) => string
}

export interface SearchResult {
  name: string
  version: string
  description: string
}

export interface PluginInfo {
  name: string
  version: string
  description: string
  isLocal: boolean
}

export interface NpmPackageInfo {
  version: string
  resolved: string
  overridden: boolean
  description: string
}
