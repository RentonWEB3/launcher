import { create } from 'zustand'
import type { TxLog } from '../../../core/domain/types'

interface TxLogsState {
  logs: TxLog[]
  loading: boolean
  error: string | null
  filters: {
    taskId?: string
    walletAddress?: string
    status?: 'pending' | 'success' | 'fail'
  }
  loadLogs: (filters?: { taskId?: string; walletAddress?: string; status?: string }) => Promise<void>
  createLog: (logData: Omit<TxLog, 'id' | 'timestamp'>) => Promise<string>
  updateLog: (id: string, updates: Partial<TxLog>) => Promise<void>
  deleteLog: (id: string) => Promise<void>
  setFilters: (filters: { taskId?: string; walletAddress?: string; status?: 'pending' | 'success' | 'fail' }) => void
}

export const useTxLogsStore = create<TxLogsState>((set, get) => ({
  logs: [],
  loading: false,
  error: null,
  filters: {},
  
  loadLogs: async (filters) => {
    set({ loading: true, error: null })
    try {
      const logs = await window.electronAPI.listTxLogs(filters)
      set({ logs, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  
  createLog: async (logData) => {
    set({ loading: true, error: null })
    try {
      const id = await window.electronAPI.createTxLog(logData)
      await get().loadLogs(get().filters)
      return id
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  updateLog: async (id: string, updates: Partial<TxLog>) => {
    set({ loading: true, error: null })
    try {
      await window.electronAPI.updateTxLog(id, updates)
      await get().loadLogs(get().filters)
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  deleteLog: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await window.electronAPI.deleteTxLog(id)
      await get().loadLogs(get().filters)
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  setFilters: (filters) => {
    set({ filters })
    get().loadLogs(filters)
  }
}))

