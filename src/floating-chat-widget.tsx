"use client"

import { ChatInput } from "@/components/chat/chat-input"
import { FloatingMessageList } from "@/components/chat/floating-message-list"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { twMerge } from "tailwind-merge"
import { useFloatingChatStore } from "@/store/floating-chat.store"
import { IChatMedia } from "@/types/chat.type"
import { AnimatePresence, motion } from "framer-motion"
import { MessageCircle, Minimize2, Trash2 } from "lucide-react"
import { useCallback, useRef, useState, useEffect } from "react"

interface FloatingChatWidgetProps {
  defaultTitle?: string
  userAccessToken: string | undefined
  userEndpoint: string
  guestEndpoint: string
  t: (key: string) => string
  lang: string
}



export function FloatingChatWidget({
  defaultTitle = "New Conversation",
  userAccessToken,
  userEndpoint,
  guestEndpoint,
  t,
  lang,
}: FloatingChatWidgetProps) {
  const {
    isOpen,
    messages,
    isLoading,
    input,
    showClearDialog,
    toggleOpen,
    setInput,
    setShowClearDialog,
    handleStop,
    handleMinimize,
    handleClearConversation,
    handleConfirmClear,
    handleCancelClear,
    handleSubmit,
  } = useFloatingChatStore()
  const [hasHydrated, setHasHydrated] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Manually hydrate the store after initial render to prevent suspense
  useEffect(() => {
    useFloatingChatStore.persist.rehydrate()
    setHasHydrated(true)
  }, [])

  const handleSubmitWrapper = useCallback(
    (content: string, attachments?: IChatMedia[]) => {
      return handleSubmit(content, attachments, {
        userEndpoint,
        guestEndpoint,
        defaultTitle,
        userAccessToken,
        t,
      })
    },
    [handleSubmit, userEndpoint, guestEndpoint, defaultTitle, userAccessToken, t]
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
              className={twMerge(
                "h-14 w-14 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl",
                "text-primary-foreground bg-primary hover:bg-primary/90",
                "border-2 border-background"
                // isDragging && "cursor-grabbing"
              )}
              aria-label={t("Open chat")}
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
                x: "100%",
                y: "100%",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: 0,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                x: "100%",
                y: "100%",
              }}
              transition={{
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={twMerge(
                "fixed z-50 flex flex-col overflow-hidden",
                "rounded-lg border border-border bg-background shadow-2xl",
                // Mobile: Full screen on small devices
                "inset-4 md:inset-auto",
                // Desktop: Bottom-right positioned
                "md:bottom-6 md:right-6 md:h-[500px] md:w-[380px]"
              )}
              // Prevent scroll events from propagating to parent
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              style={{
                // Ensure proper touch handling
                touchAction: "pan-y",
                overscrollBehavior: "contain",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border bg-background/95 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <MessageCircle className="text-primary-foreground h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">
                      {t("Legal Assistant")}
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      {isLoading ? t("Typing...") : t("Online")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearConversation}
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                    aria-label={t("Clear conversation")}
                    title={t("Clear conversation")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMinimize}
                    className="h-8 w-8 p-0"
                    aria-label={t("Minimize chat")}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="min-h-0 flex-1 overflow-hidden">
                <FloatingMessageList
                  messages={messages}
                  isLoading={isLoading}
                  t={t}
                />
              </div>

              {/* Input Area */}
              <div className="border-t border-border bg-background/95 p-3 backdrop-blur-sm">
                <ChatInput
                  ref={inputRef}
                  value={input}
                  onChange={setInput}
                  onSubmit={handleSubmitWrapper}
                  onStop={handleStop}
                  isLoading={isLoading}
                  placeholder={t("Ask a legal question...")}
                  showFileUpload={false}
                  maxLength={500}
                  t={t}
                  lang={lang}
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
            <AlertDialogTitle>{t("Clear conversation")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Are you sure you want to clear the conversation? This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClear}>
              {t("Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleConfirmClear(t)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("Clear")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
