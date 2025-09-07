"use client";

import { PromptForm } from "@workspace/ui/components/prompt-form";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRenderHistoryStore, usePublicImagesStore } from '@/stores';

interface RenderResult {
  id: string
  description: string
  model: string
  style: string
  action: 'render' | 'video-walkthrough' | '360-view'
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
  video?: {
    url: string
    file_name: string
    file_size: number
    content_type: string
  }
}

export default function Page() {
  const { history, currentResult, addResult, setCurrentResult, clearHistory } = useRenderHistoryStore();
  const { publicImages, addPublicImage, removePublicImage } = usePublicImagesStore();
  const [description, setDescription] = useState(
    "Create a 3d render of the given floor plan"
  );
  const [model, setModel] = useState("nano-banana");
  const [style, setStyle] = useState("japandi");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [selectedLibraryImage, setSelectedLibraryImage] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [renderResult, setRenderResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [action, setAction] = useState<'render' | 'video-walkthrough' | '360-view'>('render');

  // Load the current result from store on component mount
  useEffect(() => {
    if (currentResult) {
      setRenderResult(currentResult);
      setHasSubmitted(true);
      setDescription(currentResult.description);
      setModel(currentResult.model);
      setStyle(currentResult.style);
      setSelectedLibraryImage(currentResult.imageUrl);
    }
  }, [currentResult]);

  const handleImageUpload = (file: File) => {
    setUploadedImage(file);
    setSelectedLibraryImage(null); // Clear library selection
    console.log("Image uploaded:", file.name);
  };

  const handleImageSelect = (imageUrl: string) => {
    setSelectedLibraryImage(imageUrl);
    setUploadedImage(null); // Clear file upload
    console.log("Library image selected:", imageUrl);
  };

  const handleDescriptionChange = (desc: string) => {
    setDescription(desc);
    console.log("Description changed:", desc);
  };

  const handleModelChange = (selectedModel: string) => {
    setModel(selectedModel);
    console.log("Model changed:", selectedModel);
  };

  const handleStyleChange = (selectedStyle: string) => {
    setStyle(selectedStyle);
    console.log("Style changed:", selectedStyle);
  };

  const handleSubmit = async (selectedAction: 'render' | 'video-walkthrough' | '360-view') => {
    // Validate form data
    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }

    if (!selectedLibraryImage && !uploadedImage) {
      setError("Please select an image from the library or upload one");
      return;
    }

    setAction(selectedAction);

    try {
      setIsLoading(true);
      setError(null);
      setRenderResult(null);
      setHasSubmitted(true); // Trigger animation

      // Prepare the image URL
      let imageUrl: string;
      if (selectedLibraryImage) {
        imageUrl = selectedLibraryImage;
      } else if (uploadedImage) {
        // For uploaded files, you might want to upload to a storage service first
        // For now, we'll create a temporary URL (this won't work for the actual API)
        imageUrl = URL.createObjectURL(uploadedImage);
        console.warn(
          "Using temporary URL for uploaded file. Consider implementing file upload to storage service."
        );
      } else {
        throw new Error("No image available");
      }

      let result;
      if (selectedAction === 'render') {
        // Prepare the API request payload for render
        const payload = {
          style,
          model,
          assets: [
            {
              id: "",
              url: imageUrl,
            },
          ],
          prompt: description,
          version: 1,
        };

        console.log("Submitting render request:", payload);

        // Call our Next.js API endpoint for render
        const response = await fetch("/api/render", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || `Request failed with status ${response.status}`
          );
        }
      } else if (selectedAction === 'video-walkthrough') {
        // Prepare the API request payload for video walkthrough
        const payload = {
          assets: [
            {
              id: "",
              url: imageUrl,
            },
          ],
          prompt: description,
        };

        console.log("Submitting video walkthrough request:", payload);

        // Call our Next.js API endpoint for video walkthrough
        const response = await fetch("/api/video-walkthrough", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || `Request failed with status ${response.status}`
          );
        }
      } else {
        throw new Error("Unsupported action");
      }

      console.log("Result:", result);
      setRenderResult(result);
      
      // Add result to history store
      if (selectedAction === 'render') {
        addResult({
          description,
          model,
          style,
          action: selectedAction,
          imageUrl,
          renderedImageUrl: result.media?.absoluteUrl || '',
          media: result.media
        });
      } else if (selectedAction === 'video-walkthrough') {
        // For video walkthrough, we'll store the video URL
        addResult({
          description,
          model,
          style: '', // No style for video walkthrough
          action: selectedAction,
          imageUrl,
          renderedImageUrl: result.video?.url || '',
          video: result.video
        });
      }
    } catch (err) {
      console.error("Request failed:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setRenderResult(null);
    setError(null);
    setHasSubmitted(false); // Reset animation state
    setCurrentResult(null);
    clearHistory(); // Also clear the history when clearing results
  };

  const handleSelectHistoryItem = (result: RenderResult) => {
    setCurrentResult(result);
    setRenderResult(result);
    setHasSubmitted(true);
    setDescription(result.description);
    setModel(result.model);
    setStyle(result.style);
    setAction(result.action); // Set the action from history
    setSelectedLibraryImage(result.imageUrl);
  };

  const handleClearHistory = () => {
    clearHistory();
    // We don't want to clear the current result when clearing history
    // The current result should remain visible
  };

  return (
    <div className="min-h-svh bg-background overflow-hidden">
      {/* Header - Only show when not submitted */}
      <AnimatePresence>
        {!hasSubmitted && (
          <motion.div
            className="text-center py-8"
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              3D Render Generator
            </h1>
            <p className="text-muted-foreground">
              Select an image and describe your vision to generate a 3D render
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div
        className={`transition-all duration-1000 ${
          hasSubmitted && renderResult
            ? "h-screen flex flex-col pb-32"
            : "flex items-center justify-center min-h-[60vh] px-8 pb-32"
        }`}
      >
        {/* Results Layout - Wireframe Style */}
        <AnimatePresence>
          {renderResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="flex-1 flex overflow-hidden"
            >
              {/* Main Content Area */}
              <div className="flex-1 flex items-center justify-center p-8 bg-muted/20">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="relative max-w-4xl max-h-full"
                >
                  {/* Video Preview */}
                  { renderResult.video?.url ? (
                    <div className="w-full max-h-[60vh]">
                      <video 
                        src={renderResult.video.url} 
                        controls 
                        className="w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-2xl border border-border"
                      />
                    </div>
                  ) : renderResult.media?.absoluteUrl ? (
                    /* Image Preview */
                    <img
                      src={renderResult.media.absoluteUrl}
                      alt="Generated 3D render"
                      className="w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-2xl border border-border"
                    />
                  ) : (
                    <div className="w-96 h-64 bg-muted rounded-lg flex items-center justify-center border border-border">
                      <svg
                        className="w-16 h-16 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Right Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="w-64 bg-muted/30 border-l border-border p-4 flex flex-col gap-4 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <h3 className="text-sm font-semibold text-foreground">
                      {action === 'video-walkthrough' ? 'Video Generated' : 'Generated'}
                    </h3>
                  </div>
                  <button
                    onClick={clearResults}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ✕ Clear
                  </button>
                </div>

                {/* Main Result Thumbnail */}
                {action === 'video-walkthrough' && renderResult.video?.url ? (
                  <div className="relative group cursor-pointer">
                    <div className="w-full aspect-square bg-muted rounded-lg border-2 border-blue-500 shadow-lg flex items-center justify-center">
                      <svg 
                        className="w-8 h-8 text-blue-500" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
                        />
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-blue-500/20 rounded-lg"></div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs text-foreground font-medium truncate">
                        Current Video
                      </p>
                    </div>
                  </div>
                ) : renderResult.media?.absoluteUrl && (
                  <div className="relative group cursor-pointer">
                    <img
                      src={renderResult.media.absoluteUrl}
                      alt="Generated render thumbnail"
                      className="w-full aspect-square object-cover rounded-lg border-2 border-blue-500 shadow-lg"
                    />
                    <div className="absolute inset-0 bg-blue-500/20 rounded-lg"></div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs text-foreground font-medium truncate">
                        Current Render
                      </p>
                    </div>
                  </div>
                )}

                {/* History Section */}
                <div className="border-t border-border pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      History
                    </h4>
                    <button
                      onClick={handleClearHistory}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {history.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        No history yet
                      </p>
                    ) : (
                      history.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectHistoryItem(item)}
                          className={`relative group cursor-pointer rounded-lg p-2 ${
                            currentResult?.id === item.id
                              ? 'bg-blue-500/20 border border-blue-500/30'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {item.renderedImageUrl ? (
                              // Check if this is a video or image based on file extension or other heuristics
                              item.renderedImageUrl.endsWith('.mp4') || 
                              item.renderedImageUrl.endsWith('.webm') || 
                              item.renderedImageUrl.endsWith('.mov') ? (
                                // Video thumbnail
                                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                  <svg 
                                    className="w-4 h-4 text-muted-foreground" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth={1} 
                                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
                                    />
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth={1} 
                                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                                    />
                                  </svg>
                                </div>
                              ) : (
                                // Image thumbnail
                                <img
                                  src={item.renderedImageUrl}
                                  alt="Thumbnail"
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-muted-foreground"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">
                                {item.description.substring(0, 20)}...
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Download Section */}
                {(renderResult.media?.absoluteUrl || renderResult.video?.url) && (
                  <div className="mt-auto pt-4 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-2">
                      {action === 'video-walkthrough' ? (
                        <>
                          {renderResult.video?.file_size && (
                            <p>
                              File:{" "}
                              {(renderResult.video.file_size / 1024 / 1024).toFixed(
                                2
                              )}{" "}
                              MB
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p>
                            Size: {renderResult.media?.width} ×{" "}
                            {renderResult.media?.height}
                          </p>
                          {renderResult.media?.filesize && (
                            <p>
                              File:{" "}
                              {(renderResult.media.filesize / 1024 / 1024).toFixed(
                                2
                              )}{" "}
                              MB
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <motion.a
                      href={action === 'video-walkthrough' ? renderResult.video?.url : renderResult.media?.absoluteUrl}
                      download={action === 'video-walkthrough' ? renderResult.video?.file_name : renderResult.media?.filename}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                        />
                      </svg>
                      Download
                    </motion.a>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Form - Always positioned at bottom */}
      <motion.div
        layout
        initial={{ y: 0 }}
        animate={{
          y: 0,
          scale: 1,
        }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
          duration: 0.8,
        }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center"
      >
        {/* Loading State - Above the form */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-blue-600 font-medium">
                {action === 'video-walkthrough' ? "Generating video walkthrough..." : "Generating 3D render..."}
              </p>
            </div>
            <p className="text-blue-500 text-sm mt-1">
              This may take a few moments
            </p>
          </motion.div>
        )}

        {/* Error Display - Above the form */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-destructive font-medium">Error</p>
            </div>
            <p className="text-destructive/80 text-sm mt-1">{error}</p>
            <button
              onClick={clearResults}
              className="mt-2 text-xs text-destructive hover:text-destructive/80 underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Prompt Form */}
        <PromptForm
          onImageUpload={handleImageUpload}
          onImageSelect={handleImageSelect}
          onDescriptionChange={handleDescriptionChange}
          onModelChange={handleModelChange}
          onStyleChange={handleStyleChange}
          onActionChange={setAction}
          onSubmit={handleSubmit}
          model={model}
          style={style}
          action={action}
          defaultDescription={description}
          isLoading={isLoading}
          // Public images props
          publicImages={publicImages}
          onAddPublicImage={addPublicImage}
          onRemovePublicImage={removePublicImage}
          onPublicImageSelect={handleImageSelect}
        />
      </motion.div>
    </div>
  );
}