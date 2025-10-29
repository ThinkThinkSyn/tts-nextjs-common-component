'use client'

import { TextToSpeechButton } from './text-to-speech-button'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChatConversation, useChatStore } from '@/store/chat.store'
import { IChatMessage } from '@/types/chat.type'

import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Edit, Trash2 } from 'lucide-react'
import { memo, useCallback } from 'react'
import { toast } from 'sonner'
import { useCopyToClipboard } from 'usehooks-ts'

interface MessageActionsProps {
  message: IChatMessage
  currentConversation: ChatConversation | undefined
  conversationId: string
  isLoading: boolean
  onEdit?: (newContent?: string) => void
  onRegenerate?: () => void
  t: (key: string) => string
  lang: string
}

function PureMessageActions({
  message,
  currentConversation,
  conversationId,
  isLoading,
  onEdit,
  onRegenerate,
  t,
  lang,
}: MessageActionsProps) {
  const [_, copyToClipboard] = useCopyToClipboard()
  const onLoadConversationMessages = useChatStore((state) => state.onLoadConversationMessages)

  const handleCopy = useCallback(async () => {
    if (!message.content) {
      const toastOptions = {
        description: t('Error'),
        className: 'text-red-500',
        action: {
          label: t('Retry'),
          onClick: () => copyToClipboard(message.content),
        },
      }
      toast(t('No content to copy!'), toastOptions)
      return
    }
    await copyToClipboard(message.content)
    const toastOptionsCopy = {
      description: t('Success'),
      className: 'text-green-600',
    }
    toast(t('Copied to clipboard!'), toastOptionsCopy)
  }, [message.content, copyToClipboard, t])

  const handleUpvote = useCallback(async () => {
    const toastOptionsUpvote = {
      description: t('Success'),
      className: 'text-blue-600',
    }
    toast(t('Upvoted reply!'), toastOptionsUpvote)
  }, [t])

  const handleDownvote = useCallback(async () => {
    const toastOptionsDownvote = {
      description: t('Success'),
      className: 'text-yellow-600',
    }
    toast(t('Downvoted reply!'), toastOptionsDownvote)
  }, [t])

  const handleRegenerate = useCallback(() => {
    if (onRegenerate) {
      onRegenerate()
    }
  }, [onRegenerate])

  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit()
    }
  }, [onEdit])

  // Delete user message and the next bot message
  const handleDelete = useCallback(() => {
    const conv = currentConversation
    if (!conv) return
    const idx = conv.messages.findIndex(
      (m) => m.createdAt === message.createdAt && m.role === 'user',
    )
    if (idx === -1) return
    // Remove user message and next assistant message if present
    const newMessages = conv.messages.filter((_, i) => i !== idx && i !== idx + 1)
    // Update conversation
    onLoadConversationMessages(conversationId, newMessages)
    const toastOptionsDelete = {
      description: t('User message and reply deleted'),
      className: 'text-gray-600',
    }
    toast(t('Message deleted'), toastOptionsDelete)
  }, [currentConversation, message.createdAt, conversationId, t])

  if (isLoading) return null

  return (
    <div className="flex flex-row items-center gap-2">
      {/* Text-to-Speech Button for assistant messages */}
      <div className="flex flex-col items-center">
        {/* Use same style and size as other buttons */}
        <TextToSpeechButton
          text={message.content}
          size="icon"
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          t={t}
          lang={lang}
        />
      </div>
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
          onClick={handleCopy}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      {message.role === 'assistant' && (
        <>
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
              onClick={handleUpvote}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
              onClick={handleDownvote}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {message.role === 'user' && (
        <>
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
              onClick={handleRegenerate}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export const MessageActions = memo(PureMessageActions)
