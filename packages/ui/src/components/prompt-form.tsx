"use client";

import {
  HelpCircleIcon,
  PlusIcon,
  UploadIcon,
  ImageIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Textarea } from "./textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

interface PromptFormProps {
  className?: string;
  onImageUpload?: (file: File) => void;
  onImageSelect?: (imageUrl: string) => void;
  onDescriptionChange?: (description: string) => void;
  onSubmit?: (action: "render" | "video-walkthrough" | "360-view") => void;
  defaultDescription?: string;
  model?: string;
  onModelChange?: (model: string) => void;
  style?: string;
  onStyleChange?: (style: string) => void;
  isLoading?: boolean;
  // Public images props
  publicImages?: Array<{ id: string; url: string }>;
  onAddPublicImage?: (url: string) => void;
  onRemovePublicImage?: (id: string) => void;
  onPublicImageSelect?: (url: string) => void;
  // Action prop
  action?: "render" | "video-walkthrough" | "360-view";
  onActionChange?: (
    action: "render" | "video-walkthrough" | "360-view"
  ) => void;
}

function PromptForm({
  className,
  onImageUpload,
  onImageSelect,
  onDescriptionChange,
  onSubmit,
  defaultDescription = "",
  model = "nano-banana",
  onModelChange,
  style = "japandi",
  onStyleChange,
  isLoading = false,
  // Public images props
  publicImages = [],
  onAddPublicImage,
  onRemovePublicImage,
  onPublicImageSelect,
  // Action prop
  action = "render",
  onActionChange,
}: PromptFormProps) {
  const [description, setDescription] = React.useState(defaultDescription);
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [selectedLibraryImage, setSelectedLibraryImage] = React.useState<
    string | null
  >(null);
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"library" | "public">(
    "library"
  );
  const [publicImageUrl, setPublicImageUrl] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Update local state when props change
  React.useEffect(() => {
    setDescription(defaultDescription);
  }, [defaultDescription]);

  // Library images
  const libraryImages = [
    {
      id: "washroom",
      url: "https://ik.imagekit.io/nf8uqfojx/2d%20plan/Toilet.png",
      title: "Washroom",
      tags: ["render"],
    },
    {
      id: "bedroom",
      url: "https://ik.imagekit.io/nf8uqfojx/2d%20plan/BedRoom.png",
      title: "Bedroom",
      tags: ["render"],
    },
    {
      id: "kitchen",
      url: "https://ik.imagekit.io/nf8uqfojx/2d%20plan/Kitchen.png",
      title: "Kitchen Test",
      tags: ["render"],
    },
    {
      id: "kitchen2",
      url: "https://ik.imagekit.io/nf8uqfojx/2d%20plan/Kitchen2.png",
      title: "Kitchen 2",
      tags: ["render"],
    },
    {
      id: "kitchen3",
      url: "https://ik.imagekit.io/nf8uqfojx/2d%20plan/Kitchen3.png",
      title: "Kitchen 3",
      tags: ["render"],
    },
    {
      id: "washroom2",
      url: "https://ik.imagekit.io/nf8uqfojx/2d%20plan/Bathroom2.png",
      title: "Washroom",
      tags: ["render"],
    },
  ];

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleLibraryImageSelect = (imageUrl: string) => {
    setSelectedLibraryImage(imageUrl);
    setSelectedImage(null); // Clear file upload when library image is selected
    onImageSelect?.(imageUrl);
    setIsLibraryOpen(false);
  };

  const handlePublicImageSelect = (imageUrl: string) => {
    setSelectedLibraryImage(imageUrl);
    setSelectedImage(null); // Clear file upload when public image is selected
    onPublicImageSelect?.(imageUrl);
    onImageSelect?.(imageUrl);
    setIsLibraryOpen(false);
  };

  const handleAddPublicImage = () => {
    if (publicImageUrl.trim() && isValidUrl(publicImageUrl)) {
      onAddPublicImage?.(publicImageUrl);
      setPublicImageUrl("");
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleRemoveImage = () => {
    setSelectedLibraryImage(null);
    setSelectedImage(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      onImageUpload?.(file);
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    onDescriptionChange?.(value);
  };

  const handleActionChange = (
    value: "render" | "video-walkthrough" | "360-view"
  ) => {
    // Set default model based on action
    if (value === "video-walkthrough" && onModelChange) {
      onModelChange("fal-minimax");
    } else if (value === "render" && onModelChange) {
      onModelChange("nano-banana");
    }
    // Call the prop handler if provided
    onActionChange?.(value);
  };

  const handleFormSubmit = () => {
    onSubmit?.(action);
  };

  const models = [
    { value: "nano-banana", label: "Nano Banana" },
    { value: "fal-minimax", label: "Fal Minimax" },
  ];

  const architecturalStyles = [
    { value: "zen", label: "Zen" },
    { value: "scandinavian", label: "Scandinavian" },
    { value: "japandi", label: "Japandi" },
    { value: "minimalist", label: "Minimalist" },
    { value: "industrial", label: "Industrial" },
    { value: "bohemian", label: "Bohemian" },
    { value: "mediterranean", label: "Mediterranean" },
    { value: "rustic", label: "Rustic" },
    { value: "modern", label: "Modern" },
    { value: "contemporary", label: "Contemporary" },
  ];

  const actions = [
    { value: "render", label: "Render Image" },
    { value: "video-walkthrough", label: "Video Walkthrough" },
    { value: "360-view", label: "360 View Generation", disabled: true },
  ];

  return (
    <div className={cn("flex justify-center w-full", className)}>
      {/* Compact Floating Form */}
      <div
        className="relative rounded-2xl border border-border shadow-2xl p-3 !bg-muted/80 max-w-4xl min-w-2xl"
        style={{
          backgroundColor: "hsl(var(--card))",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {/* Two Row Layout */}
        <div className="space-y-3">
          {/* First Row: Image + Text Input */}
          <div className="flex items-center gap-3">
            {/* Image Preview or Plus Icon */}
            <div className="relative flex-shrink-0">
              {selectedLibraryImage || selectedImage ? (
                <>
                  {/* Clickable Image Preview */}
                  <button
                    onClick={() => setIsLibraryOpen(true)}
                    className="relative h-12 w-12 rounded-xl overflow-hidden border border-border hover:border-primary transition-all duration-200 group"
                  >
                    <img
                      src={
                        selectedLibraryImage ||
                        (selectedImage
                          ? URL.createObjectURL(selectedImage)
                          : "")
                      }
                      alt="Selected image"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all duration-200"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <ImageIcon className="w-4 h-4 text-white" />
                    </div>
                  </button>
                  {/* Cross Button - Outside the image */}
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background text-foreground hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 flex items-center justify-center shadow-md border border-border z-10"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>

                  {/* Library Dialog for changing image */}
                  <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                      <DialogHeader>
                        <DialogTitle>Choose Image</DialogTitle>
                      </DialogHeader>

                      {/* Tabs */}
                      <div className="flex border-b border-border">
                        <button
                          className={`py-2 px-4 text-sm font-medium ${
                            activeTab === "library"
                              ? "border-b-2 border-primary text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          onClick={() => setActiveTab("library")}
                        >
                          Library
                        </button>
                        <button
                          className={`py-2 px-4 text-sm font-medium ${
                            activeTab === "public"
                              ? "border-b-2 border-primary text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          onClick={() => setActiveTab("public")}
                        >
                          Public Image URL
                        </button>
                      </div>

                      {/* Tab Content */}
                      <div className="max-h-[60vh] overflow-y-auto p-2">
                        {activeTab === "library" ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {libraryImages.map((image) => (
                              <button
                                key={image.id}
                                onClick={() =>
                                  handleLibraryImageSelect(image.url)
                                }
                                className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-200 focus:outline-none focus:border-primary"
                              >
                                <img
                                  src={image.url}
                                  alt={image.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-end">
                                  <div className="p-2 text-white bg-background/80 w-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    {image.title}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Add new public image */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={publicImageUrl}
                                onChange={(e) =>
                                  setPublicImageUrl(e.target.value)
                                }
                                placeholder="Enter image URL"
                                className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                              <Button
                                onClick={handleAddPublicImage}
                                disabled={
                                  !publicImageUrl.trim() ||
                                  !isValidUrl(publicImageUrl)
                                }
                                className="bg-foreground/20 text-foreground hover:!bg-foreground/30"
                              >
                                Add
                              </Button>
                            </div>

                            {/* Public images list */}
                            {publicImages.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {publicImages.map((image) => (
                                  <button
                                    key={image.id}
                                    onClick={() =>
                                      handlePublicImageSelect(image.url)
                                    }
                                    className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-200 focus:outline-none focus:border-primary"
                                  >
                                    <img
                                      src={image.url}
                                      alt="Public image"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-end">
                                      <div className="p-2 text-white bg-background/80 w-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        Added Image
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <p>No public images added yet</p>
                                <p className="text-sm mt-1">
                                  Add image URLs to use them in your renders
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                /* Plus Icon Dropdown */
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-foreground/20 text-foreground hover:!bg-foreground/30 cursor-pointer hover:text-foreground active:bg-foreground/30 focus:bg-foreground/20 focus:text-foreground h-12 w-12 p-0 rounded-xl transition-all duration-200 flex-shrink-0"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-xl border-border shadow-2xl bg-popover/90 backdrop-blur-md">
                    <DropdownMenuItem
                      onClick={handleFileUpload}
                      disabled
                      className="text-muted-foreground focus:bg-accent focus:text-accent-foreground rounded-lg transition-all duration-150 opacity-50 cursor-not-allowed"
                    >
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Upload (Coming Soon)
                    </DropdownMenuItem>
                    <Dialog
                      open={isLibraryOpen}
                      onOpenChange={setIsLibraryOpen}
                    >
                      <DialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setIsLibraryOpen(true);
                          }}
                          className="text-foreground focus:bg-accent focus:text-accent-foreground rounded-lg transition-all duration-150"
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Choose from Library
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                        <DialogHeader>
                          <DialogTitle>Choose Image</DialogTitle>
                        </DialogHeader>

                        {/* Tabs */}
                        <div className="flex border-b border-border">
                          <button
                            className={`py-2 px-4 text-sm font-medium ${
                              activeTab === "library"
                                ? "border-b-2 border-primary text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() => setActiveTab("library")}
                          >
                            Library
                          </button>
                          <button
                            className={`py-2 px-4 text-sm font-medium ${
                              activeTab === "public"
                                ? "border-b-2 border-primary text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() => setActiveTab("public")}
                          >
                            Public Image URL
                          </button>
                        </div>

                        {/* Tab Content */}
                        <div className="max-h-[60vh] overflow-y-auto p-2">
                          {activeTab === "library" ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {libraryImages.map((image) => (
                                <button
                                  key={image.id}
                                  onClick={() =>
                                    handleLibraryImageSelect(image.url)
                                  }
                                  className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-200 focus:outline-none focus:border-primary"
                                >
                                  <img
                                    src={image.url}
                                    alt={image.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-end">
                                    <div className="p-2 text-white bg-background/80 w-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      {image.title}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Add new public image */}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={publicImageUrl}
                                  onChange={(e) =>
                                    setPublicImageUrl(e.target.value)
                                  }
                                  placeholder="Enter image URL"
                                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <Button
                                  onClick={handleAddPublicImage}
                                  disabled={
                                    !publicImageUrl.trim() ||
                                    !isValidUrl(publicImageUrl)
                                  }
                                  className="bg-foreground/20 text-foreground hover:!bg-foreground/30"
                                >
                                  Add
                                </Button>
                              </div>

                              {/* Public images list */}
                              {publicImages.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  {publicImages.map((image) => (
                                    <button
                                      key={image.id}
                                      onClick={() =>
                                        handlePublicImageSelect(image.url)
                                      }
                                      className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-200 focus:outline-none focus:border-primary"
                                    >
                                      <img
                                        src={image.url}
                                        alt="Public image"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-end">
                                        <div className="p-2 text-white bg-background/80 w-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                          Added Image
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                  <p>No public images added yet</p>
                                  <p className="text-sm mt-1">
                                    Add image URLs to use them in your renders
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Prompt Text Input */}
            <Textarea
              placeholder="Create a 3d view of the given room plan"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleDescriptionChange(e.target.value)
              }
              className="flex-1 !bg-transparent border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl resize-none h-12 px-3 py-3 text-sm"
            />
          </div>

          {/* Second Row: Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Action Selector */}
              <Select value={action} onValueChange={handleActionChange}>
                <SelectTrigger className="w-fit min-w-[140px] border border-border bg-transparent text-foreground h-10 px-3 rounded-xl focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200">
                  <SelectValue className="text-sm" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-2xl bg-popover">
                  {actions.map((actionOption) => (
                    <SelectItem
                      key={actionOption.value}
                      value={actionOption.value}
                      disabled={actionOption.disabled}
                      className="text-popover-foreground focus:bg-accent focus:text-accent-foreground rounded-lg transition-all duration-150"
                    >
                      {actionOption.label}
                      {actionOption.disabled && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Coming Soon)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Model Selector */}
              <Select value={model} onValueChange={onModelChange}>
                <SelectTrigger className="w-fit min-w-[120px] border border-border bg-transparent text-foreground h-10 px-3 rounded-xl focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200">
                  <SelectValue className="text-sm" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-2xl bg-popover">
                  {models
                    .filter((modelOption) => {
                      // Show Nano Banana only for render action
                      if (modelOption.value === "nano-banana") {
                        return action === "render";
                      }
                      // Show Fal Minimax only for video-walkthrough action
                      if (modelOption.value === "fal-minimax") {
                        return action === "video-walkthrough";
                      }
                      // For 360-view, we might want to show appropriate models
                      return action === "360-view";
                    })
                    .map((modelOption) => (
                      <SelectItem
                        key={modelOption.value}
                        value={modelOption.value}
                        className="text-popover-foreground focus:bg-accent focus:text-accent-foreground rounded-lg transition-all duration-150"
                      >
                        {modelOption.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* Style Selector - Only show for render action */}
              {action === "render" && (
                <Select value={style} onValueChange={onStyleChange}>
                  <SelectTrigger className="w-fit min-w-[100px] border border-border bg-transparent text-foreground h-10 px-3 rounded-xl focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200">
                    <SelectValue className="text-sm" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border shadow-2xl bg-popover">
                    {architecturalStyles.map((styleOption) => (
                      <SelectItem
                        key={styleOption.value}
                        value={styleOption.value}
                        className="text-popover-foreground focus:bg-accent focus:text-accent-foreground rounded-lg transition-all duration-150"
                      >
                        {styleOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Help Button */}
              {/* <Button
                variant="ghost"
                size="sm"
                className="bg-foreground/20 text-foreground hover:!bg-foreground/30 hover:text-foreground active:bg-foreground/30 focus:bg-foreground/20 focus:text-foreground border-none h-8 w-8 p-0 rounded-lg transition-all duration-200"
              >
                <HelpCircleIcon className="w-4 h-4" />
              </Button> */}

              {/* Submit/Arrow Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFormSubmit}
                disabled={
                  isLoading ||
                  !description.trim() ||
                  (!selectedLibraryImage && !selectedImage)
                }
                className="bg-foreground/20 text-foreground hover:!bg-foreground/30 hover:text-foreground active:bg-foreground/30 focus:bg-foreground/20 focus:text-foreground border-none h-12 w-12 p-0 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                ) : (
                  <svg
                    className="w-8 h-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M7 17L17 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 7h10v10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

export { PromptForm, type PromptFormProps };
