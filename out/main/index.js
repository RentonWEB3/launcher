import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { scrypt, randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { promisify } from "util";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const DEFAULT_STORAGE = {
  vault: null,
  memeTasks: [],
  txLogs: []
};
const STORAGE_FILE = "storage.json";
function getStoragePath() {
  const userDataPath = app.getPath("userData");
  return join(userDataPath, STORAGE_FILE);
}
function readStorage() {
  const path = getStoragePath();
  if (!existsSync(path)) {
    return DEFAULT_STORAGE;
  }
  try {
    const data = readFileSync(path, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading storage:", error);
    return DEFAULT_STORAGE;
  }
}
function writeStorage(data) {
  const path = getStoragePath();
  const userDataPath = app.getPath("userData");
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true });
  }
  try {
    writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing storage:", error);
    throw error;
  }
}
const scryptAsync = promisify(scrypt);
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const SCRYPT_PARAMS = {
  N: 16384,
  // CPU/memory cost
  r: 8,
  // block size
  p: 1
  // parallelization
};
async function deriveKey(password, salt) {
  const key = await scryptAsync(
    password,
    salt,
    KEY_LENGTH,
    SCRYPT_PARAMS
  );
  return key;
}
function generateSalt() {
  return randomBytes(SALT_LENGTH);
}
const keyDerivation = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  deriveKey,
  generateSalt
}, Symbol.toStringTag, { value: "Module" }));
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
let masterKey = null;
let masterSalt = null;
async function createVault(password) {
  masterSalt = generateSalt();
  masterKey = await deriveKey(password, masterSalt);
}
async function unlockVault(password, salt) {
  try {
    masterKey = await deriveKey(password, salt);
    masterSalt = salt;
    return true;
  } catch (error) {
    return false;
  }
}
function lockVault() {
  masterKey = null;
  masterSalt = null;
}
function isVaultUnlocked() {
  return masterKey !== null;
}
function encryptPrivateKey(privateKey) {
  if (!masterKey) {
    throw new Error("Vault is locked");
  }
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, masterKey, iv);
  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return {
    encrypted,
    salt: masterSalt.toString("hex"),
    iv: iv.toString("hex"),
    tag: tag.toString("hex")
  };
}
function decryptPrivateKey(encryptedData) {
  if (!masterKey) {
    throw new Error("Vault is locked");
  }
  const iv = Buffer.from(encryptedData.iv, "hex");
  const tag = Buffer.from(encryptedData.tag, "hex");
  const decipher = createDecipheriv(ALGORITHM, masterKey, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
const __dirname$1 = fileURLToPath(new URL(".", import.meta.url));
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname$1, "../preload/index.mjs"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname$1, "../renderer/index.html"));
  }
}
function setupIpcHandlers() {
  ipcMain.handle("storage:getUserDataPath", () => {
    return app.getPath("userData");
  });
  ipcMain.handle("storage:read", async (_, path) => {
    try {
      const fs = await import("fs");
      const data = fs.readFileSync(path, "utf-8");
      return data;
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  });
  ipcMain.handle("storage:write", async (_, path, data) => {
    try {
      const fs = await import("fs");
      const pathModule = await import("path");
      const dir = pathModule.dirname(path);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path, data, "utf-8");
    } catch (error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
  });
  ipcMain.handle("vault:exists", () => {
    const storage = readStorage();
    return storage.vault !== null;
  });
  ipcMain.handle("vault:create", async (_, password) => {
    const salt = (await Promise.resolve().then(() => keyDerivation)).generateSalt();
    await createVault(password);
    const storage = readStorage();
    storage.vault = {
      wallets: [],
      salt: salt.toString("hex"),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    writeStorage(storage);
  });
  ipcMain.handle("vault:unlock", async (_, password) => {
    const storage = readStorage();
    if (!storage.vault) {
      throw new Error("Vault does not exist");
    }
    let salt;
    if (storage.vault.salt) {
      salt = Buffer.from(storage.vault.salt, "hex");
    } else if (storage.vault.wallets.length > 0) {
      const firstWallet = storage.vault.wallets[0];
      const encryptedData = JSON.parse(firstWallet.encryptedPrivateKey);
      salt = Buffer.from(encryptedData.salt, "hex");
      storage.vault.salt = encryptedData.salt;
      writeStorage(storage);
    } else {
      throw new Error("Vault salt not found");
    }
    const unlocked = await unlockVault(password, salt);
    if (!unlocked) {
      throw new Error("Invalid password");
    }
  });
  ipcMain.handle("vault:lock", () => {
    lockVault();
  });
  ipcMain.handle("vault:isUnlocked", () => {
    return isVaultUnlocked();
  });
  ipcMain.handle("wallet:add", async (_, privateKey, name) => {
    if (!isVaultUnlocked()) {
      throw new Error("Vault is locked");
    }
    const { Wallet: EthersWallet } = await import("ethers");
    const ethersWallet = new EthersWallet(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);
    const address = ethersWallet.address;
    const encrypted = encryptPrivateKey(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);
    const wallet = {
      address,
      name: name || `Wallet ${address.slice(0, 8)}`,
      encryptedPrivateKey: JSON.stringify(encrypted),
      createdAt: Date.now()
    };
    const storage = readStorage();
    if (!storage.vault) {
      throw new Error("Vault does not exist");
    }
    if (storage.vault.wallets.some((w) => w.address.toLowerCase() === address.toLowerCase())) {
      throw new Error("Wallet already exists");
    }
    storage.vault.wallets.push(wallet);
    storage.vault.updatedAt = Date.now();
    writeStorage(storage);
    return { address, name: wallet.name };
  });
  ipcMain.handle("wallet:list", () => {
    const storage = readStorage();
    if (!storage.vault) {
      return [];
    }
    return storage.vault.wallets.map((w) => ({
      address: w.address,
      name: w.name,
      createdAt: w.createdAt
    }));
  });
  ipcMain.handle("wallet:delete", (_, address) => {
    const storage = readStorage();
    if (!storage.vault) {
      throw new Error("Vault does not exist");
    }
    storage.vault.wallets = storage.vault.wallets.filter(
      (w) => w.address.toLowerCase() !== address.toLowerCase()
    );
    storage.vault.updatedAt = Date.now();
    writeStorage(storage);
  });
  ipcMain.handle("wallet:getPrivateKey", (_, address) => {
    if (!isVaultUnlocked()) {
      throw new Error("Vault is locked");
    }
    const storage = readStorage();
    if (!storage.vault) {
      throw new Error("Vault does not exist");
    }
    const wallet = storage.vault.wallets.find(
      (w) => w.address.toLowerCase() === address.toLowerCase()
    );
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    const encryptedData = JSON.parse(wallet.encryptedPrivateKey);
    return decryptPrivateKey(encryptedData);
  });
  ipcMain.handle("memeTask:list", () => {
    const storage = readStorage();
    return storage.memeTasks;
  });
  ipcMain.handle("memeTask:get", (_, id) => {
    const storage = readStorage();
    return storage.memeTasks.find((t) => t.id === id) || null;
  });
  ipcMain.handle("memeTask:create", (_, taskData) => {
    const storage = readStorage();
    const task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    storage.memeTasks.push(task);
    writeStorage(storage);
    return task.id;
  });
  ipcMain.handle("memeTask:update", (_, id, updates) => {
    const storage = readStorage();
    const index = storage.memeTasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error("Task not found");
    }
    storage.memeTasks[index] = {
      ...storage.memeTasks[index],
      ...updates,
      updatedAt: Date.now()
    };
    writeStorage(storage);
  });
  ipcMain.handle("memeTask:delete", (_, id) => {
    const storage = readStorage();
    storage.memeTasks = storage.memeTasks.filter((t) => t.id !== id);
    writeStorage(storage);
  });
  ipcMain.handle("txLog:list", (_, filters) => {
    const storage = readStorage();
    let logs = storage.txLogs;
    if (filters) {
      if (filters.taskId) {
        logs = logs.filter((log) => log.taskId === filters.taskId);
      }
      if (filters.walletAddress) {
        logs = logs.filter((log) => log.walletAddress.toLowerCase() === filters.walletAddress.toLowerCase());
      }
      if (filters.status) {
        logs = logs.filter((log) => log.status === filters.status);
      }
    }
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  });
  ipcMain.handle("txLog:create", (_, logData) => {
    const storage = readStorage();
    const log = {
      ...logData,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    storage.txLogs.push(log);
    writeStorage(storage);
    return log.id;
  });
  ipcMain.handle("txLog:update", (_, id, updates) => {
    const storage = readStorage();
    const index = storage.txLogs.findIndex((l) => l.id === id);
    if (index === -1) {
      throw new Error("Log not found");
    }
    storage.txLogs[index] = {
      ...storage.txLogs[index],
      ...updates
    };
    writeStorage(storage);
  });
  ipcMain.handle("txLog:delete", (_, id) => {
    const storage = readStorage();
    storage.txLogs = storage.txLogs.filter((l) => l.id !== id);
    writeStorage(storage);
  });
}
app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
