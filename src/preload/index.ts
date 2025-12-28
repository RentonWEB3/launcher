import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Storage API
  readFile: (path: string) => ipcRenderer.invoke('storage:read', path),
  writeFile: (path: string, data: string) => ipcRenderer.invoke('storage:write', path, data),
  getUserDataPath: () => ipcRenderer.invoke('storage:getUserDataPath'),
  
  // Vault API
  vaultExists: () => ipcRenderer.invoke('vault:exists'),
  createVault: (password: string) => ipcRenderer.invoke('vault:create', password),
  unlockVault: (password: string) => ipcRenderer.invoke('vault:unlock', password),
  lockVault: () => ipcRenderer.invoke('vault:lock'),
  isVaultUnlocked: () => ipcRenderer.invoke('vault:isUnlocked'),
  
  // Wallet API
  addWallet: (privateKey: string, name?: string) => ipcRenderer.invoke('wallet:add', privateKey, name),
  listWallets: () => ipcRenderer.invoke('wallet:list'),
  deleteWallet: (address: string) => ipcRenderer.invoke('wallet:delete', address),
  getWalletPrivateKey: (address: string) => ipcRenderer.invoke('wallet:getPrivateKey', address),
  
  // MemeTask API
  listMemeTasks: () => ipcRenderer.invoke('memeTask:list'),
  getMemeTask: (id: string) => ipcRenderer.invoke('memeTask:get', id),
  createMemeTask: (taskData: any) => ipcRenderer.invoke('memeTask:create', taskData),
  updateMemeTask: (id: string, updates: any) => ipcRenderer.invoke('memeTask:update', id, updates),
  deleteMemeTask: (id: string) => ipcRenderer.invoke('memeTask:delete', id),
  
  // TxLog API
  listTxLogs: (filters?: { taskId?: string; walletAddress?: string; status?: string }) => 
    ipcRenderer.invoke('txLog:list', filters),
  createTxLog: (logData: any) => ipcRenderer.invoke('txLog:create', logData),
  updateTxLog: (id: string, updates: any) => ipcRenderer.invoke('txLog:update', id, updates),
  deleteTxLog: (id: string) => ipcRenderer.invoke('txLog:delete', id),
})

