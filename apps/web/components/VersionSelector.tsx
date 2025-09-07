'use client'

import React from 'react'
import { useVersionStore } from '@/stores'

const VersionSelector = () => {
  const { versions, currentVersionId, addVersion, removeVersion, setCurrentVersion } = useVersionStore()
  
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-bold mb-2">Project Versions</h2>
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => addVersion({ name: `Version ${versions.length + 1}` })}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          Add Version
        </button>
      </div>
      
      <div className="space-y-2">
        {versions.map((version) => (
          <div 
            key={version.id} 
            className={`flex justify-between items-center p-2 border rounded ${
              currentVersionId === version.id ? 'bg-blue-100' : ''
            }`}
          >
            <div>
              <span className="font-medium">{version.name}</span>
              <span className="text-xs text-gray-500 ml-2">
                ({new Date(version.createdAt).toLocaleString()})
              </span>
              {currentVersionId === version.id && (
                <span className="ml-2 text-xs bg-green-500 text-white px-1 rounded">Current</span>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentVersion(version.id)}
                disabled={currentVersionId === version.id}
                className={`px-2 py-1 text-xs rounded ${
                  currentVersionId === version.id 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-green-500 text-white'
                }`}
              >
                Set Current
              </button>
              <button
                onClick={() => removeVersion(version.id)}
                className="bg-red-500 text-white px-2 py-1 text-xs rounded"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        
        {versions.length === 0 && (
          <p className="text-gray-500 text-sm">No versions created yet</p>
        )}
      </div>
    </div>
  )
}

export default VersionSelector