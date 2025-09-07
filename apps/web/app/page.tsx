"use client";

import { PromptForm } from "@workspace/ui/components/prompt-form";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRenderHistoryStore, usePublicImagesStore } from "@/stores";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import React from "react";

interface RenderResult {
  id: string;
  description: string;
  model: string;
  style: string;
  action: "render" | "video-walkthrough" | "360-view";
  imageUrl: string;
  renderedImageUrl: string;
  timestamp: Date;
  media?: {
    absoluteUrl: string;
    width: number;
    height: number;
    filesize: number;
    filename: string;
  };
  video?: {
    url: string;
    file_name: string;
    file_size: number;
    content_type: string;
  };
}

export default function Page() {
  const { history, currentResult, addResult, setCurrentResult, clearHistory } =
    useRenderHistoryStore();
  const { publicImages, addPublicImage, removePublicImage } =
    usePublicImagesStore();
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
  const [action, setAction] = useState<
    "render" | "video-walkthrough" | "360-view"
  >("render");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Don't automatically load currentResult on mount - start with empty view
  // Results should only be shown when explicitly selected from history or after new submission

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

  const handleSubmit = async (
    selectedAction: "render" | "video-walkthrough" | "360-view"
  ) => {
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
        {
          stage: 0,
          text: "Analyzing room structure...",
          baseMinTime: 2000,
          maxTime: 3000,
        },
        {
          stage: 1,
          text: "Reading walls and windows...",
          baseMinTime: 3000,
          maxTime: 5000,
        },
        {
          stage: 2,
          text: "Detecting furniture placement...",
          baseMinTime: 4000,
          maxTime: 7000,
        },
        {
          stage: 3,
          text: "Calculating camera angles...",
          baseMinTime: 2000,
          maxTime: 4000,
        },
        {
          stage: 4,
          text: "Rendering 3D environment...",
          baseMinTime: 2000,
          maxTime: 8000,
        },
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
          if (totalElapsed > 30000) {
            // If over 30 seconds, speed up
            stageProgress = Math.min(
              elapsed / (currentStage.baseMinTime * 0.5),
              0.9
            );
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

      let result;
      if (selectedAction === "render") {
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
      } else if (selectedAction === "video-walkthrough") {
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

      // Signal that API call is complete
      if (completeApiCall) {
        completeApiCall();
      }

      console.log("Result:", result);
      setRenderResult(result);

      // Add result to history store
      if (selectedAction === "render") {
        addResult({
          description,
          model,
          style,
          action: selectedAction,
          imageUrl,
          renderedImageUrl: result.media?.absoluteUrl || "",
          media: result.media,
        });
      } else if (selectedAction === "video-walkthrough") {
        // For video walkthrough, we'll store the video URL
        addResult({
          description,
          model,
          style: "", // No style for video walkthrough
          action: selectedAction,
          imageUrl,
          renderedImageUrl: result.video?.url || "",
          video: result.video,
        });
      }
    } catch (err) {
      console.error("Request failed:", err);
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
    // Reset form to default state
    setDescription("Create a 3d render view of the given room plan");
    setModel("nano-banana");
    setStyle("japandi");
    setSelectedLibraryImage(null);
    setUploadedImage(null);
    setAction("render");
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
    // Note: This only clears the history, not the currently displayed result
  };

  return (
    <div className="h-svh flex flex-col bg-background overflow-hidden [background-size:40px_40px] [background-image:linear-gradient(to_right,rgba(228,228,231,0.3)_1px,transparent_2px),linear-gradient(to_bottom,rgba(228,228,231,0.4)_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,rgba(38,38,38,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(38,38,38,0.18)_1px,transparent_1px)]">
      {/* Fixed History Button - Top Right */}
      {renderResult && (
        <div className="fixed top-24 right-8 z-40">
          <Drawer
            open={isDrawerOpen}
            direction="right"
            onOpenChange={setIsDrawerOpen}
          >
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="!bg-foreground/25 border-border hover:!bg-foreground/30 backdrop-blur-sm shadow-lg gap-x-1"
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                History
              </Button>
            </DrawerTrigger>
            <DrawerContent hideOverlay className="w-80 max-w-[80vw]">
              <DrawerHeader>
                <DrawerTitle>History & Details</DrawerTitle>
              </DrawerHeader>

              <div className="flex-1 p-4 overflow-y-auto">
                {/* Main Result Thumbnail */}
                {action === "video-walkthrough" && renderResult.video?.url ? (
                  <div className="relative group cursor-pointer mb-6">
                    <div className="w-full aspect-square bg-muted rounded-lg border-2 border-primary shadow-lg flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-primary"
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
                    <div className="absolute inset-0 bg-primary/10 rounded-lg"></div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs text-foreground font-medium truncate">
                        Current Video
                      </p>
                    </div>
                  </div>
                ) : (
                  (selectedLibraryImage || uploadedImage) && (
                    <div className="relative group cursor-pointer mb-6">
                      <img
                        src={
                          selectedLibraryImage ||
                          (uploadedImage
                            ? URL.createObjectURL(uploadedImage)
                            : "")
                        }
                        alt="Original plan image"
                        className="w-full aspect-square object-contain rounded-lg border-2 border-primary shadow-lg bg-background"
                      />
                      <div className="absolute inset-0 bg-primary/10 rounded-lg"></div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs text-foreground font-medium truncate bg-background/80 rounded px-2 py-1">
                          Original Plan
                        </p>
                      </div>
                    </div>
                  )
                )}

                {/* History Section */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-foreground">
                      History
                    </h4>
                    <button
                      onClick={handleClearHistory}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-3">
                    {history.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No history yet
                      </p>
                    ) : (
                      history.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            handleSelectHistoryItem(item);
                            setIsDrawerOpen(false);
                          }}
                          className={`relative group cursor-pointer rounded-lg p-3 border transition-all ${
                            currentResult?.id === item.id
                              ? "bg-primary/10 border-primary/30"
                              : "bg-background hover:bg-muted/50 border-border"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {item.renderedImageUrl ? (
                              // Check if this is a video or image based on file extension or other heuristics
                              item.renderedImageUrl.endsWith(".mp4") ||
                              item.renderedImageUrl.endsWith(".webm") ||
                              item.renderedImageUrl.endsWith(".mov") ? (
                                // Video thumbnail
                                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                  <svg
                                    className="w-5 h-5 text-muted-foreground"
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
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-muted-foreground"
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
                              <p className="text-sm font-medium text-foreground truncate">
                                {item.description.substring(0, 30)}...
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span className="bg-muted px-2 py-0.5 rounded">
                                  {item.action}
                                </span>
                                <span>{item.model}</span>
                                {item.style && (
                                  <>
                                    <span>•</span>
                                    <span>{item.style}</span>
                                  </>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(item.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Download Section removed; download now on result media */}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      )}
      {/* Header - Only show when not submitted */}
      <AnimatePresence>
        {!hasSubmitted && !renderResult && (
          <motion.div
            className="flex flex-col items-center justify-center min-h-[70svh] text-center "
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6 }}
          >
            <div className="max-w-4xl mx-auto px-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Transform <span className="text-blue-500">Floor Plans</span>{" "}
                Into
                <span className="block mt-2">Photorealistic 3D Views</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
                AI-powered architectural visualization that converts <br /> 2D
                plans into stunning 3D renders
              </p>

              {/* History Button - Show when page is empty but there's history */}
              {history.length > 0 && (
                <div className="mb-6">
                  <Drawer
                    direction="right"
                    open={isDrawerOpen}
                    onOpenChange={setIsDrawerOpen}
                  >
                    <DrawerTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-background/80 border-border hover:bg-muted/50"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        View History ({history.length})
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent hideOverlay className="w-80 max-w-[80vw]">
                      <DrawerHeader>
                        <DrawerTitle>History</DrawerTitle>
                      </DrawerHeader>

                      <div className="flex-1 p-4 overflow-y-auto">
                        <div className="space-y-3">
                          {history.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                handleSelectHistoryItem(item);
                                setIsDrawerOpen(false);
                              }}
                              className="relative group cursor-pointer rounded-lg p-3 border bg-background hover:bg-muted/50 border-border transition-all"
                            >
                              <div className="flex items-start gap-3">
                                {item.renderedImageUrl ? (
                                  item.renderedImageUrl.endsWith(".mp4") ||
                                  item.renderedImageUrl.endsWith(".webm") ||
                                  item.renderedImageUrl.endsWith(".mov") ? (
                                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                      <svg
                                        className="w-5 h-5 text-muted-foreground"
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
                                    <img
                                      src={item.renderedImageUrl}
                                      alt="Thumbnail"
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                  )
                                ) : (
                                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                    <svg
                                      className="w-5 h-5 text-muted-foreground"
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
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {item.description.substring(0, 30)}...
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <span className="bg-muted px-2 py-0.5 rounded">
                                      {item.action}
                                    </span>
                                    <span>{item.model}</span>
                                    {item.style && (
                                      <>
                                        <span>•</span>
                                        <span>{item.style}</span>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(item.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </DrawerContent>
                  </Drawer>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div
        className={`transition-all duration-1000 flex-1 overflow-hidden ${
          hasSubmitted && renderResult ? "flex flex-col" : "hidden"
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
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Main Content Area */}
              <div className="flex-1 flex items-center justify-center p-8 bg-background">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="relative max-w-4xl max-h-full"
                >
                  {/* Video Preview */}
                  {renderResult.video?.url ? (
                    <div className="w-full max-h-[60vh] group">
                      <video
                        src={renderResult.video.url}
                        controls
                        className="w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-2xl border border-border"
                      />
                      {/* Download overlay with tooltip */}
                      <div className="absolute top-3 right-3">
                        <a
                          href={renderResult.video.url}
                          download={renderResult.video.file_name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md bg-secondary/80 text-secondary-foreground hover:bg-secondary p-2 shadow transition-opacity opacity-90"
                          aria-label="Download"
                          title="Download"
                        >
                          <img
                            src="/download.svg"
                            alt="Download"
                            className="w-4 h-4"
                          />
                        </a>
                      </div>
                    </div>
                  ) : renderResult.media?.absoluteUrl ? (
                    /* Image Preview */
                    <div className="relative w-full max-h-[60vh]">
                      <img
                        src={renderResult.media.absoluteUrl}
                        alt="Generated 3D render"
                        className="w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-2xl border border-border"
                      />
                      <div className="absolute top-3 right-3">
                        <a
                          href={renderResult.media.absoluteUrl}
                          download={renderResult.media.filename}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md bg-secondary/80 text-secondary-foreground hover:bg-secondary p-2 shadow transition-opacity opacity-90"
                          aria-label="Download"
                          title="Download"
                        >
                          <img
                            src="/download.svg"
                            alt="Download"
                            className="w-4 h-4"
                          />
                        </a>
                      </div>
                    </div>
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
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Form - Positioned based on submission state */}
      <motion.div
        layout
        initial={{ y: 0 }}
        animate={{
          y: hasSubmitted ? 0 : 0,
          scale: 1,
        }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
          duration: 0.8,
        }}
        className={`${
          hasSubmitted
            ? "fixed bottom-6 left-1/2 -translate-x-1/2"
            : "relative mx-auto mt-6"
        } z-50 flex flex-col items-center transition-all duration-800`}
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
                {action === "video-walkthrough"
                  ? "Generating video walkthrough..."
                  : "Generating 3D View..."}
              </p>
            </div>

            {/* Loading Stages */}
            <div className="space-y-3">
              {[
                "Analyzing room structure...",
                "Reading walls and windows...",
                "Detecting furniture placement...",
                "Calculating camera angles...",
                "Rendering 3D environment...",
              ].map((stageText, index) => {
                const isActive = loadingStage === index;
                const isCompleted = loadingStage > index;

                return (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isCompleted
                          ? "bg-green-500 border-green-500"
                          : isActive
                            ? "border-blue-500 bg-blue-500/20"
                            : "border-gray-400"
                      }`}
                    >
                      {isCompleted && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {isActive && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        isCompleted
                          ? "text-green-600 font-medium"
                          : isActive
                            ? "text-blue-600 font-medium"
                            : "text-gray-500"
                      }`}
                    >
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
