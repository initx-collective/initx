import path from 'node:path'

import fs from 'fs-extra'
import { defu } from 'defu'

const INITX_DIR = '.initx'
const STORE_FILE_NAME = 'store.json'
const REWRITED_FILE_NAME = '.rewrited'

const resolveStore = (root: string) => path.resolve(root, INITX_DIR, STORE_FILE_NAME)
const resolveRewrited = (root: string) => path.resolve(root, INITX_DIR, REWRITED_FILE_NAME)

export function createStore(root: string, defaultStore: Record<string, any> = {}) {
  fs.ensureDirSync(path.resolve(root, INITX_DIR))

  const storePath = resolveStore(root)

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
  const rewritedPath = resolveRewrited(root)

  if (!fs.existsSync(rewritedPath)) {
    return
  }

  const rewrited = fs.readJsonSync(rewritedPath)
  writeJson(resolveStore(root), rewrited)
  fs.removeSync(rewritedPath)
}

function writeJson(path: string, data: Record<string, any>) {
  fs.writeJsonSync(path, data, {
    spaces: 2
  })
}

function useProxy(root: string, obj: Record<string, any> = {}) {
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
        const success = Reflect.set(target, key, value)
        fs.writeJsonSync(resolveRewrited(root), target)
        return success
      }
    })
  }

  return createDeepProxy(obj)
}
