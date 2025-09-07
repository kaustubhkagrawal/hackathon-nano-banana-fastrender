import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface Version {
  id: string
  name: string
  createdAt: Date
  // Add other properties as needed for your versions
}

interface VersionState {
  versions: Version[]
  currentVersionId: string | null
  addVersion: (version: Omit<Version, 'id' | 'createdAt'>) => void
  removeVersion: (id: string) => void
  setCurrentVersion: (id: string) => void
  getVersionById: (id: string) => Version | undefined
  clearAllVersions: () => void
}

export const useVersionStore = create<VersionState>()(
  persist(
    (set, get) => ({
      versions: [],
      currentVersionId: null,
      
      addVersion: (version) => {
        const newVersion: Version = {
          ...version,
          id: Date.now().toString(), // Simple ID generation, you might want to use uuid
          createdAt: new Date(),
        }
        
        set((state) => ({
          versions: [...state.versions, newVersion],
          currentVersionId: newVersion.id
        }))
      },
      
      removeVersion: (id) => {
        set((state) => {
          const updatedVersions = state.versions.filter(version => version.id !== id)
          // If we're removing the current version, set current to null or another version
          const currentVersionId = state.currentVersionId === id 
            ? updatedVersions.length > 0 
              ? updatedVersions[updatedVersions.length - 1]?.id || null
              : null
            : state.currentVersionId
          
          return {
            versions: updatedVersions,
            currentVersionId
          }
        })
      },
      
      setCurrentVersion: (id) => {
        // Verify that the version exists before setting it
        const versionExists = get().versions.some(version => version.id === id)
        if (versionExists) {
          set({ currentVersionId: id })
        }
      },
      
      getVersionById: (id) => {
        return get().versions.find(version => version.id === id)
      },
      
      clearAllVersions: () => {
        set({
          versions: [],
          currentVersionId: null
        })
      }
    }),
    {
      name: 'version-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
)