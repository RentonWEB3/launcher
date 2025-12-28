import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  // Storage API
  readFile: (path) => ipcRenderer.invoke("storage:read", path),
  writeFile: (path, data) => ipcRenderer.invoke("storage:write", path, data),
  getUserDataPath: () => ipcRenderer.invoke("storage:getUserDataPath"),
  // Vault API
  vaultExists: () => ipcRenderer.invoke("vault:exists"),
  createVault: (password) => ipcRenderer.invoke("vault:create", password),
  unlockVault: (password) => ipcRenderer.invoke("vault:unlock", password),
  lockVault: () => ipcRenderer.invoke("vault:lock"),
  isVaultUnlocked: () => ipcRenderer.invoke("vault:isUnlocked"),
  // Wallet API
  addWallet: (privateKey, name) => ipcRenderer.invoke("wallet:add", privateKey, name),
  listWallets: () => ipcRenderer.invoke("wallet:list"),
  deleteWallet: (address) => ipcRenderer.invoke("wallet:delete", address),
  getWalletPrivateKey: (address) => ipcRenderer.invoke("wallet:getPrivateKey", address),
  // MemeTask API
  listMemeTasks: () => ipcRenderer.invoke("memeTask:list"),
  getMemeTask: (id) => ipcRenderer.invoke("memeTask:get", id),
  createMemeTask: (taskData) => ipcRenderer.invoke("memeTask:create", taskData),
  updateMemeTask: (id, updates) => ipcRenderer.invoke("memeTask:update", id, updates),
  deleteMemeTask: (id) => ipcRenderer.invoke("memeTask:delete", id),
  // TxLog API
  listTxLogs: (filters) => ipcRenderer.invoke("txLog:list", filters),
  createTxLog: (logData) => ipcRenderer.invoke("txLog:create", logData),
  updateTxLog: (id, updates) => ipcRenderer.invoke("txLog:update", id, updates),
  deleteTxLog: (id) => ipcRenderer.invoke("txLog:delete", id)
});
