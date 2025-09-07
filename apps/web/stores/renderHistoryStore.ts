import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface RenderResult {
  id: string
  description: string
  model: string
  style: string
  imageUrl: string
  renderedImageUrl: string
  timestamp: Date
  media?: {
    absoluteUrl: string
    width: number
    height: number
    filesize: number
    filename: string
  }
}

interface RenderHistoryState {
  history: RenderResult[]
  currentResult: RenderResult | null
  addResult: (result: Omit<RenderResult, 'id' | 'timestamp'>) => void
  removeResult: (id: string) => void
  setCurrentResult: (result: RenderResult | null) => void
  getResultById: (id: string) => RenderResult | undefined
  clearHistory: () => void
}

export const useRenderHistoryStore = create<RenderHistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      currentResult: null,
      
      addResult: (result) => {
        const newResult: RenderResult = {
          ...result,
          id: Date.now().toString(),
          timestamp: new Date(),
        }
        
        set((state) => ({
          history: [newResult, ...state.history],
          currentResult: newResult
        }))
      },
      
      removeResult: (id) => {
        set((state) => ({
          history: state.history.filter(result => result.id !== id),
          currentResult: state.currentResult?.id === id ? null : state.currentResult
        }))
      },
      
      setCurrentResult: (result) => {
        set({ currentResult: result })
      },
      
      getResultById: (id) => {
        return get().history.find(result => result.id === id)
      },
      
      clearHistory: () => {
        set({
          history: [],
          currentResult: null
        })
      }
    }),
    {
      name: 'render-history-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)