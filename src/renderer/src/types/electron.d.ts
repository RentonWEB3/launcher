export interface ElectronAPI {
  // Storage API
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, data: string) => Promise<void>
  getUserDataPath: () => Promise<string>
  
  // Vault API
  vaultExists: () => Promise<boolean>
  createVault: (password: string) => Promise<void>
  unlockVault: (password: string) => Promise<void>
  lockVault: () => Promise<void>
  isVaultUnlocked: () => Promise<boolean>
  
  // Wallet API
  addWallet: (privateKey: string, name?: string) => Promise<{ address: string; name?: string }>
  listWallets: () => Promise<Array<{ address: string; name?: string; createdAt: number }>>
  deleteWallet: (address: string) => Promise<void>
  getWalletPrivateKey: (address: string) => Promise<string>
  
  // MemeTask API
  listMemeTasks: () => Promise<any[]>
  getMemeTask: (id: string) => Promise<any | null>
  createMemeTask: (taskData: any) => Promise<string>
  updateMemeTask: (id: string, updates: any) => Promise<void>
  deleteMemeTask: (id: string) => Promise<void>
  
  // TxLog API
  listTxLogs: (filters?: { taskId?: string; walletAddress?: string; status?: string }) => Promise<any[]>
  createTxLog: (logData: any) => Promise<string>
  updateTxLog: (id: string, updates: any) => Promise<void>
  deleteTxLog: (id: string) => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

