'use client'

import { ImagePreviewModal } from './ImagePreviewModal'
import { LawyerReferralModal } from './lawyer-referral-modal'
import { MessageMarkdown } from './markdown'
import { MessageActions } from './message-actions'
import { MessageEditor } from './message-editor'
import { TextToSpeechButton } from './text-to-speech-button'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChatConversation } from '@/store/chat.store'
import { IChatMessage } from '@/types/chat.type'

import { AnimatePresence, motion } from 'framer-motion'
import { Bot, User, Calendar, X, ImageIcon, FileText, Video, Music, File } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

interface MessageBubbleProps {
  message: IChatMessage
  currentConversation: ChatConversation | undefined
  conversationId: string
  isLoading: boolean
  onEdit?: (content: string) => Promise<void>
  onRegenerate?: () => void
  isLastAssistantMessage: boolean
  t: (key: string) => string
  lang: string
}
export function MessageBubble({
  message,
  currentConversation,
  conversationId,
  isLoading,
  onEdit,
  onRegenerate,
  isLastAssistantMessage,
  t,
  lang,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLawyerModalOpen, setIsLawyerModalOpen] = useState(false)

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async (content: string) => {
    setIsSubmitting(true)
    try {
      if (onEdit) {
        await onEdit(content)
      }
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  // Modal state for image preview
  const [previewImg, setPreviewImg] = useState<string | null>(null)

  return (
    <>
      {/* Media attachments above the bubble, styled like chat-input preview */}
      {message.medias && Object.keys(message.medias).length > 0 && (
        <div
          className={cn(
            'mb-3 flex flex-wrap gap-2',
            message.role === 'user' ? 'justify-end' : 'justify-start',
          )}
        >
          {Object.entries(message.medias).map(([key, media], index) => {
            const fileName = (media as any).fileName || ''
            const fileSize = (media as any).fileSize
            const fileType = (media as any).fileType
            // Image preview
            if (media.type === 'image' && typeof media.data === 'string') {
              return (
                <div className="group relative" key={key}>
                  <button
                    type="button"
                    className="focus:outline-none"
                    onClick={() => setPreviewImg(media.data as string)}
                  >
                    <Image
                      src={media.data}
                      alt={fileName || `Upload ${index + 1}`}
                      width={64}
                      height={64}
                      className="border-border h-16 w-16 rounded-lg border object-cover"
                    />
                  </button>
                  <button
                    onClick={() => setPreviewImg(null)}
                    className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {fileName && (
                    <div className="absolute right-0 bottom-0 left-0 truncate rounded-b-lg bg-black/70 p-1 text-xs text-white">
                      {fileName}
                    </div>
                  )}
                </div>
              )
            }
            // Other file types
            return (
              <div
                key={key}
                className="group bg-muted border-border relative flex max-w-[200px] items-center gap-3 rounded-lg border px-3 py-2"
              >
                <div className="flex-shrink-0">
                  {/* Icon logic similar to chat-input */}
                  {(() => {
                    if (media.type === 'image') return <ImageIcon className="h-4 w-4" />
                    if (media.type === 'video') return <Video className="h-4 w-4" />
                    if (media.type === 'audio') return <Music className="h-4 w-4" />
                    if (fileName) {
                      const ext = fileName.split('.').pop()?.toLowerCase()
                      if (ext === 'pdf') return <FileText className="h-4 w-4 text-red-500" />
                      if (['doc', 'docx'].includes(ext || ''))
                        return <FileText className="h-4 w-4 text-blue-500" />
                      if (['xls', 'xlsx'].includes(ext || ''))
                        return <FileText className="h-4 w-4 text-green-500" />
                      if (['ppt', 'pptx'].includes(ext || ''))
                        return <FileText className="h-4 w-4 text-orange-500" />
                      if (ext === 'txt') return <FileText className="h-4 w-4 text-gray-500" />
                    }
                    return <File className="h-4 w-4" />
                  })()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {fileName ||
                      `${
                        media.type === 'image'
                          ? '圖片'
                          : media.type === 'video'
                            ? t('Video')
                            : media.type === 'audio'
                              ? t('Audio')
                              : t('File')
                      } ${index + 1}`}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    {fileName && (
                      <span className="bg-primary/10 text-primary rounded px-1 py-0.5 font-mono text-xs">
                        {fileName.split('.').pop()?.toUpperCase() || 'FILE'}
                      </span>
                    )}
                    {fileSize && (
                      <span>
                        {fileSize / 1024 / 1024 > 1
                          ? `${(fileSize / 1024 / 1024).toFixed(2)} MB`
                          : `${(fileSize / 1024).toFixed(2)} KB`}
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={typeof media.data === 'string' ? media.data : '#'}
                  download={fileName}
                  className="text-muted-foreground hover:text-primary h-4 w-4 flex-shrink-0 text-xs underline opacity-0 transition-opacity group-hover:opacity-100"
                  title={t('Download')}
                ></a>
              </div>
            )
          })}
        </div>
      )}

      {/* Message bubble below attachments */}
      <AnimatePresence mode="wait">
        <motion.div
          key={message.createdAt}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'group flex items-start gap-3 rounded-lg p-4 w-full max-w-full',
            message.role === 'user' ? 'bg-muted ml-4 flex-row-reverse' : 'bg-primary/10 mr-4',
          )}
        >
          <div className="bg-background flex h-8 w-8 shrink-0 items-center justify-center rounded-md border shadow select-none">
            {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </div>

          <div className="flex-1 space-y-2 min-w-0 max-w-full overflow-hidden">
            {isEditing ? (
              <MessageEditor
                message={message}
                onSave={handleSave}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
              />
            ) : (
              <>
                <div className="prose-container break-words hyphens-auto w-full max-w-full overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', wordWrap: 'break-word' }}>
                  <MessageMarkdown content={message.content} />
                </div>

                {/* Lawyer Referral Button - Show only for last assistant message */}
                {!isLoading && isLastAssistantMessage && (
                  <div className="mt-4 w-full">
                    <Button
                      onClick={() => setIsLawyerModalOpen(true)}
                      className="transform bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl whitespace-normal text-left h-auto py-2 w-full max-w-full break-words"
                      size="sm"
                    >
                      <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="break-words overflow-wrap-anywhere">{t('Pack your case in one click and contact your lawyer now!')}</span>
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground text-xs">
                    {new Date(message.createdAt).toLocaleTimeString(lang, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>

                  <div className="flex items-center gap-1">
                    <MessageActions
                      currentConversation={currentConversation}
                      message={message}
                      conversationId={conversationId}
                      isLoading={isLoading}
                      onEdit={message.role === 'user' ? handleEdit : undefined}
                      onRegenerate={message.role === 'assistant' ? onRegenerate : undefined}
                      t={t}
                      lang={lang}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Reusable image preview modal */}
      <ImagePreviewModal src={previewImg} onClose={() => setPreviewImg(null)} />

      {/* Lawyer Referral Modal */}
      <LawyerReferralModal isOpen={isLawyerModalOpen} onClose={() => setIsLawyerModalOpen(false)} t={t} />
    </>
  )
}
