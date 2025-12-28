import { TxResult } from './txExecutor'
import { decodeTxError } from './txExecutor'

export interface TxLogData {
  taskId?: string
  walletAddress: string
  action: string
  txHash: string
  status: 'pending' | 'success' | 'fail'
  error?: string
  confirmations?: number
  gasUsed?: bigint
}

export function createTxLogData(
  walletAddress: string,
  action: string,
  result: TxResult,
  taskId?: string
): TxLogData {
  return {
    taskId,
    walletAddress,
    action,
    txHash: result.hash,
    status: result.status,
    error: result.error ? decodeTxError(result.error) : undefined,
    confirmations: result.confirmations,
    gasUsed: result.gasUsed
  }
}

