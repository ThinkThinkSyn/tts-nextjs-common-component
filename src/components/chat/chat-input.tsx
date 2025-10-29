"use client"

import { ImagePreviewModal } from "./ImagePreviewModal"
import { SpeechToTextButton } from "./speech-to-text-button"
import { Button } from "@/components/ui/button"
import { twMerge } from "tailwind-merge"
import { IChatMedia } from "@/types/chat.type"
import {
  Send,
  Paperclip,
  Square,
  X,
  ImageIcon,
  FileText,
  Video,
  Music,
  File,
} from "lucide-react"
import Image from "next/image"
import { useState, useRef, forwardRef, useCallback, memo } from "react"
import TextareaAutosize from "react-textarea-autosize"
import { toast } from "sonner"

// Enhanced media interface to include file metadata
interface ChatMedia extends IChatMedia {
  fileName?: string
  fileSize?: number
  fileType?: string
}

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string, attachments?: IChatMedia[]) => void
  onStop?: () => void
  isLoading?: boolean
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  showFileUpload?: boolean
  onHeightChange?: (height: number) => void
  t: (key: string) => string
  lang: string
}

export const ChatInput = memo(
  forwardRef<HTMLTextAreaElement, ChatInputProps>(function ChatInput(
    {
      value,
      onChange,
      onSubmit,
      onStop,
      isLoading = false,
      placeholder = "Ask here",
      maxLength = 4000,
      disabled = false,
      showFileUpload = true,
      onHeightChange,
      t,
      lang,
    },
    ref
  ) {
    const [attachments, setAttachments] = useState<ChatMedia[]>([])
    const [previewImg, setPreviewImg] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleHeightChange = useCallback(
      (height: number) => {
        if (onHeightChange) {
          // Get the full container height including padding
          const containerHeight = containerRef.current?.offsetHeight || height
          onHeightChange(containerHeight)
        }
      },
      [onHeightChange]
    )

    const handleSubmit = useCallback(
      (e?: React.FormEvent) => {
        e?.preventDefault()
        if (value.trim() && !isLoading) {
          onSubmit(value.trim(), attachments)
          setAttachments([])
        }
      },
      [value, isLoading, onSubmit, attachments]
    )

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          handleSubmit()
        }
        // For Shift+Enter, let the default behavior happen (adds newline)
        // TextareaAutosize will handle the smooth resize automatically
      },
      [handleSubmit]
    )

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value)
      },
      [onChange]
    )

    const formatFileSize = useCallback((bytes: number) => {
      if (bytes === 0) return "0 Bytes"
      const k = 1024
      const sizes = ["Bytes", "KB", "MB", "GB"]
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }, [])

    const getFileExtension = useCallback((fileName: string) => {
      return fileName.split(".").pop()?.toUpperCase() || "FILE"
    }, [])

    const handleFileUpload = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])

        files.forEach((file) => {
          if (file.size > 50 * 1024 * 1024) {
            // 50MB limit like Gemini
            toast.error(t("File size cannot exceed 50MB"))
            return
          }

          const reader = new FileReader()
          reader.onload = (e) => {
            const result = e.target?.result
            if (result) {
              let mediaType: "image" | "video" | "audio" | "file" = "file"

              if (file.type.startsWith("image/")) {
                mediaType = "image"
              } else if (file.type.startsWith("video/")) {
                mediaType = "video"
              } else if (file.type.startsWith("audio/")) {
                mediaType = "audio"
              }

              const media: ChatMedia = {
                type: mediaType,
                data: result as string,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
              }

              setAttachments((prev) => [...prev, media])
            }
          }
          reader.readAsDataURL(file)
        })

        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      },
      []
    )

    const removeAttachment = useCallback((index: number) => {
      setAttachments((prev) => prev.filter((_, i) => i !== index))
    }, [])

    const getAttachmentIcon = useCallback((type: string, fileName?: string) => {
      switch (type) {
        case "image":
          return <ImageIcon className="h-4 w-4" />
        case "video":
          return <Video className="h-4 w-4" />
        case "audio":
          return <Music className="h-4 w-4" />
        default:
          // Show different icons based on file extension
          if (fileName) {
            const ext = fileName.split(".").pop()?.toLowerCase()
            if (ext === "pdf")
              return <FileText className="h-4 w-4 text-red-500" />
            if (["doc", "docx"].includes(ext || ""))
              return <FileText className="h-4 w-4 text-blue-500" />
            if (["xls", "xlsx"].includes(ext || ""))
              return <FileText className="h-4 w-4 text-green-500" />
            if (["ppt", "pptx"].includes(ext || ""))
              return <FileText className="h-4 w-4 text-orange-500" />
            if (ext === "txt")
              return <FileText className="h-4 w-4 text-gray-500" />
          }
          return <File className="h-4 w-4" />
      }
    }, [])

    const handleFileInputClick = useCallback(() => {
      fileInputRef.current?.click()
    }, [])

    const handleStopOrSubmit = useCallback(() => {
      if (isLoading) {
        onStop?.()
      } else {
        handleSubmit()
      }
    }, [isLoading, onStop, handleSubmit])

    const handleSpeechTranscript = (transcript: string) => {
      // Append to current input value or replace if empty
      const newValue = value.trim() ? `${value} ${transcript}` : transcript
      onChange(newValue)
    }

    const getAttachmentPreview = useCallback(
      (media: ChatMedia, index: number) => {
        if (media.type === "image" && typeof media.data === "string") {
          return (
            <div className="group relative">
              <button
                type="button"
                className="focus:outline-none"
                onClick={() => setPreviewImg(media.data as string)}
              >
                <Image
                  src={media.data}
                  alt={media.fileName || `Upload ${index + 1}`}
                  width={64}
                  height={64}
                  className="border-border h-16 w-16 rounded-lg border object-cover"
                />
              </button>
              <button
                onClick={() => removeAttachment(index)}
                className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
              {media.fileName && (
                <div className="absolute right-0 bottom-0 left-0 truncate rounded-b-lg bg-black/70 p-1 text-xs text-white">
                  {media.fileName}
                </div>
              )}
            </div>
          )
        }

        return (
          <div className="group bg-muted border-border relative flex max-w-[200px] items-center gap-3 rounded-lg border px-3 py-2">
            <div className="flex-shrink-0">
              {getAttachmentIcon(media.type, media.fileName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {media.fileName ||
                  `${
                    media.type === "image"
                      ? "圖片"
                      : media.type === "video"
                      ? t("Video")
                      : media.type === "audio"
                      ? t("Audio")
                      : t("File")
                  } ${index + 1}`}
              </div>
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                {media.fileName && (
                  <span className="bg-primary/10 text-primary rounded px-1 py-0.5 font-mono text-xs">
                    {getFileExtension(media.fileName)}
                  </span>
                )}
                {media.fileSize && (
                  <span>{formatFileSize(media.fileSize)}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => removeAttachment(index)}
              className="text-muted-foreground hover:text-destructive h-4 w-4 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )
      },
      [removeAttachment, getAttachmentIcon, formatFileSize, getFileExtension]
    )

    return (
      <div ref={containerRef} className="relative">
        <div className="relative">
          <div className="mx-auto max-w-4xl">
            {/* File Attachments - Gemini style preview above input */}
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((media, index) => (
                  <div key={index}>{getAttachmentPreview(media, index)}</div>
                ))}
              </div>
            )}

            <ImagePreviewModal
              src={previewImg}
              onClose={() => setPreviewImg(null)}
            />

            {/* Main Input Container - Gemini style rounded container */}
            <div className="chat-input-container border-border bg-background focus-within:border-primary relative flex flex-col transform-gpu rounded-3xl border px-4 py-3 shadow-sm transition-all duration-300 ease-in-out focus-within:shadow-lg hover:shadow-md">
              <div className="relative flex-1 items-center">
                <TextareaAutosize
                  ref={ref}
                  value={value}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onHeightChange={handleHeightChange}
                  placeholder={t(placeholder)}
                  disabled={disabled || isLoading}
                  maxLength={maxLength}
                  minRows={1}
                  maxRows={8}
                  className="placeholder:text-muted-foreground min-h-[24px] w-full resize-none border-0 bg-transparent p-0 text-sm leading-6 transition-all duration-200 ease-in-out placeholder:transition-opacity placeholder:duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  style={{
                    lineHeight: "1.5rem", // 24px
                    outline: "none",
                    border: "none",
                  }}
                />
              </div>

              {/* Action Row - buttons on the next line */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {/* Attachment Button */}
                  {showFileUpload && (
                    <>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="hover:bg-muted h-8 w-8 shrink-0 rounded-full transition-colors duration-200"
                        onClick={handleFileInputClick}
                        disabled={disabled || isLoading}
                      >
                        <Paperclip className="h-4 w-4" />
                        <span className="sr-only">附加文件</span>
                        <span className="sr-only">{t("Attach file")}</span>
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xlsx,.pptx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </>
                  )}

                  {/* Speech to Text Button */}
                  <SpeechToTextButton
                    onTranscript={handleSpeechTranscript}
                    disabled={disabled || isLoading}
                    lang={lang}
                    t={t}
                  />
                </div>

                {/* Submit Button - Gemini style */}
                <div>
                  <Button
                    type="button"
                    size="icon"
                    onClick={handleStopOrSubmit}
                    disabled={disabled || (!isLoading && !value.trim())}
                    className={twMerge(
                      "h-8 w-8 shrink-0 transform rounded-full transition-all duration-200 hover:scale-105 active:scale-95",
                      value.trim() || isLoading
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {isLoading ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {isLoading ? t("Stop") : t("Send")}
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Character count and hints */}
            {(value.length > maxLength * 0.8 || attachments.length > 0) && (
              <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {attachments.length > 0 && (
                    <span>
                      {attachments.length} {t("attachments")}
                    </span>
                  )}
                </div>
                {value.length > maxLength * 0.8 && (
                  <span
                    className={twMerge(
                      "transition-colors",
                      value.length > maxLength * 0.95 && "text-destructive"
                    )}
                  >
                    {value.length}/{maxLength}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  })
)

ChatInput.displayName = "ChatInput"
