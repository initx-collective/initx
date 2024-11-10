import path from 'node:path'
import fs from 'fs-extra'

interface Store {
  rewrited: boolean
  data?: Record<string, any>
}

const STORE_FILE_NAME = 'store.json'

const stores = new Map<string, Store>()

export function createStore(root: string, defaultStore: Record<string, any> = {}) {
  const storePath = path.resolve(root, STORE_FILE_NAME)

  if (!fs.existsSync(storePath)) {
    fs.writeJsonSync(storePath, defaultStore)
    return useProxy(root, defaultStore)
  }

  const json = fs.readJsonSync(storePath)

  return useProxy(root, json)
}

export function writeStore(root: string) {
  const storePath = path.resolve(root, STORE_FILE_NAME)

  if (!stores.has(root)) {
    return
  }

  const data = stores.get(root)!

  if (data.rewrited) {
    fs.writeJsonSync(storePath, data.data || {})
  }
}

function useProxy(root: string, obj: Record<string, any> = {}) {
  if (!stores.has(root)) {
    stores.set(root, {
      rewrited: false
    })
  }

  const isPlainObject = (value: any): boolean => {
    return Object.prototype.toString.call(value) === '[object Object]'
  }

  const createDeepProxy = (target: Record<string, any>): any => {
    return new Proxy(target, {
      get(target, key) {
        const value = Reflect.get(target, key)
        if (isPlainObject(value)) {
          return createDeepProxy(value)
        }
        return value
      },
      set(target, key, value) {
        stores.get(root)!.rewrited = true
        return Reflect.set(target, key, value)
      }
    })
  }

  const store = createDeepProxy(obj)
  stores.get(root)!.data = store

  return store
}
