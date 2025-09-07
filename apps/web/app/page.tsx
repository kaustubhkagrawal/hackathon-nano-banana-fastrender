"use client";

import { PromptForm } from "@workspace/ui/components/prompt-form";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRenderHistoryStore } from '@/stores';
import React from "react";

export default function Page() {
  const { history, currentResult, addResult, setCurrentResult, clearHistory } = useRenderHistoryStore();
  const [description, setDescription] = useState(
    "Create a 3d render view of the given room plan"
  );
  const [model, setModel] = useState("nano-banana");
  const [style, setStyle] = useState("japandi");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [selectedLibraryImage, setSelectedLibraryImage] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [renderResult, setRenderResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

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

  const handleSubmit = async () => {
    // Validate form data
    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }

    if (!selectedLibraryImage && !uploadedImage) {
      setError("Please select an image from the library or upload one");
      return;
    }

    // Declare variables at function scope to be accessible throughout
    let progressInterval: NodeJS.Timeout | undefined;
    let completeApiCall: (() => void) | undefined;

    try {
      setIsLoading(true);
      setError(null);
      setRenderResult(null);
      setHasSubmitted(true); // Trigger animation
      setLoadingStage(0);
      setLoadingProgress(0);

      // Start smart loading simulation that adapts to actual API progress
      const loadingStages = [
        { stage: 0, text: "Analyzing room structure...", baseMinTime: 2000, maxTime: 3000 },
        { stage: 1, text: "Reading walls and windows...", baseMinTime: 3000, maxTime: 5000 },
        { stage: 2, text: "Detecting furniture placement...", baseMinTime: 4000, maxTime: 7000 },
        { stage: 3, text: "Calculating camera angles...", baseMinTime: 2000, maxTime: 4000 },
        { stage: 4, text: "Rendering 3D environment...", baseMinTime: 2000, maxTime: 8000 }
      ];

      let currentStageIndex = 0;
      let stageStartTime = Date.now();
      let loadingStartTime = Date.now();
      let isApiComplete = false;
      
      const updateLoadingProgress = () => {
        const currentStage = loadingStages[currentStageIndex];
        if (!currentStage) return;
        
        const elapsed = Date.now() - stageStartTime;
        const totalElapsed = Date.now() - loadingStartTime;
        
        // Calculate adaptive progress based on API completion status
        let stageProgress: number;
        
        if (isApiComplete) {
          // If API is complete, quickly finish remaining stages
          stageProgress = Math.min((elapsed / 500) * 1, 1); // 500ms per remaining stage
        } else {
          // Normal progress with minimum time requirements
          const minProgress = Math.min(elapsed / currentStage.baseMinTime, 0.8);
          
          // Use slower progress for early stages, faster for later stages if taking too long
          if (totalElapsed > 30000) { // If over 30 seconds, speed up
            stageProgress = Math.min(elapsed / (currentStage.baseMinTime * 0.5), 0.9);
          } else {
            stageProgress = minProgress;
          }
        }
        
        setLoadingStage(currentStageIndex);
        setLoadingProgress(stageProgress * 100);
        
        // Move to next stage if:
        // 1. Current stage is complete (progress >= 1)
        // 2. OR API is complete and minimum time has passed
        // 3. OR current stage has been running for too long
        const shouldMoveToNext = 
          stageProgress >= 1 || 
          (isApiComplete && elapsed > 800) ||
          (!isApiComplete && elapsed > currentStage.maxTime);
          
        if (shouldMoveToNext && currentStageIndex < loadingStages.length - 1) {
          currentStageIndex++;
          stageStartTime = Date.now();
        }
        
        // Continue updating if not on last stage or if last stage not complete
        if (currentStageIndex < loadingStages.length - 1 || stageProgress < 1) {
          progressInterval = setTimeout(updateLoadingProgress, 100);
        }
      };
      
      // Function to signal API completion
      completeApiCall = () => {
        isApiComplete = true;
        // If we're still on early stages when API completes, jump to final stages
        if (currentStageIndex < 3) {
          currentStageIndex = 3;
          stageStartTime = Date.now();
        }
      };
      
      updateLoadingProgress();

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

      // Prepare the API request payload
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

      // Call our Next.js API endpoint
      const response = await fetch("/api/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      // Signal that API call is complete
      if (completeApiCall) {
        completeApiCall();
      }

      if (!response.ok) {
        throw new Error(
          result.error || `Request failed with status ${response.status}`
        );
      }

      console.log("Render result:", result);
      setRenderResult(result);
      
      // Add result to history store
      addResult({
        description,
        model,
        style,
        imageUrl,
        renderedImageUrl: result.media?.absoluteUrl || '',
        media: result.media
      });
    } catch (err) {
      console.error("Render request failed:", err);
      // Signal completion even on error
      if (completeApiCall) {
        completeApiCall();
      }
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
      setLoadingStage(0);
      setLoadingProgress(0);
      // Clean up any remaining progress intervals
      if (progressInterval) {
        clearTimeout(progressInterval);
      }
    }
  };

  const clearResults = () => {
    setRenderResult(null);
    setError(null);
    setHasSubmitted(false); // Reset animation state
    setCurrentResult(null);
    clearHistory(); // Also clear the history when clearing results
  };

  const handleSelectHistoryItem = (result: any) => {
    setCurrentResult(result);
    setRenderResult(result);
    setHasSubmitted(true);
    setDescription(result.description);
    setModel(result.model);
    setStyle(result.style);
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
                  {renderResult.media?.absoluteUrl ? (
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
                      Generated
                    </h3>
                  </div>
                  <button
                    onClick={clearResults}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ✕ Clear
                  </button>
                </div>

                {/* Main Result Thumbnail - Show Original Plan Image */}
                {(selectedLibraryImage || uploadedImage) && (
                  <div className="relative group cursor-pointer">
                    <img
                      src={selectedLibraryImage || (uploadedImage ? URL.createObjectURL(uploadedImage) : '')}
                      alt="Original plan image"
                      className="w-full aspect-square object-contain rounded-lg border-2 border-blue-500 shadow-lg bg-muted/30"
                    />
                    <div className="absolute inset-0 bg-blue-500/20 rounded-lg"></div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs text-foreground font-medium truncate">
                        Original Plan
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
                              <img
                                src={item.renderedImageUrl}
                                alt="Thumbnail"
                                className="w-10 h-10 object-cover rounded"
                              />
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
                {renderResult.media?.absoluteUrl && (
                  <div className="mt-auto pt-4 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-2">
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
                    </div>
                    <motion.a
                      href={renderResult.media.absoluteUrl}
                      download={renderResult.media?.filename}
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
          {!hasSubmitted && !renderResult && (
            <div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="max-w-md mx-auto">
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Fast Render</h2>
                    <p className="text-muted-foreground mb-6">
                      Upload your floor plan to get started with AI-powered 3D rendering
                    </p>
                    <div className="bg-muted/30 rounded-lg p-4 border border-border inline-block">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">Tip:</span> Use clear, high-contrast floor plans for best results
                      </p>
                    </div>
                  </div>

                </motion.div>


              <motion.div
                className="text-center py-8"
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.6 }}
              >
                {/* How It Works */}
                <div className="max-w-2xl mx-auto px-4">
                  <h2 className="text-xl font-semibold text-foreground mb-4">How It Works</h2>
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">1</span>
                      <span>Upload floor plan</span>
                    </div>
                    <svg className="w-4 h-4 text-muted-foreground hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">2</span>
                      <span>Describe your vision</span>
                    </div>
                    <svg className="w-4 h-4 text-muted-foreground hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">3</span>
                      <span>Get 3D render</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
         

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
            className="mb-4 p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg backdrop-blur-sm max-w-md"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-blue-600 font-medium text-lg">
                Generating 3D render...
              </p>
            </div>
            
            {/* Loading Stages */}
            <div className="space-y-3">
              {[
                "Analyzing room structure...",
                "Reading walls and windows...", 
                "Detecting furniture placement...",
                "Calculating camera angles...",
                "Rendering 3D environment..."
              ].map((stageText, index) => {
                const isActive = loadingStage === index;
                const isCompleted = loadingStage > index;
                
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500' 
                        : isActive 
                        ? 'border-blue-500 bg-blue-500/20' 
                        : 'border-gray-400'
                    }`}>
                      {isCompleted && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {isActive && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    <span className={`text-sm ${
                      isCompleted 
                        ? 'text-green-600 font-medium' 
                        : isActive 
                        ? 'text-blue-600 font-medium' 
                        : 'text-gray-500'
                    }`}>
                      {stageText}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-blue-600 font-medium">
                  Stage {loadingStage + 1} of 5
                </span>
                <span className="text-xs text-blue-500">
                  {Math.round(loadingProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${loadingProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
            
            <p className="text-blue-500 text-xs mt-3 text-center">
              This process typically takes 45-60 seconds
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
          onSubmit={handleSubmit}
          model={model}
          style={style}
          defaultDescription={description}
          isLoading={isLoading}
        />
      </motion.div>
    </div>
  );
}