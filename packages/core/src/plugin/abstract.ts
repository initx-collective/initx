import { createStore, writeStore } from '../store'

import type { PackageInfo } from './utils'

type MaybeArray<T> = T | T[]
type MaybePromise<T> = T | Promise<T>

interface BaseMatchers {
  matching: MaybeArray<string | RegExp>

  /**
   * Description of the handler
   *
   * If multiple handlers are matched, this description will be displayed
   */
  description: string
}
type TypeMatchers = Record<string, BaseMatchers>

type Matchers = MaybeArray<BaseMatchers> | TypeMatchers

type PluginStore = Record<string, any>

export interface HandlerInfo {
  handler: () => MaybePromise<void>
  description: string
}

export interface InitxBaseContext {
  /**
   * Matching string
   *
   * The key that was used to match the handler
   */
  key: string

  /**
   * CLI options
   *
   * cac package parsed options
   */
  cliOptions: Record<string, any>

  /**
   * Options list
   *
   * cli options list, like
   * @example ['--global']
   */
  optionsList: string[]
}

export interface InitxRunContext extends InitxBaseContext {
  /**
   * Package info
   */
  packageInfo: PackageInfo
}

export interface InitxContext<TStore extends PluginStore = PluginStore> extends InitxRunContext {
  /**
   * Store
   *
   * Store data in memory, and write to disk when the program exits
   */
  store: TStore
}

export abstract class InitxPlugin<TStore extends PluginStore = PluginStore> {
  abstract matchers: Matchers
  abstract handle(options: InitxContext<TStore>, ...others: string[]): MaybePromise<void>

  public defaultStore?: TStore

  public run(context: InitxRunContext, ...others: string[]): HandlerInfo[] {
    // BaseMatchers
    if (this.isBaseMatchers(this.matchers)) {
      return this.matchBaseMatchers(this.matchers, context, ...others)
    }

    // Array<BaseMatchers>
    if (this.isArrayBaseMatchers(this.matchers)) {
      return this.matchArrayBaseMatchers(this.matchers, context, ...others)
    }

    // TypeMatchers
    if (this.isObject(this.matchers)) {
      return this.matchTypeMatchers(this.matchers, context, ...others)
    }

    return []
  }

  // BaseMatchers
  private matchBaseMatchers(matchers: BaseMatchers, context: InitxRunContext, ...others: string[]): HandlerInfo[] {
    if (!this.isPassed(matchers.matching, context.key)) {
      return []
    }

    return [
      {
        handler: () => this.executeHandle(context, ...others),
        description: matchers.description
      }
    ]
  }

  private matchArrayBaseMatchers(matchers: BaseMatchers[], context: InitxRunContext, ...others: string[]): HandlerInfo[] {
    const handlers: HandlerInfo[] = []

    for (let i = 0; i < matchers.length; i++) {
      const matcher = matchers[i]
      const isPassed = this.isPassed(matcher.matching, context.key)

      if (isPassed) {
        handlers.push({
          handler: () => this.executeHandle(context, ...others),
          description: matcher.description
        })
      }
    }

    return handlers
  }

  private matchTypeMatchers(matchers: TypeMatchers, context: InitxRunContext, ...others: string[]): HandlerInfo[] {
    const handlers: HandlerInfo[] = []
    const keys = Object.keys(matchers)

    for (let i = 0; i < keys.length; i++) {
      const matcher = matchers[keys[i]]
      const isPassed = this.isPassed(matcher.matching, context.key)

      if (isPassed) {
        handlers.push({
          handler: () => this.executeHandle(context, keys[i], ...others),
          description: matcher.description
        })
      }
    }

    return handlers
  }

  private isBaseMatchers(matchers: Matchers): matchers is BaseMatchers {
    const keys = Object.keys(matchers)

    return (
      this.isObject(matchers)
      && keys.length === 2
      && keys.every(key => key === 'matching' || key === 'description')
    )
  }

  private isArrayBaseMatchers(matchers: Matchers): matchers is BaseMatchers[] {
    return Array.isArray(matchers) && matchers.every(this.isBaseMatchers.bind(this))
  }

  private isObject(value: any): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !(Array.isArray(value))
  }

  private isPassed(matchers: BaseMatchers['matching'], key: string): boolean {
    const tests = Array.isArray(matchers) ? matchers : [matchers]

    return tests.some((test) => {
      if (typeof test === 'string') {
        return test === key
      }

      return test.test(key)
    })
  }

  private async executeHandle(context: InitxRunContext, ...others: string[]) {
    const store = createStore(context.packageInfo, this.defaultStore)
    await this.handle({ ...context, store }, ...others)
    writeStore(context.packageInfo.name)
  }
}
