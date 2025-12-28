import type { ContractTransactionResponse, TransactionReceipt } from 'ethers'

export interface TxResult {
  hash: string
  receipt?: TransactionReceipt
  status: 'pending' | 'success' | 'fail'
  error?: string
  confirmations?: number
  gasUsed?: bigint
}

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

  async add(tx: QueuedTx): Promise<TxResult> {
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
      this.processNext()
    })
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true
    const tx = this.queue.shift()!
    this.currentTx = tx

    try {
      const txResponse = await tx.txPromise
      const result: TxResult = {
        hash: txResponse.hash,
        status: 'pending'
      }

      // Ждем подтверждения
      try {
        const receipt = await txResponse.wait(1) // 1 подтверждение для BNB Chain
        result.receipt = receipt
        result.status = receipt.status === 1 ? 'success' : 'fail'
        result.confirmations = receipt.confirmations
        result.gasUsed = receipt.gasUsed
      } catch (waitError: any) {
        result.status = 'pending'
        result.error = waitError.message || 'Transaction pending confirmation'
      }

      // Логируем транзакцию
      if (this.logCallback) {
        const logData = {
          taskId: tx.taskId,
          walletAddress: tx.walletAddress,
          action: tx.action,
          txHash: result.hash,
          status: result.status,
          error: result.error,
          confirmations: result.confirmations,
          gasUsed: result.gasUsed
        }
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
        const logData = {
          taskId: tx.taskId,
          walletAddress: tx.walletAddress,
          action: tx.action,
          txHash: '',
          status: 'fail',
          error: errorResult.error
        }
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
      this.processNext()
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

