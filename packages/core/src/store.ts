import path from 'node:path'
import { homedir } from 'node:os'

import fs from 'fs-extra'
import { defu } from 'defu'

import type { PackageInfo } from './plugin'

const INITX_DIR = path.resolve(homedir(), '.initx')
const STORE_FILE_NAME = 'store.json'
const REWRITED_FILE_NAME = '.rewrited'

const resolveStore = (name: string) => path.resolve(INITX_DIR, name, STORE_FILE_NAME)
const resolveRewrited = (name: string) => path.resolve(INITX_DIR, name, REWRITED_FILE_NAME)

export function createStore({ name }: PackageInfo, defaultStore: Record<string, any> = {}) {
  fs.ensureDirSync(path.resolve(INITX_DIR, name))

  const storePath = resolveStore(name)

  const generateResult = (resultData: Record<string, any>) => {
    writeJson(storePath, resultData)
    return useProxy(name, resultData)
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

export function writeStore({ name }: PackageInfo) {
  const rewritedPath = resolveRewrited(name)

  if (!fs.existsSync(rewritedPath)) {
    return
  }

  const rewrited = fs.readJsonSync(rewritedPath)
  writeJson(resolveStore(name), rewrited)
  fs.removeSync(rewritedPath)
}

function writeJson(path: string, data: Record<string, any>) {
  fs.writeJsonSync(path, data, {
    spaces: 2
  })
}

function useProxy(name: string, obj: Record<string, any> = {}) {
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
        fs.writeJsonSync(resolveRewrited(name), target)
        return success
      }
    })
  }

  return createDeepProxy(obj)
}
