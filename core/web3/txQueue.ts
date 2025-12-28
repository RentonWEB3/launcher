import { sendTx, TxResult, TxOptions } from './txExecutor'
import { createTxLogData } from './txLogger'
import type { ContractTransactionResponse } from 'ethers'

export interface QueuedTx {
  id: string
  walletAddress: string
  action: string
  txPromise: Promise<ContractTransactionResponse>
  taskId?: string
  onComplete?: (result: TxResult) => void
  onError?: (error: Error) => void
}

export class TxQueue {
  private queue: QueuedTx[] = []
  private processing = false
  private currentTx: QueuedTx | null = null
  private logCallback?: (logData: any) => Promise<string>

  constructor(logCallback?: (logData: any) => Promise<string>) {
    this.logCallback = logCallback
  }

  async add(tx: QueuedTx, options?: TxOptions): Promise<TxResult> {
    return new Promise((resolve, reject) => {
      const txWithCallbacks: QueuedTx = {
        ...tx,
        onComplete: (result) => {
          tx.onComplete?.(result)
          resolve(result)
        },
        onError: (error) => {
          tx.onError?.(error)
          reject(error)
        }
      }

      this.queue.push(txWithCallbacks)
      this.processNext(options)
    })
  }

  private async processNext(options?: TxOptions) {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true
    const tx = this.queue.shift()!
    this.currentTx = tx

    try {
      const result = await sendTx(tx.txPromise, options)

      // Логируем транзакцию
      if (this.logCallback) {
        const logData = createTxLogData(
          tx.walletAddress,
          tx.action,
          result,
          tx.taskId
        )
        try {
          await this.logCallback(logData)
        } catch (logError) {
          console.error('Failed to log transaction:', logError)
        }
      }

      tx.onComplete?.(result)
    } catch (error) {
      const errorResult: TxResult = {
        hash: '',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      // Логируем ошибку
      if (this.logCallback) {
        const logData = createTxLogData(
          tx.walletAddress,
          tx.action,
          errorResult,
          tx.taskId
        )
        try {
          await this.logCallback(logData)
        } catch (logError) {
          console.error('Failed to log transaction error:', logError)
        }
      }

      tx.onError?.(error instanceof Error ? error : new Error(String(error)))
    } finally {
      this.currentTx = null
      this.processing = false
      this.processNext(options)
    }
  }

  getQueueLength(): number {
    return this.queue.length
  }

  getCurrentTx(): QueuedTx | null {
    return this.currentTx
  }

  clear() {
    this.queue = []
  }
}

