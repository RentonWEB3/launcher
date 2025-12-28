import { VaultData, MemeTask, TxLog } from '../domain/types'

export interface StorageSchema {
  vault: VaultData | null
  memeTasks: MemeTask[]
  txLogs: TxLog[]
}

export const DEFAULT_STORAGE: StorageSchema = {
  vault: null,
  memeTasks: [],
  txLogs: []
}

