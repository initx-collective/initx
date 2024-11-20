import type { MaybePromise } from '../types'
import type { PackageInfo } from './utils'
import { type Matcher, type MatcherOthers, type Matchers, useInitxMatcher } from '../matcher'

import { createStore, writeStore } from '../store'

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

export interface InitxContext<
  TStore extends PluginStore = object,
  TMatcher extends MatcherOthers = object
> extends InitxRunContext {
  /**
   * Store
   *
   * Store data in memory, and write to disk when the program exits
   */
  store: TStore

  /**
   * Matcher
   *
   * Matched matcher object, you can get custom fields, excluded `matching`
   */
  matcher: Matcher<TMatcher>
}

export abstract class InitxPlugin<
  TStore extends PluginStore = PluginStore
> {
  abstract matchers: Matchers
  abstract handle(context: InitxContext<TStore>, ...others: string[]): MaybePromise<void>

  public defaultStore?: TStore

  public run(context: InitxRunContext, ...others: string[]): HandlerInfo[] {
    const initxMatcher = useInitxMatcher<HandlerInfo>(
      (matcher, ...others) => ({
        handler: () => this.executeHandle(context, matcher, ...others),
        description: matcher.description
      })
    )

    const matchedHandlers = initxMatcher.match(
      this.matchers,
      context.key,
      ...others
    )

    return matchedHandlers
  }

  private async executeHandle<
    TMatcher extends MatcherOthers
  >(context: InitxRunContext,
    matcher: Matcher<TMatcher>,
    ...others: string[]
  ) {
    const store = createStore(context.packageInfo.name, this.defaultStore)
    await this.handle({ ...context, matcher, store }, ...others)
    writeStore(context.packageInfo.name)
  }
}
