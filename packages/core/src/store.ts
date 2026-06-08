import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createDefu } from 'defu'
import pathe from 'pathe'
import { STORE_DIR, STORE_FILE_NAME } from './constants'

let isWritten = false
let storeData: Record<string, any> = {}

const resolveStore = (name: string) => pathe.resolve(STORE_DIR, name, STORE_FILE_NAME)
const mergeStore = createDefu((obj, key, value) => {
  if (Array.isArray(obj[key]) && Array.isArray(value)) {
    obj[key] = value
    return true
  }
})

export function createStore(name: string, defaultStore: Record<string, any> = {}) {
  mkdirSync(pathe.resolve(STORE_DIR, name), { recursive: true })

  const storePath = resolveStore(name)

  const generateResult = (resultData: Record<string, any>) => {
    writeJson(storePath, resultData)
    return useProxy(resultData)
  }

  if (!existsSync(storePath)) {
    return generateResult(cloneValue(defaultStore))
  }

  let json

  try {
    const fileJson = readJson(storePath)
    json = mergeStore(fileJson, defaultStore)
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (e) {
    json = cloneValue(defaultStore)
  }

  return generateResult(json)
}

export function writeStore(name: string) {
  if (!isWritten) {
    return
  }

  writeJson(resolveStore(name), storeData)
}

function writeJson(path: string, data: Record<string, any>) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function readJson(path: string): Record<string, any> {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function useProxy(obj: Record<string, any> = {}) {
  const isObject = (value: any): boolean =>
    typeof value === 'object'
    && value !== null
    && (new Set(['[object Object]', '[object Array]']))
      .has(Object.prototype.toString.call(value))

  const createDeepProxy = (target: Record<string, any> | any[]): Record<string, any> => {
    return new Proxy(target, {
      get(target, key) {
        const value = Reflect.get(target, key)

        if (isObject(value)) {
          return createDeepProxy(value)
        }

        return value
      },
      set(target, key, value) {
        const success = Reflect.set(target, key, value)
        isWritten = true
        return success
      },
      deleteProperty(target, key) {
        const success = Reflect.deleteProperty(target, key)
        isWritten = true
        return success
      }
    })
  }

  storeData = createDeepProxy(obj)

  return storeData
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value))
    return value.map(item => cloneValue(item)) as T

  if (isPlainObject(value)) {
    const result: Record<string, any> = {}
    for (const [key, nested] of Object.entries(value)) {
      result[key] = cloneValue(nested)
    }
    return result as T
  }

  return value
}
