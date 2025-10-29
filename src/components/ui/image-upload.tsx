"use client"

import { UploadCloud, X, Check, Download } from "lucide-react"
import Image from "next/image"
import * as React from "react"
import { useDropzone, type DropzoneOptions } from "react-dropzone"
import { twMerge } from "tailwind-merge"
import Cropper from "react-easy-crop"
import type { Area, Point } from "react-easy-crop"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"

type ImageUploadProps = {
  name: string
  value?: File | null
  onChange: (file: File | null) => void
  className?: string
  dropzoneOptions?: DropzoneOptions
  t: (key: string) => string
}

const ImageUpload = React.forwardRef<HTMLDivElement, ImageUploadProps>(
  ({ value, onChange, className, dropzoneOptions, t }, ref) => {
    const [tempImage, setTempImage] = React.useState<string | null>(null)
    const [tempFile, setTempFile] = React.useState<File | null>(null)
    const [showCropModal, setShowCropModal] = React.useState(false)
    const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 })
    const [zoom, setZoom] = React.useState(1)
    const [maxZoom, setMaxZoom] = React.useState(3)
    const [croppedAreaPixels, setCroppedAreaPixels] =
      React.useState<Area | null>(null)

    const onDrop = React.useCallback((acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setTempImage(e.target?.result as string)
          setTempFile(file)
          setShowCropModal(true)
          setCrop({ x: 0, y: 0 })
          setZoom(1)
        }
        reader.readAsDataURL(file)
      }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        "image/*": [],
      },
      maxSize: 1024 * 1024 * 2, // 2MB
      multiple: false,
      ...dropzoneOptions,
    })

    const onCropComplete = React.useCallback(
      (croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
      },
      []
    )

    const onMediaLoaded = React.useCallback(
      (mediaSize: { width: number; height: number }) => {
        // Set initial zoom to 1 (100%) and calculate appropriate max zoom
        // The cropper will handle the initial positioning
        const initialZoom = 1

        // Calculate max zoom based on image dimensions relative to cropper size
        const cropperHeight = 300
        const cropperWidth = 512

        // Calculate how much we can zoom before the image becomes too large
        const maxZoomX = (cropperWidth * 2) / mediaSize.width
        const maxZoomY = (cropperHeight * 2) / mediaSize.height
        const calculatedMaxZoom = Math.max(maxZoomX, maxZoomY, 3)

        setZoom(initialZoom)
        setMaxZoom(calculatedMaxZoom)
      },
      []
    )

    // Helper function to create cropped image
    const createImage = (url: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const image = document.createElement("img") as HTMLImageElement
        image.addEventListener("load", () => resolve(image))
        image.addEventListener("error", (error: Event) => reject(error))
        image.setAttribute("crossOrigin", "anonymous")
        image.src = url
      })

    const getCroppedImg = async (
      imageSrc: string,
      pixelCrop: Area
    ): Promise<File> => {
      const image = await createImage(imageSrc)
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("No 2d context")
      }

      // Set canvas size to match the crop area
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height

      // Create circular clipping path
      ctx.save()
      ctx.beginPath()
      ctx.arc(
        pixelCrop.width / 2,
        pixelCrop.height / 2,
        pixelCrop.width / 2,
        0,
        2 * Math.PI
      )
      ctx.clip()

      // Draw the cropped image
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )

      ctx.restore()

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              throw new Error("Canvas is empty")
            }
            const file = new File([blob], "icon.png", { type: "image/png" })
            resolve(file)
          },
          "image/png",
          1.0
        )
      })
    }

    const downloadCroppedImage = async () => {
      if (tempImage && croppedAreaPixels) {
        try {
          const croppedFile = await getCroppedImg(tempImage, croppedAreaPixels)
          const url = URL.createObjectURL(croppedFile)
          const link = document.createElement("a")
          link.download = "cropped-profile-image.png"
          link.href = url
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        } catch (error) {
          console.error("Error downloading image:", error)
        }
      }
    }

    const handleCrop = async () => {
      if (tempImage && croppedAreaPixels) {
        try {
          const croppedFile = await getCroppedImg(tempImage, croppedAreaPixels)
          onChange(croppedFile)
          setShowCropModal(false)
          setTempImage(null)
          setTempFile(null)
          setCroppedAreaPixels(null)
        } catch (error) {
          console.error("Error cropping image:", error)
        }
      }
    }

    const handleCancelCrop = () => {
      setShowCropModal(false)
      setTempImage(null)
      setTempFile(null)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    }

    return (
      <>
        <div
          {...getRootProps()}
          ref={ref}
          className={twMerge(
            "relative flex h-32 w-32 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-400 dark:hover:bg-gray-700 md:h-36 md:w-36",
            isDragActive &&
              "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-gray-700",
            className
          )}
        >
          <input {...getInputProps()} />
          {value ? (
            <>
              <div className="absolute inset-0 rounded-full border border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-inner">
                <div className="absolute inset-1 rounded-full border border-white/50 dark:border-gray-600 bg-white dark:bg-gray-900 overflow-hidden">
                  <Image
                    src={
                      value instanceof File ? URL.createObjectURL(value) : ""
                    }
                    alt="Uploaded image"
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7 rounded-full z-10 shadow-lg"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation()
                  onChange(null)
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">{t("Remove image")}</span>
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center text-gray-500 dark:text-gray-400">
              <UploadCloud className="h-6 w-6 md:h-7 md:w-7" />
              <p className="text-xs sm:text-sm">
                {isDragActive
                  ? t("Drop the image here")
                  : t("Drag & drop or click to upload")}
              </p>
            </div>
          )}
        </div>

        <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("Crop your profile image")}</DialogTitle>
            </DialogHeader>
            <div className="relative h-[300px] w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              {tempImage && (
                <Cropper
                  image={tempImage}
                  crop={crop}
                  zoom={zoom}
                  maxZoom={maxZoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  onMediaLoaded={onMediaLoaded}
                  style={{
                    containerStyle: {
                      background: "transparent",
                    },
                    mediaStyle: {
                      boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1)",
                      borderRadius: "8px",
                    },
                  }}
                />
              )}
            </div>

            {/* Zoom control slider */}
            <div className="space-y-2 px-4">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {t("zoom")}: {Math.round(zoom * 100)}%
                </span>
                <span className="text-xs">
                  ({Math.round(maxZoom * 100)}% {t("max")})
                </span>
              </div>
              <Slider
                value={[zoom]}
                min={1}
                max={maxZoom}
                step={0.1}
                onValueChange={(value: number[]) => setZoom(value[0])}
                className="w-full"
              />
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={downloadCroppedImage}
                disabled={!croppedAreaPixels}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {t("download")}
              </Button>
              <Button variant="outline" onClick={handleCancelCrop}>
                {t("cancel")}
              </Button>
              <Button onClick={handleCrop} disabled={!croppedAreaPixels}>
                <Check className="mr-2 h-4 w-4" />
                {t("applyCrop")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }
)

ImageUpload.displayName = "ImageUpload"

export { ImageUpload }
