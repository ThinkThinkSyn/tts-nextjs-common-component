'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Music, 
  X,
  Upload,
  File
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatMediaType, IChatMedia } from '@/types/chat.type'

interface MediaAttachmentProps {
  onAttachmentAdd: (media: IChatMedia) => void
  onAttachmentRemove: (index: number) => void
  attachments: IChatMedia[]
  disabled?: boolean
}

export function MediaAttachment({
  onAttachmentAdd,
  onAttachmentRemove,
  attachments,
  disabled = false,
}: MediaAttachmentProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (result) {
          let mediaType: ChatMediaType = 'file'
          
          if (file.type.startsWith('image/')) {
            mediaType = 'image'
          } else if (file.type.startsWith('video/')) {
            mediaType = 'video'
          } else if (file.type.startsWith('audio/')) {
            mediaType = 'audio'
          }

          const media: IChatMedia = {
            type: mediaType,
            data: result as string,
          }
          
          onAttachmentAdd(media)
        }
      }
      reader.readAsDataURL(file)
    })
    
    setIsOpen(false)
  }

  const getMediaIcon = (type: ChatMediaType) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      case 'audio':
        return <Music className="h-4 w-4" />
      case 'file':
        return <FileText className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const getMediaName = (type: ChatMediaType, index: number) => {
    switch (type) {
      case 'image':
        return `圖片 ${index + 1}`
      case 'video':
        return `影片 ${index + 1}`
      case 'audio':
        return `音訊 ${index + 1}`
      case 'file':
        return `檔案 ${index + 1}`
      default:
        return `媒體 ${index + 1}`
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="h-8 w-8 p-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">上傳檔案</Label>
              <p className="text-xs text-muted-foreground mt-1">
                支援圖片、影片、音訊及文件檔案
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-muted-foreground/25 rounded-md cursor-pointer hover:border-muted-foreground/50 transition-colors"
              >
                <Upload className="h-6 w-6 mb-1" />
                <span className="text-xs">瀏覽檔案</span>
              </Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Show attached media */}
      {attachments.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {attachments.map((media, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {getMediaIcon(media.type)}
              <span className="text-xs">{getMediaName(media.type, index)}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onAttachmentRemove(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
