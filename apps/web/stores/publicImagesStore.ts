import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface PublicImage {
  id: string
  url: string
  timestamp: Date
}

interface PublicImagesState {
  publicImages: PublicImage[]
  addPublicImage: (url: string) => void
  removePublicImage: (id: string) => void
  clearPublicImages: () => void
}

export const usePublicImagesStore = create<PublicImagesState>()(
  persist(
    (set, get) => ({
      publicImages: [],
      
      addPublicImage: (url: string) => {
        // Check if image already exists
        const existingImage = get().publicImages.find(img => img.url === url)
        if (existingImage) return
        
        const newImage: PublicImage = {
          id: Date.now().toString(),
          url,
          timestamp: new Date(),
        }
        
        set((state) => ({
          publicImages: [newImage, ...state.publicImages]
        }))
      },
      
      removePublicImage: (id: string) => {
        set((state) => ({
          publicImages: state.publicImages.filter(img => img.id !== id)
        }))
      },
      
      clearPublicImages: () => {
        set({
          publicImages: []
        })
      }
    }),
    {
      name: 'public-images-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)