import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { Wallet } from '../domain/types'
import { deriveKey, generateSalt } from './keyDerivation'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

export interface EncryptedData {
  encrypted: string
  salt: string
  iv: string
  tag: string
}

let masterKey: Buffer | null = null
let masterSalt: Buffer | null = null

export async function createVault(password: string): Promise<void> {
  masterSalt = generateSalt()
  masterKey = await deriveKey(password, masterSalt)
}

export async function unlockVault(password: string, salt: Buffer): Promise<boolean> {
  try {
    masterKey = await deriveKey(password, salt)
    masterSalt = salt
    return true
  } catch (error) {
    return false
  }
}

export function lockVault(): void {
  masterKey = null
  masterSalt = null
}

export function isVaultUnlocked(): boolean {
  return masterKey !== null
}

export function encryptPrivateKey(privateKey: string): EncryptedData {
  if (!masterKey) {
    throw new Error('Vault is locked')
  }

  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, masterKey, iv)
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const tag = cipher.getAuthTag()

  return {
    encrypted,
    salt: masterSalt!.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  }
}

export function decryptPrivateKey(encryptedData: EncryptedData): string {
  if (!masterKey) {
    throw new Error('Vault is locked')
  }

  const iv = Buffer.from(encryptedData.iv, 'hex')
  const tag = Buffer.from(encryptedData.tag, 'hex')
  
  const decipher = createDecipheriv(ALGORITHM, masterKey, iv)
  decipher.setAuthTag(tag)
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

