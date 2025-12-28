import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { readStorage, writeStorage, getStoragePath } from '../../core/storage/storage'
import { 
  createVault, 
  unlockVault, 
  lockVault, 
  isVaultUnlocked,
  encryptPrivateKey,
  decryptPrivateKey
} from '../../core/vault/vault'
import { Wallet, MemeTask, TxLog } from '../../core/domain/types'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// IPC Handlers
function setupIpcHandlers() {
  // Storage handlers
  ipcMain.handle('storage:getUserDataPath', () => {
    return app.getPath('userData')
  })

  ipcMain.handle('storage:read', async (_, path: string) => {
    try {
      const fs = await import('fs')
      const data = fs.readFileSync(path, 'utf-8')
      return data
    } catch (error: any) {
      throw new Error(`Failed to read file: ${error.message}`)
    }
  })

  ipcMain.handle('storage:write', async (_, path: string, data: string) => {
    try {
      const fs = await import('fs')
      const pathModule = await import('path')
      const dir = pathModule.dirname(path)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(path, data, 'utf-8')
    } catch (error: any) {
      throw new Error(`Failed to write file: ${error.message}`)
    }
  })

  // Vault handlers
  ipcMain.handle('vault:exists', () => {
    const storage = readStorage()
    return storage.vault !== null
  })

  ipcMain.handle('vault:create', async (_, password: string) => {
    const salt = (await import('../../core/vault/keyDerivation')).generateSalt()
    await createVault(password)
    const storage = readStorage()
    storage.vault = {
      wallets: [],
      salt: salt.toString('hex'),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    writeStorage(storage)
  })

  ipcMain.handle('vault:unlock', async (_, password: string) => {
    const storage = readStorage()
    if (!storage.vault) {
      throw new Error('Vault does not exist')
    }
    
    // Используем salt из vault или из первого кошелька (для обратной совместимости)
    let salt: Buffer
    if (storage.vault.salt) {
      salt = Buffer.from(storage.vault.salt, 'hex')
    } else if (storage.vault.wallets.length > 0) {
      const firstWallet = storage.vault.wallets[0]
      const encryptedData = JSON.parse(firstWallet.encryptedPrivateKey)
      salt = Buffer.from(encryptedData.salt, 'hex')
      // Сохраняем salt в vault для будущего использования
      storage.vault.salt = encryptedData.salt
      writeStorage(storage)
    } else {
      throw new Error('Vault salt not found')
    }
    
    const unlocked = await unlockVault(password, salt)
    if (!unlocked) {
      throw new Error('Invalid password')
    }
  })

  ipcMain.handle('vault:lock', () => {
    lockVault()
  })

  ipcMain.handle('vault:isUnlocked', () => {
    return isVaultUnlocked()
  })

  // Wallet handlers
  ipcMain.handle('wallet:add', async (_, privateKey: string, name?: string) => {
    if (!isVaultUnlocked()) {
      throw new Error('Vault is locked')
    }

    const { Wallet: EthersWallet } = await import('ethers')
    const ethersWallet = new EthersWallet(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`)
    const address = ethersWallet.address
    const encrypted = encryptPrivateKey(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`)

    const wallet: Wallet = {
      address,
      name: name || `Wallet ${address.slice(0, 8)}`,
      encryptedPrivateKey: JSON.stringify(encrypted),
      createdAt: Date.now()
    }

    const storage = readStorage()
    if (!storage.vault) {
      throw new Error('Vault does not exist')
    }

    // Проверка на дубликат
    if (storage.vault.wallets.some(w => w.address.toLowerCase() === address.toLowerCase())) {
      throw new Error('Wallet already exists')
    }

    storage.vault.wallets.push(wallet)
    storage.vault.updatedAt = Date.now()
    writeStorage(storage)

    return { address, name: wallet.name }
  })

  ipcMain.handle('wallet:list', () => {
    const storage = readStorage()
    if (!storage.vault) {
      return []
    }
    return storage.vault.wallets.map(w => ({
      address: w.address,
      name: w.name,
      createdAt: w.createdAt
    }))
  })

  ipcMain.handle('wallet:delete', (_, address: string) => {
    const storage = readStorage()
    if (!storage.vault) {
      throw new Error('Vault does not exist')
    }
    storage.vault.wallets = storage.vault.wallets.filter(
      w => w.address.toLowerCase() !== address.toLowerCase()
    )
    storage.vault.updatedAt = Date.now()
    writeStorage(storage)
  })

  ipcMain.handle('wallet:getPrivateKey', (_, address: string) => {
    if (!isVaultUnlocked()) {
      throw new Error('Vault is locked')
    }
    const storage = readStorage()
    if (!storage.vault) {
      throw new Error('Vault does not exist')
    }
    const wallet = storage.vault.wallets.find(
      w => w.address.toLowerCase() === address.toLowerCase()
    )
    if (!wallet) {
      throw new Error('Wallet not found')
    }
    const encryptedData = JSON.parse(wallet.encryptedPrivateKey)
    return decryptPrivateKey(encryptedData)
  })

  // MemeTask handlers
  ipcMain.handle('memeTask:list', () => {
    const storage = readStorage()
    return storage.memeTasks
  })

  ipcMain.handle('memeTask:get', (_, id: string) => {
    const storage = readStorage()
    return storage.memeTasks.find(t => t.id === id) || null
  })

  ipcMain.handle('memeTask:create', (_, taskData: Omit<MemeTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    const storage = readStorage()
    const task: MemeTask = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    storage.memeTasks.push(task)
    writeStorage(storage)
    return task.id
  })

  ipcMain.handle('memeTask:update', (_, id: string, updates: Partial<MemeTask>) => {
    const storage = readStorage()
    const index = storage.memeTasks.findIndex(t => t.id === id)
    if (index === -1) {
      throw new Error('Task not found')
    }
    storage.memeTasks[index] = {
      ...storage.memeTasks[index],
      ...updates,
      updatedAt: Date.now()
    }
    writeStorage(storage)
  })

  ipcMain.handle('memeTask:delete', (_, id: string) => {
    const storage = readStorage()
    storage.memeTasks = storage.memeTasks.filter(t => t.id !== id)
    writeStorage(storage)
  })

  // TxLog handlers
  ipcMain.handle('txLog:list', (_, filters?: { taskId?: string; walletAddress?: string; status?: string }) => {
    const storage = readStorage()
    let logs = storage.txLogs

    if (filters) {
      if (filters.taskId) {
        logs = logs.filter(log => log.taskId === filters.taskId)
      }
      if (filters.walletAddress) {
        logs = logs.filter(log => log.walletAddress.toLowerCase() === filters.walletAddress!.toLowerCase())
      }
      if (filters.status) {
        logs = logs.filter(log => log.status === filters.status)
      }
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp)
  })

  ipcMain.handle('txLog:create', (_, logData: Omit<TxLog, 'id' | 'timestamp'>) => {
    const storage = readStorage()
    const log: TxLog = {
      ...logData,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }
    storage.txLogs.push(log)
    writeStorage(storage)
    return log.id
  })

  ipcMain.handle('txLog:update', (_, id: string, updates: Partial<TxLog>) => {
    const storage = readStorage()
    const index = storage.txLogs.findIndex(l => l.id === id)
    if (index === -1) {
      throw new Error('Log not found')
    }
    storage.txLogs[index] = {
      ...storage.txLogs[index],
      ...updates
    }
    writeStorage(storage)
  })

  ipcMain.handle('txLog:delete', (_, id: string) => {
    const storage = readStorage()
    storage.txLogs = storage.txLogs.filter(l => l.id !== id)
    writeStorage(storage)
  })
}

app.whenReady().then(() => {
  setupIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

