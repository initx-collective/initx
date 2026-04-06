export interface SelectBaseOption<T extends string | number = string | number> {
  name: string
  value: T
}

export type SelectOptions<T extends string | number = string | number>
  = readonly string[] | readonly SelectBaseOption<T>[]

export type SelectReturn<T extends SelectOptions>
  = T extends readonly string[]
    ? number
    : T extends readonly SelectBaseOption<infer V>[]
      ? V
      : never
