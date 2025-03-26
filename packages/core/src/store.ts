import { defu } from 'defu'
import fs from 'fs-extra'
import pathe from 'pathe'
import { STORE_DIR, STORE_FILE_NAME } from './constants'

let isWritten = false
let storeData: Record<string, any> = {}

const resolveStore = (name: string) => pathe.resolve(STORE_DIR, name, STORE_FILE_NAME)

export function createStore(name: string, defaultStore: Record<string, any> = {}) {
  fs.ensureDirSync(pathe.resolve(STORE_DIR, name))

  const storePath = resolveStore(name)

  const generateResult = (resultData: Record<string, any>) => {
    writeJson(storePath, resultData)
    return useProxy(resultData)
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

export function writeStore(name: string) {
  if (!isWritten) {
    return
  }

  writeJson(resolveStore(name), storeData)
}

function writeJson(path: string, data: Record<string, any>) {
  fs.writeJsonSync(path, data, {
    spaces: 2
  })
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
