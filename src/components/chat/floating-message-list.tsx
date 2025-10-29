"use client"

import { MessageMarkdown } from "@/components/chat/markdown"
import { twMerge } from "tailwind-merge"
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom"
import { IChatMessage } from "@/types/chat.type"
import { AnimatePresence, motion } from "framer-motion"
import { Bot, User } from "lucide-react"
import { useRef, useEffect, useCallback } from "react"

interface FloatingMessageListProps {
  messages: IChatMessage[]
  isLoading?: boolean
  t: (key: string) => string
}

// Thinking indicator component for floating chat
function FloatingThinkingIndicator({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-2"
    >
      {/* Avatar */}
      <div className="bg-muted text-muted-foreground flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs">
        <Bot className="h-3 w-3" />
      </div>

      {/* Thinking Content */}
      <div className="bg-muted text-muted-foreground max-w-[80%] rounded-lg px-3 py-2 text-sm">
        <div className="flex items-center gap-1">
          <div className="h-1 w-1 animate-bounce rounded-full bg-current" />
          <div className="h-1 w-1 animate-bounce rounded-full bg-current delay-150" />
          <div className="h-1 w-1 animate-bounce rounded-full bg-current delay-300" />
        </div>
      </div>
    </motion.div>
  )
}

export function FloatingMessageList({
  messages,
  isLoading,
  t,
}: FloatingMessageListProps) {
  const { containerRef, endRef, isAtBottom, scrollToBottom, onScroll } =
    useScrollToBottom()

  // Create the hardcoded system message
  const systemMessage: IChatMessage = {
    role: "assistant",
    content: t(
      "Hello! I am your legal AI assistant. You can describe your situation or ask any legal questions, and I will do my best to help."
    ),
    createdAt: Date.now() - 1000, // Make it appear older than other messages
  }

  // Combine system message with actual messages
  const allMessages = [systemMessage, ...messages]

  // Track message length and last message content for auto-scroll logic
  const prevMessageLengthRef = useRef(allMessages.length)
  const lastMessageContent = allMessages.at(-1)?.content ?? ""
  const prevLastMessageContentRef = useRef(lastMessageContent)

  // Auto-scroll logic: scroll to bottom if user was at the bottom before new message or content changes
  useEffect(() => {
    const messageChanged =
      prevMessageLengthRef.current !== allMessages.length ||
      prevLastMessageContentRef.current !== lastMessageContent

    if (isAtBottom && messageChanged) {
      scrollToBottom("smooth")
    }

    prevMessageLengthRef.current = allMessages.length
    prevLastMessageContentRef.current = lastMessageContent
  }, [allMessages.length, lastMessageContent, isAtBottom, scrollToBottom])

  // Scroll to bottom when loading starts
  useEffect(() => {
    if (isLoading && isAtBottom) {
      scrollToBottom("smooth")
    }
  }, [isLoading, isAtBottom, scrollToBottom])

  // Handle scroll with event propagation control
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      e.stopPropagation() // Prevent scroll from bubbling to parent
      onScroll(e)
    },
    [onScroll]
  )

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto overflow-x-hidden p-3 space-y-3"
      onScroll={handleScroll}
      style={{
        // Ensure this div captures all scroll events
        touchAction: "pan-y",
        overscrollBehavior: "contain",
        // Ensure scrollbar is visible and functional
        scrollbarWidth: "thin",
        scrollbarColor: "hsl(var(--muted)) transparent",
      }}
    >
      <AnimatePresence>
        {allMessages.map((message, index) => {
          if (!message.content && !isLoading) return null

          const isUser = message.role === "user"
          const isLastMessage = index === allMessages.length - 1
          const isSystemMessage = index === 0 // First message is always the system message

          return (
            <motion.div
              key={
                isSystemMessage
                  ? "system-message"
                  : `${message.createdAt}-${index}`
              }
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={twMerge(
                "flex items-start gap-2",
                isUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div
                className={twMerge(
                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs",
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isUser ? (
                  <User className="h-3 w-3" />
                ) : (
                  <Bot className="h-3 w-3" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={twMerge(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <MessageMarkdown content={message.content} />
                    {isLoading &&
                      isLastMessage &&
                      !message.content &&
                      !isSystemMessage && (
                        <div className="flex items-center gap-1 text-xs opacity-70">
                          <div className="h-1 w-1 animate-pulse rounded-full bg-current" />
                          <div className="h-1 w-1 animate-pulse rounded-full bg-current delay-100" />
                          <div className="h-1 w-1 animate-pulse rounded-full bg-current delay-200" />
                        </div>
                      )}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}

        {/* Thinking indicator when loading and last message is from user */}
        <FloatingThinkingIndicator
          isVisible={Boolean(
            isLoading && messages.length > 0 && messages.at(-1)?.role === "user"
          )}
        />
      </AnimatePresence>

      {/* Scroll anchor */}
      <div ref={endRef} />
    </div>
  )
}
