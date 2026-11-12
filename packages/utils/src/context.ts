const INITX_CONTEXT_KEY = Symbol.for('initx-context')

type ContextValue = Record<string, any>

function globalContextStore(): Record<symbol, unknown> {
  return globalThis as unknown as Record<symbol, unknown>
}

export function useContext<T extends ContextValue = ContextValue>(): T | undefined {
  return globalContextStore()[INITX_CONTEXT_KEY] as T | undefined
}

export function setContext<T extends ContextValue>(context: T): void {
  globalContextStore()[INITX_CONTEXT_KEY] = context
}

export function clearContext(): void {
  delete globalContextStore()[INITX_CONTEXT_KEY]
}
