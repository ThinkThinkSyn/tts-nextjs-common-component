"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChatConversation } from "@/store/chat.store"
import { Square, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"

interface ChatHeaderProps {
  conversation: ChatConversation | undefined
  onStop?: () => void
  isLoading?: boolean
  isRightSidebarCollapsed?: boolean
  onToggleRightSidebar?: () => void
  t: (key: string) => string
}

export function ChatHeader({
  conversation,
  onStop,
  isLoading = false,
  isRightSidebarCollapsed = false,
  onToggleRightSidebar,
  t,
}: ChatHeaderProps) {
  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 flex items-center border-b px-6 md:py-4 pb-2 backdrop-blur md:flex">
      <div className="flex flex-1 items-center gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-muted-foreground h-5 w-5" />
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold">
              {conversation?.title || t("AI Legal Consultation")}
            </h1>
            {isLoading && (
              <Badge variant="secondary" className="animate-pulse">
                <div className="mr-1 h-2 w-2 animate-ping rounded-full bg-green-500" />
                {t("Responding...")}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Stop/New Chat Button */}
        {isLoading && (
          <Button
            variant="outline"
            size="sm"
            onClick={onStop}
            className="gap-2"
          >
            <Square className="h-3 w-3" />
            {t("Stop")}
          </Button>
        )}

        {/* Sidebar Toggle Button */}
        {onToggleRightSidebar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleRightSidebar}
            className="h-8 w-8 p-0"
          >
            {isRightSidebarCollapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
