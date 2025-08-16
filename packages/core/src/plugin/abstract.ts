import type { MatcherRules } from 'matchinitx'
import type { MaybePromise, OptionalValue } from '../types'
import type { PackageInfo } from './utils'
import { useInitxMatcher } from 'matchinitx'
import { createStore, writeStore } from '../store'
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

  public async run(context: InitxRunContext, ...others: string[]): Promise<HandlerInfo[]> {
    const initxMatcher = useInitxMatcher<HandlerInfo, InitxRuleFields>(
      (rule, ...others) => ({
        handler: () => this.executeHandle(context, rule, ...others),
        ...rule
      })
    )

    const matchedHandlers = (await Promise.all(
      initxMatcher.match(
        this.rules,
        context.key,
        ...others
      )
        .map(
          async (matchedHandler) => {
            // Checks if the verify function returns false
            if (
              matchedHandler.verify
              && !matchedHandler.verify(context, ...others)
            ) {
              return false
            }

            // Checks if the first value is in the optional
            if (
              matchedHandler.optional
              && !inOptional(matchedHandler.optional, others[0])
            ) {
              return false
            }

            return matchedHandler
          }
        )
    ))
      .filter(Boolean) as HandlerInfo[]

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
