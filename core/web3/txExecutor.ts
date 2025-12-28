import { ContractTransactionResponse, TransactionReceipt } from 'ethers'
import { getProvider } from './provider'
import config from '../config/default.json'

export interface TxResult {
  hash: string
  receipt?: TransactionReceipt
  status: 'pending' | 'success' | 'fail'
  error?: string
  confirmations?: number
  gasUsed?: bigint
}

export interface TxOptions {
  confirmations?: number
  timeout?: number
  retryAttempts?: number
}

const DEFAULT_OPTIONS: Required<TxOptions> = {
  confirmations: config.tx.confirmations,
  timeout: config.tx.timeout,
  retryAttempts: config.tx.retryAttempts
}

async function waitWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Transaction timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ])
}

async function waitForConfirmations(
  hash: string,
  confirmations: number,
  timeout: number
): Promise<TransactionReceipt> {
  const provider = getProvider()
  
  try {
    const receipt = await waitWithTimeout(
      provider.waitForTransaction(hash, confirmations),
      timeout,
      `Transaction ${hash} timeout after ${timeout}ms`
    )
    return receipt
  } catch (error: any) {
    // Если timeout, проверяем статус транзакции
    if (error.message.includes('timeout')) {
      const receipt = await provider.getTransactionReceipt(hash)
      if (receipt) {
        return receipt
      }
    }
    throw error
  }
}

export async function sendTx(
  txPromise: Promise<ContractTransactionResponse>,
  options: TxOptions = {}
): Promise<TxResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | null = null

  // Retry логика для отправки транзакции
  for (let attempt = 0; attempt <= opts.retryAttempts; attempt++) {
    try {
      const tx = await txPromise
      const result: TxResult = {
        hash: tx.hash,
        status: 'pending'
      }

      // Ждем подтверждения с timeout
      try {
        const receipt = await waitForConfirmations(
          tx.hash,
          opts.confirmations,
          opts.timeout
        )
        
        result.receipt = receipt
        result.status = receipt.status === 1 ? 'success' : 'fail'
        result.confirmations = receipt.confirmations
        result.gasUsed = receipt.gasUsed

        return result
      } catch (waitError: any) {
        // Если транзакция была отправлена, но не подтверждена
        result.status = 'pending'
        result.error = waitError.message || 'Transaction pending confirmation'
        return result
      }
    } catch (error: any) {
      lastError = error
      
      // Если это ошибка nonce или gas, не ретраим
      if (error.code === 'NONCE_EXPIRED' || error.code === 'INSUFFICIENT_FUNDS') {
        return {
          hash: error?.transaction?.hash || '',
          status: 'fail',
          error: error.message || 'Transaction failed'
        }
      }

      // Если это последняя попытка, возвращаем ошибку
      if (attempt === opts.retryAttempts) {
        return {
          hash: error?.transaction?.hash || error?.hash || '',
          status: 'fail',
          error: error.message || 'Transaction failed after retries'
        }
      }

      // Ждем перед следующей попыткой (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }

  return {
    hash: '',
    status: 'fail',
    error: lastError?.message || 'Unknown error'
  }
}

// Утилита для декодирования ошибок транзакций
export function decodeTxError(error: any): string {
  if (typeof error === 'string') {
    return error
  }

  if (error?.reason) {
    return error.reason
  }

  if (error?.message) {
    // Убираем приватные ключи из сообщений об ошибках (на всякий случай)
    let message = error.message
    message = message.replace(/0x[a-fA-F0-9]{64}/g, '[PRIVATE_KEY_HIDDEN]')
    return message
  }

  if (error?.code) {
    const errorCodes: Record<string, string> = {
      'NONCE_EXPIRED': 'Nonce expired',
      'INSUFFICIENT_FUNDS': 'Insufficient funds',
      'NETWORK_ERROR': 'Network error',
      'TIMEOUT': 'Transaction timeout'
    }
    return errorCodes[error.code] || `Error code: ${error.code}`
  }

  return 'Unknown error'
}

