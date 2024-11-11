import path from 'node:path'

import fs from 'fs-extra'
import { defu } from 'defu'

interface Store {
  rewrited: boolean
  data?: Record<string, any>
}

const STORE_FILE_NAME = 'store.json'

const stores = new Map<string, Store>()

export function createStore(root: string, defaultStore: Record<string, any> = {}) {
  const storePath = path.resolve(root, STORE_FILE_NAME)

  const generateResult = (resultData: Record<string, any>) => {
    writeJson(storePath, resultData)
    return useProxy(root, resultData)
  }

  if (!fs.existsSync(storePath)) {
    return generateResult(defaultStore)
  }

  let json

  try {
    const fileJson = fs.readJsonSync(storePath)
    json = defu(fileJson, defaultStore)
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (e) {
    json = defaultStore
  }

  return generateResult(json)
}

export function writeStore(root: string) {
  const storePath = path.resolve(root, STORE_FILE_NAME)

  if (!stores.has(root)) {
    return
  }

  const store = stores.get(root)!

  if (store.rewrited) {
    fs.writeJsonSync(storePath, store.data || {})
  }
}

function writeJson(path: string, data: Record<string, any>) {
  fs.writeJsonSync(path, data, {
    spaces: 2
  })
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
