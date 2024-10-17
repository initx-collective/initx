type MaybeArray<T> = T | T[]
type MaybePromise<T> = T | Promise<T>

export abstract class InitxHandler {
  abstract matchers: MaybeArray<string | RegExp>
  abstract handle(value: string, ...rest: string[]): MaybePromise<void>

  public async run(value: string, ...rest: string[]): Promise<void> {
    const tests = Array.isArray(this.matchers) ? this.matchers : [this.matchers]

    const passed = tests.some((test) => {
      if (typeof test === 'string') {
        return test === value
      }

      return test.test(value)
    })

    if (!passed) {
      return
    }

    await this.handle(value, ...rest)
  }
}
