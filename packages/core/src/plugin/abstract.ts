import type { MaybePromise } from '../types'

import type { PackageInfo } from './utils'
import { type MatcherRules, useInitxMatcher } from 'matchinitx'
import { createStore, writeStore } from '../store'

type InitxRuleFields<TRule extends object = object> = TRule & {
  /**
   * Description of the handler
   *
   * If multiple handlers are matched, this description will be displayed
   */
  description: string
}

export type InitxMatcherRules<TRule extends object = object> = MatcherRules<InitxRuleFields<TRule>>

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
  TStore extends object = object,
  TRule extends object = object
> extends InitxRunContext {
  /**
   * Store
   *
   * Store data in memory, and write to disk when the program exits
   */
  store: TStore

  /**
   * Rule
   *
   * Matched rule object, you can get custom fields, excluded `matching`
   */
  rule: InitxRuleFields<TRule>
}

export abstract class InitxPlugin<
  TStore extends object = object
> {
  abstract rules: InitxMatcherRules
  abstract handle(context: InitxContext, ...others: string[]): MaybePromise<void>

  public defaultStore?: TStore

  public run(context: InitxRunContext, ...others: string[]): HandlerInfo[] {
    const initxMatcher = useInitxMatcher<HandlerInfo, InitxRuleFields>(
      (rule, ...others) => ({
        handler: () => this.executeHandle(context, rule, ...others),
        description: rule.description
      })
    )

    const matchedHandlers = initxMatcher.match(
      this.rules,
      context.key,
      ...others
    )

    return matchedHandlers
  }

  private async executeHandle<
    TRule extends object
  >(context: InitxRunContext,
    rule: InitxRuleFields<TRule>,
    ...others: string[]
  ) {
    const store = createStore(context.packageInfo.name, this.defaultStore)
    await this.handle({ ...context, rule, store }, ...others)
    writeStore(context.packageInfo.name)
  }
}
