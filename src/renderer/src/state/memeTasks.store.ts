import { create } from 'zustand'
import type { MemeTask } from '../../../core/domain/types'

interface MemeTasksState {
  tasks: MemeTask[]
  loading: boolean
  error: string | null
  loadTasks: () => Promise<void>
  createTask: (task: Omit<MemeTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateTask: (id: string, updates: Partial<MemeTask>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  getTask: (id: string) => MemeTask | undefined
}

export const useMemeTasksStore = create<MemeTasksState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  
  loadTasks: async () => {
    set({ loading: true, error: null })
    try {
      const tasks = await window.electronAPI.listMemeTasks()
      set({ tasks, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  
  createTask: async (taskData) => {
    set({ loading: true, error: null })
    try {
      const id = await window.electronAPI.createMemeTask(taskData)
      await get().loadTasks()
      return id
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  updateTask: async (id: string, updates: Partial<MemeTask>) => {
    set({ loading: true, error: null })
    try {
      await window.electronAPI.updateMemeTask(id, updates)
      await get().loadTasks()
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  deleteTask: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await window.electronAPI.deleteMemeTask(id)
      await get().loadTasks()
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  getTask: (id: string) => {
    return get().tasks.find(t => t.id === id)
  }
}))

