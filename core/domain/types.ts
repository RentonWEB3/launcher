export interface Wallet {
  address: string
  name?: string
  encryptedPrivateKey: string
  createdAt: number
}

export interface MemeTask {
  id: string
  name: string
  symbol: string
  socialLink?: string
  logo?: string // base64
  tokenAddress?: string
  devWalletAddress: string
  clusterWalletAddresses: string[]
  createdAt: number
  updatedAt: number
}

export interface TxLog {
  id: string
  taskId?: string
  walletAddress: string
  txHash: string
  status: 'pending' | 'success' | 'fail'
  action: string
  error?: string
  timestamp: number
  confirmations?: number
}

export interface VaultData {
  wallets: Wallet[]
  salt?: string // hex encoded salt for key derivation
  createdAt: number
  updatedAt: number
}

