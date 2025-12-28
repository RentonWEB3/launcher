import { create } from 'zustand'

export interface WalletInfo {
  address: string
  name?: string
  createdAt: number
}

interface WalletsState {
  wallets: WalletInfo[]
  loading: boolean
  error: string | null
  loadWallets: () => Promise<void>
  addWallet: (privateKey: string, name?: string) => Promise<void>
  deleteWallet: (address: string) => Promise<void>
}

export const useWalletsStore = create<WalletsState>((set, get) => ({
  wallets: [],
  loading: false,
  error: null,
  
  loadWallets: async () => {
    set({ loading: true, error: null })
    try {
      const wallets = await window.electronAPI.listWallets()
      set({ wallets, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  
  addWallet: async (privateKey: string, name?: string) => {
    set({ loading: true, error: null })
    try {
      await window.electronAPI.addWallet(privateKey, name)
      await get().loadWallets()
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  deleteWallet: async (address: string) => {
    set({ loading: true, error: null })
    try {
      await window.electronAPI.deleteWallet(address)
      await get().loadWallets()
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  }
}))

