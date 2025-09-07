"use client"

import { PromptForm } from "@workspace/ui/components/prompt-form"
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"


export default function Page() {
  const [description, setDescription] = useState("Create a 3d render of the given floor plan")
  const [model, setModel] = useState("nano-banana")
  const [style, setStyle] = useState("japandi")
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [selectedLibraryImage, setSelectedLibraryImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [renderResult, setRenderResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const handleImageUpload = (file: File) => {
    setUploadedImage(file)
    setSelectedLibraryImage(null) // Clear library selection
    console.log("Image uploaded:", file.name)
  }

  const handleImageSelect = (imageUrl: string) => {
    setSelectedLibraryImage(imageUrl)
    setUploadedImage(null) // Clear file upload
    console.log("Library image selected:", imageUrl)
  }

  const handleDescriptionChange = (desc: string) => {
    setDescription(desc)
    console.log("Description changed:", desc)
  }

  const handleModelChange = (selectedModel: string) => {
    setModel(selectedModel)
    console.log("Model changed:", selectedModel)
  }

  const handleStyleChange = (selectedStyle: string) => {
    setStyle(selectedStyle)
    console.log("Style changed:", selectedStyle)
  }

  const handleSubmit = async () => {
    // Validate form data
    if (!description.trim()) {
      setError("Please enter a description")
      return
    }

    if (!selectedLibraryImage && !uploadedImage) {
      setError("Please select an image from the library or upload one")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setRenderResult(null)
      setHasSubmitted(true) // Trigger animation

      // Prepare the image URL
      let imageUrl: string
      if (selectedLibraryImage) {
        imageUrl = selectedLibraryImage
      } else if (uploadedImage) {
        // For uploaded files, you might want to upload to a storage service first
        // For now, we'll create a temporary URL (this won't work for the actual API)
        imageUrl = URL.createObjectURL(uploadedImage)
        console.warn("Using temporary URL for uploaded file. Consider implementing file upload to storage service.")
      } else {
        throw new Error("No image available")
      }

      // Prepare the API request payload
      const payload = {
        style,
        model,
        assets: [
          {
            id: "",
            url: imageUrl
          }
        ],
        prompt: description,
        version: 1
      }

      console.log("Submitting render request:", payload)

      // Call our Next.js API endpoint
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Request failed with status ${response.status}`)
      }

      console.log("Render result:", result)
      setRenderResult(result)

    } catch (err) {
      console.error("Render request failed:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setRenderResult(null)
    setError(null)
    setHasSubmitted(false) // Reset animation state
  }

  return (
    <div className="min-h-svh bg-gray-950 p-8 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header - Only show when not submitted */}
        <AnimatePresence>
          {!hasSubmitted && (
            <motion.div 
              className="text-center mb-8"
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold text-white mb-2">3D Render Generator</h1>
              <p className="text-gray-400">Select an image and describe your vision to generate a 3D render</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Layout */}
        <div className={`grid transition-all duration-1000 ${
          hasSubmitted && renderResult 
            ? 'grid-cols-1 lg:grid-cols-2 gap-8'
            : 'grid-cols-1'
        }`}>
          {/* Form Section */}
          <motion.div
            layout
            initial={{ y: 0 }}
            animate={{
              y: hasSubmitted ? 0 : 0,
              scale: hasSubmitted && renderResult ? 0.9 : 1
            }}
            transition={{ 
              type: "spring", 
              stiffness: 100, 
              damping: 20,
              duration: 0.8
            }}
            className={hasSubmitted && renderResult ? 'order-2 lg:order-1' : ''}
          >
            <PromptForm
              onImageUpload={handleImageUpload}
              onImageSelect={handleImageSelect}
              onDescriptionChange={handleDescriptionChange}
              onModelChange={handleModelChange}
              onStyleChange={handleStyleChange}
              onSubmit={handleSubmit}
              model={model}
              style={style}
              defaultDescription={description}
              isLoading={isLoading}
            />

            {/* Error Display */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-950/50 border border-red-800 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-300 font-medium">Error</p>
                </div>
                <p className="text-red-200 text-sm mt-1">{error}</p>
                <button
                  onClick={clearResults}
                  className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                >
                  Dismiss
                </button>
              </motion.div>
            )}

            {/* Loading State */}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 bg-blue-950/30 border border-blue-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                  <p className="text-blue-300 font-medium">Generating 3D render...</p>
                </div>
                <p className="text-blue-200 text-sm mt-1">This may take a few moments</p>
              </motion.div>
            )}
          </motion.div>

          {/* Results Section */}
          <AnimatePresence>
            {renderResult && (
              <motion.div 
                initial={{ opacity: 0, x: 100, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.8 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 100, 
                  damping: 20,
                  duration: 0.8,
                  delay: 0.2
                }}
                className="order-1 lg:order-2"
              >
                {/* Generated Image Display */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <h2 className="text-xl font-semibold text-white">Generated 3D Render</h2>
                    </div>
                    <button
                      onClick={clearResults}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      ✕ Clear
                    </button>
                  </div>

                  {/* Main Image Display */}
                  {renderResult.media?.absoluteUrl && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="relative group"
                    >
                      <img
                        src={renderResult.media.absoluteUrl}
                        alt="Generated 3D render"
                        className="w-full h-auto rounded-lg shadow-2xl border border-gray-600 transition-transform group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                    </motion.div>
                  )}

                  {/* Image Details */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                    className="mt-4 p-4 bg-gray-800/50 rounded-lg"
                  >
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Dimensions:</span>
                        <p className="text-white">
                          {renderResult.media?.width} × {renderResult.media?.height}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">File Size:</span>
                        <p className="text-white">
                          {renderResult.media?.filesize ? 
                            `${(renderResult.media.filesize / 1024 / 1024).toFixed(2)} MB` : 
                            'N/A'
                          }
                        </p>
                      </div>
                    </div>
                    
                    {/* Download Button */}
                    <motion.a
                      href={renderResult.media?.absoluteUrl}
                      download={renderResult.media?.filename}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                      Download Image
                    </motion.a>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
