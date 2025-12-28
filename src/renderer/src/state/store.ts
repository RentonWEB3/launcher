import { create } from 'zustand'

interface AppState {
  vaultUnlocked: boolean
  vaultExists: boolean
  loading: boolean
  checkVaultStatus: () => Promise<void>
  createVault: (password: string) => Promise<void>
  unlockVault: (password: string) => Promise<void>
  lockVault: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  vaultUnlocked: false,
  vaultExists: false,
  loading: false,
  
  checkVaultStatus: async () => {
    set({ loading: true })
    try {
      const exists = await window.electronAPI.vaultExists()
      const unlocked = exists ? await window.electronAPI.isVaultUnlocked() : false
      set({ vaultExists: exists, vaultUnlocked: unlocked, loading: false })
    } catch (error: any) {
      set({ loading: false })
    }
  },
  
  createVault: async (password: string) => {
    set({ loading: true })
    try {
      await window.electronAPI.createVault(password)
      set({ vaultExists: true, vaultUnlocked: true, loading: false })
    } catch (error: any) {
      set({ loading: false })
      throw error
    }
  },
  
  unlockVault: async (password: string) => {
    set({ loading: true })
    try {
      await window.electronAPI.unlockVault(password)
      set({ vaultUnlocked: true, loading: false })
    } catch (error: any) {
      set({ loading: false })
      throw error
    }
  },
  
  lockVault: async () => {
    try {
      await window.electronAPI.lockVault()
      set({ vaultUnlocked: false })
    } catch (error: any) {
      console.error('Failed to lock vault:', error)
    }
  }
}))

