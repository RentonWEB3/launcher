export type BatchAction = 
  | 'buy'
  | 'sell-percent'
  | 'sell-all'
  | 'transfer-tokens'
  | 'transfer-bnb'

export interface BatchActionParams {
  action: BatchAction
  taskId: string
  walletAddresses: string[]
  amount?: string // BNB amount for buy
  percent?: number // percent for sell
  targetAddress?: string // for transfer
  tokenAddress?: string // for token transfer
}

