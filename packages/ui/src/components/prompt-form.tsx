"use client"

import { HelpCircleIcon, PlusIcon, UploadIcon, ImageIcon, XIcon } from "lucide-react"
import * as React from "react"
import { cn } from "../lib/utils"
import { Button } from "./button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Textarea } from "./textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./dialog"

interface PromptFormProps {
  className?: string
  onImageUpload?: (file: File) => void
  onImageSelect?: (imageUrl: string) => void
  onDescriptionChange?: (description: string) => void
  onSubmit?: () => void
  defaultDescription?: string
  model?: string
  onModelChange?: (model: string) => void
  style?: string
  onStyleChange?: (style: string) => void
  isLoading?: boolean
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
}: PromptFormProps) {
  const [description, setDescription] = React.useState(defaultDescription)
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null)
  const [selectedLibraryImage, setSelectedLibraryImage] = React.useState<string | null>(null)
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Library images
  const libraryImages = [
    {
      id: 'washroom',
      url: 'https://media.discordapp.net/attachments/1393277866690478110/1413808691940954223/BathRoom.png?ex=68bd4773&is=68bbf5f3&hm=33991d25f72d1a6c5c07625e9091f79948350706940afe9b5bd8d5afcd3e9734&=&format=webp&quality=lossless&width=1715&height=1483',
      title: 'Washroom'
    },
    {
      id: 'bedroom',
      url: 'https://media.discordapp.net/attachments/1393277866690478110/1413808693006307410/BedRoom.png?ex=68bd4773&is=68bbf5f3&hm=839a83be4ab9ff57346ccb730b24d627e530738f8db22221180d378784fda34d&=&format=webp&quality=lossless&width=1390&height=1483',
      title: 'Bedroom'
    },
    {
      id: 'drawingroom',
      url: 'https://media.discordapp.net/attachments/1393277866690478110/1413842013874425866/DrawingRoom.png?ex=68bd667c&is=68bc14fc&hm=4f61a731043df51771c36c52117817d4e0baf334cfb531546b625df5ad5410bb&=&format=webp&quality=lossless&width=1510&height=1670',
      title: 'Drawing Room'
    },
    {
      id: 'kitchen',
      url: 'https://media.discordapp.net/attachments/1393277866690478110/1413808694143090739/Kitchen.png?ex=68bd4773&is=68bbf5f3&hm=a4bdce0ede5505ee4be485c8988fa04d7fc164d5200e37c7fe85ec609208d351&=&format=webp&quality=lossless&width=1921&height=1483',
      title: 'Kitchen'
    },
    {
      id: 'kitchen2',
      url: 'https://media.discordapp.net/attachments/1393277866690478110/1413808694742749285/Kitchen2.png?ex=68bd4774&is=68bbf5f4&hm=2801900301c5349c570b4cb0912cd48c8789b810d0f76789751a724466d09542&=&format=webp&quality=lossless&width=1440&height=1354',
      title: 'Kitchen 2'
    },
    {
      id: 'kitchen3',
      url: 'https://media.discordapp.net/attachments/1393277866690478110/1413808695372152974/Kitchen3.png?ex=68bd4774&is=68bbf5f4&hm=2f48c6088f656b6c7e66b4e9f525e0b7855104364175c28ecb52c3d7a32c92fe&=&format=webp&quality=lossless&width=1012&height=1483',
      title: 'Kitchen 3'
    },
    {
      id: 'washroom2',
      url: 'https://media.discordapp.net/attachments/1393277866690478110/1413808695736926268/Toilet.png?ex=68bd4774&is=68bbf5f4&hm=85cb65f4e6392948d99c2ecf6d95e3617f3bc80e1d6a3f4294fda682da289708&=&format=webp&quality=lossless&width=810&height=1483',
      title: 'Washroom'
    }
  ]

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleLibraryImageSelect = (imageUrl: string) => {
    setSelectedLibraryImage(imageUrl)
    setSelectedImage(null) // Clear file upload when library image is selected
    onImageSelect?.(imageUrl)
    setIsLibraryOpen(false)
  }

  const handleRemoveImage = () => {
    setSelectedLibraryImage(null)
    setSelectedImage(null)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      onImageUpload?.(file)
    }
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    onDescriptionChange?.(value)
  }

  const models = [
    { value: "nano-banana", label: "Nano Banana" },
  ]

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
  ]

  return (
    <div className={cn(
      "flex flex-col gap-6 w-full max-w-4xl mx-auto",
      className
    )}>
      {/* Main Glassmorphism Container with Better Visibility */}
      <div 
        className="relative rounded-2xl border border-border shadow-2xl p-4 !bg-muted"
        style={{
          backgroundColor: 'hsl(var(--card))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
      >
        {/* Image Preview Section */}
        {(selectedLibraryImage || selectedImage) && (
          <div className="mb-4 flex items-center gap-3">
            <div className="relative">
              <img
                src={selectedLibraryImage || (selectedImage ? URL.createObjectURL(selectedImage) : '')}
                alt="Selected image preview"
                className="w-16 h-16 rounded-lg object-cover border border-border shadow-sm"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-all duration-200 flex items-center justify-center text-xs font-medium shadow-sm"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">
                {selectedLibraryImage ? 'Library Image' : 'Uploaded File'}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedLibraryImage ? 'From image library' : selectedImage?.name}
              </p>
            </div>
          </div>
        )}

        {/* Input Row with Plus Icon Dropdown */}
        <div className="flex items-start gap-3 mb-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="bg-foreground/20 relative -top-1 text-foreground hover:bg-foreground/20 hover:text-foreground active:bg-foreground/30 focus:bg-foreground/20 focus:text-foreground h-8 w-8 p-0 rounded-full transition-all duration-200"
              >
                <PlusIcon className="w-4 h-4" />
                {(selectedImage || selectedLibraryImage) && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full border border-background"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="rounded-xl border-border shadow-2xl"
              style={{
                backgroundColor: 'rgba(40, 42, 54, 0.9)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
            >
              <DropdownMenuItem 
                onClick={handleFileUpload}
                disabled
                className="text-muted-foreground focus:bg-accent focus:text-accent-foreground rounded-lg transition-all duration-150 opacity-50 cursor-not-allowed"
              >
                <UploadIcon className="w-4 h-4 mr-2" />
                Upload (Coming Soon)
              </DropdownMenuItem>
              <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault()
                      setIsLibraryOpen(true)
                    }}
                    className="text-foreground focus:bg-accent focus:text-accent-foreground rounded-lg transition-all duration-150"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Choose from Library
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Choose from Image Library</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
                    {libraryImages.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => handleLibraryImageSelect(image.url)}
                        className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-200 focus:outline-none focus:border-primary"
                      >
                        <img
                          src={image.url}
                          alt={image.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-end">
                          <div className="p-2 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {image.title}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
          <Textarea
            placeholder="Describe your image..."
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleDescriptionChange(e.target.value)}
            className={cn("flex-1 !bg-transparent border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-base font-normal")}
          />
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">

            {/* Model Selector with Better Contrast */}
            <Select value={model} onValueChange={onModelChange}>
              <SelectTrigger className="w-fit min-w-[100px] !bg-foreground/20 border-none text-foreground hover:!bg-foreground/30 hover:text-foreground active:bg-foreground/30 focus:bg-foreground/20 focus:text-foreground h-8 px-3 rounded-full focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200">
                <SelectValue className="text-sm" />
              </SelectTrigger>
              <SelectContent 
                className="rounded-xl border-border shadow-2xl bg-popover"
              >
                {models.map((modelOption) => (
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

            {/* Style Selector with Better Contrast */}
            <Select value={style} onValueChange={onStyleChange}>
              <SelectTrigger className="w-fit min-w-[80px] !bg-foreground/20 border-none text-foreground hover:!bg-foreground/30 hover:text-foreground active:bg-foreground/30 focus:bg-foreground/20 focus:text-foreground h-8 px-3 rounded-full focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200">
                <SelectValue className="text-sm" />
              </SelectTrigger>
              <SelectContent 
                className="rounded-xl border-border shadow-2xl bg-popover"
              >
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
          </div>

          <div className="flex items-center gap-1">
            {/* Help Button */}
            <Button
              variant="ghost"
              size="sm"
              className="bg-foreground/20 text-foreground hover:bg-foreground/20 hover:text-foreground active:bg-foreground/30 focus:bg-foreground/20 focus:text-foreground border-none h-8 w-8 p-0 rounded-full transition-all duration-200"
            >
              <HelpCircleIcon className="w-4 h-4" />
            </Button>

            {/* Submit/Arrow Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSubmit}
              disabled={isLoading || !description.trim() || (!selectedLibraryImage && !selectedImage)}
              className="bg-foreground/20 text-foreground hover:bg-foreground/20 hover:text-foreground active:bg-foreground/30 focus:bg-foreground/20 focus:text-foreground border-none h-8 w-8 p-0 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17L17 7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 7h10v10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { PromptForm, type PromptFormProps }
