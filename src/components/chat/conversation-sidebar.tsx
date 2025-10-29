"use client"

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
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIsMobile } from "@/components/ui/use-mobile"
import { legalexpApiClient } from "@/lib/api-client"
import { twMerge } from "tailwind-merge"
import { ChatConversation, useChatStore } from "@/store/chat.store"
import { langToLocale } from "@/utils/i18n/client"
import { formatDistanceToNow } from "date-fns"
import { useSession } from "next-auth/react"
import {
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  MessageSquare,
  Star,
  Pin,
  Archive,
  Copy,
  Search,
  Loader2,
} from "lucide-react"
import { useState, useMemo } from "react"

interface ConversationSidebarProps {
  currentUserConversations: ChatConversation[]
  onCollapseSidebar: () => void
  t: (key: string) => string
  lang: string
}

export function ConversationSidebar({
  currentUserConversations,
  onCollapseSidebar,
  t,
  lang,
}: ConversationSidebarProps) {
  const currentConversationId = useChatStore(
    (state) => state.currentConversationId
  )
  const onSwitchConversation = useChatStore(
    (state) => state.onSwitchConversation
  )
  const onSwitchConversationWithMessages = useChatStore(
    (state) => state.onSwitchConversationWithMessages
  )
  const onUpdateConversationTitle = useChatStore(
    (state) => state.onUpdateConversationTitle
  )
  const onDeleteConversation = useChatStore(
    (state) => state.onDeleteConversation
  )

  const isMobile = useIsMobile()
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [switchingConversationId, setSwitchingConversationId] = useState<
    string | null
  >(null)

  const createConversation = () => {
    onSwitchConversation(null)
  }

  const filteredConversations = useMemo(() => {
    return currentUserConversations
      .filter((conv) => {
        // Filter by search query
        const matchesSearch =
          conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? true

        // For now, just filter by search query since we don't have status properties
        return matchesSearch
      })
      .sort((a, b) => {
        // Sort by updated date, handle invalid dates
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0

        // Handle invalid dates
        const aValid = !isNaN(aTime)
        const bValid = !isNaN(bTime)

        if (!aValid && !bValid) return 0
        if (!aValid) return 1
        if (!bValid) return -1

        return bTime - aTime
      })
  }, [currentUserConversations, searchQuery])

  const groupedConversations = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const groups = {
      today: [] as typeof currentUserConversations,
      yesterday: [] as typeof currentUserConversations,
      lastWeek: [] as typeof currentUserConversations,
      older: [] as typeof currentUserConversations,
    }

    filteredConversations.forEach((conv) => {
      if (!conv.updatedAt) {
        groups.older.push(conv)
        return
      }

      const convDate = new Date(conv.updatedAt)
      if (isNaN(convDate.getTime())) {
        groups.older.push(conv)
        return
      }

      if (convDate >= today) {
        groups.today.push(conv)
      } else if (convDate >= yesterday) {
        groups.yesterday.push(conv)
      } else if (convDate >= lastWeek) {
        groups.lastWeek.push(conv)
      } else {
        groups.older.push(conv)
      }
    })

    return groups
  }, [filteredConversations])

  const handleEditTitle = (id: string, currentTitle: string) => {
    setEditingId(id)
    setEditTitle(currentTitle)
  }

  const handleSaveTitle = (id: string) => {
    if (editTitle.trim()) {
      onUpdateConversationTitle(id, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle("")
  }

  const handleDeleteConversation = async () => {
    if (deleteId) {
      onDeleteConversation(deleteId)
      setDeleteId(null)
      setShowDeleteDialog(false)
      if (session) {
        await legalexpApiClient.delete(`/user/chat/law/${deleteId}`)
      }
    }
  }

  const handleSwitchConversation = async (conversationId: string) => {
    if (conversationId === currentConversationId) return

    // Show loading state
    setSwitchingConversationId(conversationId)

    try {
      // Load messages first before switching to prevent blinking
      if (session) {
        const resp = await legalexpApiClient.get(
          `/user/chat/law/${conversationId}/messages`
        )
        console.log(
          "Loaded messages for conversation:",
          conversationId,
          resp.data
        )

        const messages = [
          {
            role: "assistant",
            content: t(SYSTEM_PROMPT, { lang }),
            createdAt:
              currentUserConversations.find((c) => c.id === conversationId)
                ?.createdAt || Date.now(),
          },
          ...resp.data.map((msg: any) => ({
            ...msg,
            createdAt: new Date(msg.createdAt).getTime(),
          })),
        ]

        // Small delay to ensure smooth transition
        await new Promise((resolve) => setTimeout(resolve, 50))

        // Switch conversation with messages in a single atomic operation
        onSwitchConversationWithMessages(conversationId, messages)
      } else {
        // For guest users, switch immediately
        onSwitchConversation(conversationId)
      }

      if (isMobile) {
        onCollapseSidebar()
      }
    } catch (error) {
      console.error("Failed to load conversation messages:", error)
      // Still switch even if loading fails
      onSwitchConversation(conversationId)
      onCollapseSidebar()
    } finally {
      // Clear loading state
      setSwitchingConversationId(null)
    }
  }

  const ConversationItem = ({
    conversation,
  }: {
    conversation: ChatConversation
  }) => {
    const isActive = conversation.id === currentConversationId
    const isEditing = editingId === conversation.id
    const isSwitching = switchingConversationId === conversation.id

    return (
      <div
        className={twMerge(
          "group hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-lg p-3 transition-all duration-200",
          isActive && "bg-primary/10 border-primary/20 border",
          isSwitching && "cursor-wait opacity-50"
        )}
      >
        <div
          className="min-w-0 flex-1"
          onClick={() =>
            !isEditing &&
            !isSwitching &&
            handleSwitchConversation(conversation.id)
          }
        >
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => handleSaveTitle(conversation.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveTitle(conversation.id)
                }
                if (e.key === "Escape") {
                  setEditingId(null)
                  setEditTitle("")
                }
              }}
              className="h-7 text-sm"
              autoFocus
            />
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate text-sm font-medium">
                  {conversation.title}
                </h4>
                {isSwitching && (
                  <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
                )}
              </div>
              <p className="text-muted-foreground truncate text-xs">
                {conversation.updatedAt
                  ? formatDistanceToNow(new Date(conversation.updatedAt), {
                      addSuffix: true,
                      locale: langToLocale(lang),
                    })
                  : "Unknown time"time"}
              </p>
            </div>
          )}
        </div>

        <DropdownMenu modal={isMobile}>
          <DropdownMenuTrigger asChild>
            <Button
              onClick={(e) => e.stopPropagation()}
              variant="ghost"
              size="sm"
              className={twMerge("h-8 w-8 shrink-0 p-0 z-[70]")}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            onClick={(e) => e.stopPropagation()}
            align="end"
            className="z-[100]"
            sideOffset={5}
            collisionPadding={10}
          >
            <DropdownMenuItem
              onClick={() =>
                handleEditTitle(conversation.id, conversation.title!)
              }
            >
              <Edit className="mr-2 h-4 w-4" />
              {t("Rename")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setDeleteId(conversation.id)
                setShowDeleteDialog(true)
              }}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("Delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  const GroupSection = ({
    title,
    conversations,
  }: {
    title: string
    conversations: ChatConversation[]
  }) => {
    if (conversations.length === 0) return null

    return (
      <div className="space-y-2">
        <h3 className="text-muted-foreground px-2 text-xs font-medium tracking-wide uppercase">
          {t(title)}
        </h3>
        <div className="space-y-1">
          {conversations.map((conv) => (
            <ConversationItem key={conv.id} conversation={conv} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-border/50 flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">{t("History")}</h2>
          <Button onClick={createConversation} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t("New Conversation")}
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 pb-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder={t("Search conversations...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1 px-4">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="font-medium">
                {searchQuery
                  ? t("No relevant conversations found")
                  : t("No conversations yet")}
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {searchQuery
                  ? t("Try different keywords")
                  : t("Start your first conversation")}
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              <GroupSection
                title="Today"
                conversations={groupedConversations.today}
              />
              <GroupSection
                title="Yesterday"
                conversations={groupedConversations.yesterday}
              />
              <GroupSection
                title="This week"
                conversations={groupedConversations.lastWeek}
              />
              <GroupSection
                title="Earlier"
                conversations={groupedConversations.older}
              />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Confirm to delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "This action cannot be undone. This will permanently delete this conversation and all its messages."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
