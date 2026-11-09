import type { MatcherRules } from 'matchinitx'
import type { MaybePromise, OptionalValue } from '../types'
import type { InitxPluginConfigDeclaration } from './config'
import type { PackageInfo } from './utils'
import { useInitxMatcher } from 'matchinitx'
import { createStore, writeStore } from '../store'
import { loadInitxConfig } from './config'
import { inOptional } from './utils'

type InitxRuleFields<TRule extends object = object> = TRule & {
  /**
   * Description of the handler
   *
   * If multiple handlers are matched, this description will be displayed
   */
  description: string

  /**
   * Optional values
   *
   * Check if the first value is in the optional values.
   *
   * If no matching value is found in the optional value, the handler will not be executed.
   */
  optional?: OptionalValue[]

  /**
   * Verify function
   *
   * If the function returns false, the handler will not be executed.
   */
  verify?: (context: InitxRunContext, ...others: string[]) => MaybePromise<boolean>
}

export type InitxMatcherRules<TRule extends object = object> = MatcherRules<InitxRuleFields<TRule>>

export type HandlerInfo = InitxRuleFields & {
  handler: () => MaybePromise<void>
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

export interface InitxRunContext<TConfig = unknown> extends InitxBaseContext {
  /**
   * Package info
   */
  packageInfo: PackageInfo

  /**
   * Project configuration loaded for the current plugin.
   */
  config?: TConfig

  /**
   * Absolute path of the loaded project configuration.
   */
  configSource?: string
}

export interface InitxContext<
  TStore extends object = object,
  TRule extends object = object,
  TConfig = unknown
> extends InitxRunContext<TConfig> {
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
  TStore extends object = object,
  TConfig = unknown
> {
  abstract rules: InitxMatcherRules
  abstract handle(context: InitxContext<TStore, object, TConfig>, ...others: string[]): MaybePromise<void>

  public defaultStore?: TStore

  public config?: InitxPluginConfigDeclaration<TConfig>

  public async run(context: InitxRunContext, ...others: string[]): Promise<HandlerInfo[]> {
    const initxMatcher = useInitxMatcher<
      { rule: InitxRuleFields, others: string[] },
      InitxRuleFields
    >(
      (rule, ...matchedOthers) => ({ rule, others: matchedOthers })
    )

    const matchedRules = initxMatcher.match(this.rules, context.key, ...others)
    if (!matchedRules.length)
      return []

    const loaded = await loadInitxConfig<TConfig>(
      this.config,
      context.packageInfo.name,
      context.cliOptions
    )
    const runContext: InitxRunContext<TConfig> = { ...context, ...loaded }

    const matchedHandlers = (await Promise.all(matchedRules.map(async ({ rule, others: matchedOthers }) => {
      // Checks if the verify function returns false
      if (
        rule.verify
        && !rule.verify(runContext, ...others)
      ) {
        return false
      }

      // Checks if the first value is in the optional
      if (
        rule.optional
        && !inOptional(rule.optional, others[0])
      ) {
        return false
      }

      return {
        ...rule,
        handler: () => this.executeHandle(runContext, rule, ...matchedOthers)
      }
    }))).filter(Boolean) as HandlerInfo[]

    return matchedHandlers
  }

  private async executeHandle<
    TRule extends object
  >(context: InitxRunContext<TConfig>,
    rule: InitxRuleFields<TRule>,
    ...others: string[]
  ) {
    const store = createStore(context.packageInfo.name, this.defaultStore) as TStore
    await this.handle({ ...context, rule, store }, ...others)
    writeStore(context.packageInfo.name)
  }
}
