import { scrypt, randomBytes } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

const SALT_LENGTH = 32
const KEY_LENGTH = 32
const SCRYPT_PARAMS = {
  N: 16384, // CPU/memory cost
  r: 8,     // block size
  p: 1      // parallelization
}

export async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  const key = await scryptAsync(
    password,
    salt,
    KEY_LENGTH,
    SCRYPT_PARAMS
  ) as Buffer
  return key
}

export function generateSalt(): Buffer {
  return randomBytes(SALT_LENGTH)
}

