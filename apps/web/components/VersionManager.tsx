'use client'

import React, { useState } from 'react'
import { useVersionStore } from '@/stores/versionStore'

const VersionManager = () => {
  const { versions, currentVersionId, addVersion, removeVersion, setCurrentVersion, clearAllVersions } = useVersionStore()
  const [versionName, setVersionName] = useState('')

  const handleAddVersion = () => {
    if (versionName.trim()) {
      addVersion({ name: versionName.trim() })
      setVersionName('')
    }
  }

  const handleSetCurrent = (id: string) => {
    setCurrentVersion(id)
  }

  const handleRemove = (id: string) => {
    removeVersion(id)
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Version Manager</h2>
      
      <div className="mb-4">
        <input
          type="text"
          value={versionName}
          onChange={(e) => setVersionName(e.target.value)}
          placeholder="Enter version name"
          className="border p-2 mr-2"
        />
        <button 
          onClick={handleAddVersion}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Version
        </button>
      </div>

      <div className="mb-4">
        <button 
          onClick={clearAllVersions}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Clear All Versions
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Versions:</h3>
        {versions.length === 0 ? (
          <p>No versions created yet.</p>
        ) : (
          <ul className="space-y-2">
            {versions.map((version) => (
              <li 
                key={version.id} 
                className={`flex justify-between items-center p-2 border rounded ${
                  currentVersionId === version.id ? 'bg-blue-100' : ''
                }`}
              >
                <div>
                  <span className="font-medium">{version.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    (Created: {version.createdAt.toLocaleString()})
                  </span>
                  {currentVersionId === version.id && (
                    <span className="ml-2 text-xs bg-green-500 text-white px-1 rounded">Current</span>
                  )}
                </div>
                <div>
                  <button
                    onClick={() => handleSetCurrent(version.id)}
                    disabled={currentVersionId === version.id}
                    className={`px-2 py-1 text-sm rounded mr-2 ${
                      currentVersionId === version.id 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-green-500 text-white'
                    }`}
                  >
                    Set Current
                  </button>
                  <button
                    onClick={() => handleRemove(version.id)}
                    className="bg-red-500 text-white px-2 py-1 text-sm rounded"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default VersionManager