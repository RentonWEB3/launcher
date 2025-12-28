import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { StorageSchema, DEFAULT_STORAGE } from './schema'

const STORAGE_FILE = 'storage.json'

export function getStoragePath(): string {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, STORAGE_FILE)
}

export function readStorage(): StorageSchema {
  const path = getStoragePath()
  if (!existsSync(path)) {
    return DEFAULT_STORAGE
  }
  try {
    const data = readFileSync(path, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading storage:', error)
    return DEFAULT_STORAGE
  }
}

export function writeStorage(data: StorageSchema): void {
  const path = getStoragePath()
  const userDataPath = app.getPath('userData')
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true })
  }
  try {
    writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error writing storage:', error)
    throw error
  }
}

