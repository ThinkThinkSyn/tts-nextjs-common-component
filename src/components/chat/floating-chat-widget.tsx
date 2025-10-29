'use client'

import { ChatInput } from '@/components/chat/chat-input'
import { FloatingMessageList } from '@/components/chat/floating-message-list'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { useFloatingChatStore } from '@/store/floating-chat.store'
import { IChatMessage, IChatMedia } from '@/types/chat.type'
import { createConversationId, startChatSSE, SYSTEM_PROMPT } from '@/utils/chat'

import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, X, Minimize2, Trash2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useCallback, useRef, useState, useEffect } from 'react'
import { toast } from 'sonner'

interface FloatingChatWidgetProps {
  t: (key: string) => string
  lang: string
}

export function FloatingChatWidget({ t, lang }: FloatingChatWidgetProps) {
  const {
    isOpen,
    messages,
    isLoading,
    input,
    toggleOpen,
    setOpen,
    addMessage,
    clearMessages,
    setLoading,
    setInput,
    updateLastMessage,
    endStreaming,
  } = useFloatingChatStore()

  const { data: session } = useSession()

  const [isDragging, setIsDragging] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [hasHydrated, setHasHydrated] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)


  // Manually hydrate the store after initial render to prevent suspense
  useEffect(() => {
    useFloatingChatStore.persist.rehydrate()
    setHasHydrated(true)
  }, [])

  const handleSubmit = useCallback(
    async (content: string, attachments?: IChatMedia[]) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) {
        toast.error(t('Please enter a message'))
        return
      }

      // Create conversation ID if not exists
      let currentConversationId = conversationId
      if (!currentConversationId) {
        try {
          currentConversationId = await createConversationId()
          setConversationId(currentConversationId)
        } catch (error) {
          console.error('Failed to create conversation ID:', error)
          toast.error(t('Failed to start conversation. Please try again.'))
          return
        }
      }

      // Add user message
      const userMessage: IChatMessage = {
        role: 'user',
        content: content.trim(),
        createdAt: Date.now(),
      }

      if (attachments && attachments.length > 0) {
        const filteredMedias = attachments
          .map((media, i) =>
            media.type === 'audio' || media.type === 'image'
              ? [i, { ...media, content: media.content ?? (media as any).data }]
              : null,
          )
          .filter(Boolean) as [number, IChatMedia][]
        if (filteredMedias.length > 0) {
          userMessage.medias = Object.fromEntries(filteredMedias)
        }
      }

      addMessage(userMessage)
      setInput('')
      setLoading(true)

      try {
        startChatSSE({
          conversation: { 
            messages: messages,
            title: 'Floating Chat'
          },
          conversationId: currentConversationId,
          newMessage: userMessage,
          session,
          onAddMessage: (message) => {
            // Let the built-in SSE logic handle duplicate prevention
            addMessage(message)
          },
          onStreamStart: () => setLoading(true),
          onStreamEvent: (data, type) => {
            if (['msg', 'message', 'text'].includes(type) && data) {
              updateLastMessage(data)
            }
          },
          setIsLoading: setLoading,
          onStreamEnd: () => {
            setLoading(false)
          },
        })
      } catch (error: any) {
        setLoading(false)
        toast.error(t('Failed to get response. Please try again.'))
        console.error('Floating chat error:', error)
      }
    },
    [addMessage, setInput, setLoading, updateLastMessage, t, conversationId, messages, session],
  )

  const handleStop = useCallback(() => {
    setLoading(false)
  }, [setLoading])

  const handleMinimize = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const handleClearConversation = useCallback(() => {
    setShowClearDialog(true)
  }, [])

  const handleConfirmClear = useCallback(() => {
    clearMessages()
    setConversationId(null)
    setInput('')
    setShowClearDialog(false)
    toast.success(t('Conversation cleared successfully'))
  }, [clearMessages, setInput, t])

  const handleCancelClear = useCallback(() => {
    setShowClearDialog(false)
  }, [])

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
    },
    [setInput],
  )

  // Don't render until hydrated to prevent suspense during first mount
  if (!hasHydrated) {
    return null
  }

  return (
    <>
      {/* Chat Bubble - Fixed Position */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={toggleOpen}
              size="lg"
              className={cn(
                'h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200',
                'bg-primary hover:bg-primary/90 text-primary-foreground',
                'border-2 border-background',
                isDragging && 'cursor-grabbing'
              )}
              aria-label={t('Open chat')}
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
              onClick={handleMinimize}
            />

            {/* Chat Window */}
            <motion.div
              initial={{ 
                opacity: 0, 
                scale: 0.8, 
                x: '100%',
                y: '100%'
              }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                x: 0,
                y: 0
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.8, 
                x: '100%',
                y: '100%'
              }}
              transition={{ 
                duration: 0.3, 
                ease: [0.16, 1, 0.3, 1]
              }}
              className={cn(
                'fixed z-50 flex flex-col overflow-hidden',
                'bg-background border border-border rounded-lg shadow-2xl',
                // Mobile: Full screen on small devices
                'inset-4 md:inset-auto',
                // Desktop: Bottom-right positioned
                'md:bottom-6 md:right-6 md:h-[500px] md:w-[380px]'
              )}
              // Prevent scroll events from propagating to parent
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              style={{
                // Ensure proper touch handling
                touchAction: 'pan-y',
                overscrollBehavior: 'contain'
              }}
            >
              {/* Header */}
              <div className="border-border flex items-center justify-between border-b bg-background/95 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full">
                    <MessageCircle className="text-primary-foreground h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{t('Legal Assistant')}</h3>
                    <p className="text-muted-foreground text-xs">
                      {isLoading ? t('Typing...') : t('Online')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearConversation}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    aria-label={t('Clear conversation')}
                    title={t('Clear conversation')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMinimize}
                    className="h-8 w-8 p-0"
                    aria-label={t('Minimize chat')}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <FloatingMessageList messages={messages} isLoading={isLoading} t={t} />
              </div>

              {/* Input Area */}
              <div className="border-border border-t bg-background/95 p-3 backdrop-blur-sm">
                <ChatInput
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onSubmit={handleSubmit}
                  onStop={handleStop}
                  isLoading={isLoading}
                  placeholder={t('Ask a legal question...')}
                  showFileUpload={false}
                  maxLength={500}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Clear Conversation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Clear conversation')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('Are you sure you want to clear the conversation? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClear}>
              {t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('Clear')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
