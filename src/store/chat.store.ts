import { indexDBStorage } from "@/utils/storage"
import {
  IArticles,
  IChatMessage,
  IChatMedia,
  DbConversation,
  Vote,
  IRagMediaEvent,
} from "@/types/chat.type"
import type { WritableDraft } from "immer"
import { create } from "zustand"
import { persist, createJSONStorage, devtools } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

export interface ChatConversation extends DbConversation {
  relatedArticles: IArticles[]
  relatedQuestions: string[]
  isStarred?: boolean
  isPinned?: boolean
  isArchived?: boolean
  votes?: Vote[]
}

/**
 * `ChatState` interface defines the structure of the chat state,
 * including conversations organized by user ID, current user ID, and current conversation ID.
 */
interface ChatState {
  /** conversations organized by user ID */
  allUsersConversations: Record<string, ChatConversation[]>
  /** current user ID */
  currentUserId: string
  /** current conversation ID */
  currentConversationId: string | null
  /** current streaming status */
  isStreaming: boolean
  /** Pending RAG media per conversation to be attached to the next assistant message */
  pendingRagMedia: Record<string, IRagMediaEvent[]>
}

interface ChatAction {
  // User management
  setCurrentUserId: (userId: string) => void
  setIsStreaming: (isStreaming: boolean) => void

  // Message management
  onAddMessage: (message: IChatMessage, convId: string) => void
  onStreamStart: (convId: string) => void
  onStreamEvent: (data: string, type: string, convId: string) => void
  onRagMedia: (media: IRagMediaEvent, convId: string) => void
  onStreamEnd: (convId: string) => void
  onLoadConversations: (conversations: ChatConversation[]) => void
  onLoadConversationMessages: (convId: string, messages: IChatMessage[]) => void
  onDeleteMessages: (convId: string, msgId: string) => void

  // Conversation management
  onAddConversations: (conv: ChatConversation[]) => void
  onCreateConversation: (
    convId: string,
    title: string,
    assistantPrompt: string,
    lang: string
  ) => void
  onSwitchConversation: (newId: string | null) => void
  onSwitchConversationWithMessages: (
    convId: string,
    messages: IChatMessage[]
  ) => void
  onUpdateConversationTitle: (convId: string, title: string) => void
  onDeleteConversation: (convId: string) => void
  onBulkDeleteConversations: (convIds: string[]) => void

  // Enhanced conversation management
  onStarConversation: (convId: string) => void
  onPinConversation: (convId: string) => void
  onArchiveConversation: (convId: string) => void
  onBulkArchiveConversations: (convIds: string[]) => void

  // Related content management
  onSetRelatedArticles: (convId: string, articles: IArticles[]) => void
  onSetRelatedQuestions: (convId: string, questions: string[]) => void

  // Vote management
  onVoteMessage: (convId: string, messageId: string, isUpvoted: boolean) => void
  getMessageVote: (convId: string, messageId: string) => Vote | undefined

  // Computed selectors
  getStarredConversations: () => ChatConversation[]
  getPinnedConversations: () => ChatConversation[]
  getArchivedConversations: () => ChatConversation[]
  getActiveConversations: () => ChatConversation[]
  searchConversations: (query: string) => ChatConversation[]
}

type BoundState = ChatState & ChatAction

function _getConv(
  userConversations: WritableDraft<Record<string, ChatConversation[]>>,
  userId: string,
  convId: string
): WritableDraft<ChatConversation> | undefined {
  const conversations = userConversations[userId]
  return conversations.find((conv) => conv.id === convId)
}

export const useChatStore = create<BoundState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        allUsersConversations: { guest: [] },
        currentUserId: "guest",
        currentConversationId: null,
        isStreaming: false,
        pendingRagMedia: {},

        // User management
        setCurrentUserId: (userId: string) =>
          set((state) => {
            if (state.currentUserId === userId) return
            state.currentUserId = userId
            if (!state.allUsersConversations[userId]) {
              state.allUsersConversations[userId] = []
            }
          }),

        setIsStreaming: (isStreaming: boolean) =>
          set((state) => {
            state.isStreaming = isStreaming
          }),

        // Message management
        onAddMessage: (message: IChatMessage, convId: string) =>
          set((state) => {
            const conversation = _getConv(
              state.allUsersConversations,
              state.currentUserId,
              convId
            )
            if (conversation) {
              // If this is an assistant message and we have pending RAG media, attach it
              const pendingMedia = state.pendingRagMedia[convId] || []
              if (message.role === "assistant" && pendingMedia.length > 0) {
                if (!message.medias) {
                  message.medias = {}
                }
                if (!message.parts) {
                  message.parts = []
                }
                
                pendingMedia.forEach((media, index) => {
                  message.medias![index] = {
                    type: "rag-media",
                    data: media.url,
                    content: media.url,
                  } as IChatMedia
                  
                  message.parts!.push({
                    type: "file",
                    url: media.url,
                    mediaType: media.type,
                    name: media.id,
                  })
                })
                
                // Clear pending media after attaching
                state.pendingRagMedia[convId] = []
              }
              
              conversation.messages.push(message)
              conversation.updatedAt = Date.now()
            }
          }),

        onStreamStart: (convId: string) => {
          set((state) => {
            state.isStreaming = true
          })
        },

        onStreamEvent: (data: string, type: string, convId: string) =>
          set((state) => {
            const conversation = _getConv(
              state.allUsersConversations,
              state.currentUserId,
              convId
            )
            if (!conversation) return
            const msgTypes = ["msg", "message", "text"]

            if (
              msgTypes.includes(type) &&
              data &&
              conversation.messages.length > 0
            ) {
              const lastMessageIndex = conversation.messages.length - 1
              conversation.messages[lastMessageIndex].content += data
            } else if (type === "conversation_title") {
              conversation.title = data
            } else if (type === "related_questions") {
              try {
                const questions = JSON.parse(data)
                conversation.relatedQuestions = questions
              } catch {
                // Handle non-JSON data silently
              }
            }

            conversation.updatedAt = Date.now()
          }),

        onStreamEnd: (convId: string) =>
          set((state) => {
            state.isStreaming = false
            const conversation = _getConv(
              state.allUsersConversations,
              state.currentUserId,
              convId
            )
            if (conversation) {
              conversation.updatedAt = Date.now()
            }
          }),

        onRagMedia: (media: IRagMediaEvent, convId: string) =>
          set((state) => {
            // Buffer the RAG media - it will be attached when assistant message is created
            if (!state.pendingRagMedia[convId]) {
              state.pendingRagMedia[convId] = []
            }
            state.pendingRagMedia[convId].push(media)
          }),

        onLoadConversations: (conversations) =>
          set((state) => {
            const existingConversations =
              state.allUsersConversations[state.currentUserId] || []
            const existingIdsMap = new Map(
              existingConversations.map((conv) => [conv.id, conv])
            )
            const twoMinutesAgo = Date.now() - 2 * 60 * 1000

            const updatedConversations = conversations.reduce((acc, conv) => {
              const existing = existingIdsMap.get(conv.id)
              if (existing) {
                // Update existing conversation
                existing.title = conv.title || existing.title
                existing.updatedAt = conv.updatedAt
                existing.language = conv.language
                acc.push(existing)
              } else {
                // Add new conversation
                acc.push(conv)
              }
              return acc
            }, [] as ChatConversation[])

            // filter out old conversations that are deleted
            const recentConversations = existingConversations.filter(
              (conv) =>
                !conversations.some((c) => c.id === conv.id) &&
                conv.updatedAt > twoMinutesAgo
            )

            state.allUsersConversations[state.currentUserId] = [
              ...updatedConversations,
              ...recentConversations,
            ]
          }),
        onLoadConversationMessages: (convId, messages) =>
          set((state) => {
            const conversation = _getConv(
              state.allUsersConversations,
              state.currentUserId,
              convId
            )
            if (conversation) {
              conversation.messages = messages
            }
          }),

        onDeleteMessages: (convId: string, msgId: string) =>
          set((state) => {
            const conversation = _getConv(
              state.allUsersConversations,
              state.currentUserId,
              convId
            )
            if (conversation) {
              const msgIndex = conversation.messages.findIndex(
                (msg) => msg.id === msgId
              )
              if (msgIndex !== -1) {
                conversation.messages = conversation.messages.slice(0, msgIndex)
                conversation.updatedAt = Date.now()
              }
            }
          }),

        // Conversation management
        onAddConversations: (convs: ChatConversation[]) =>
          set((state) => {
            const userConversations =
              state.allUsersConversations[state.currentUserId]
            const existingIds = new Set(
              userConversations.map((conv) => conv.id)
            )
            const uniqueConvs = convs.filter(
              (conv) => !existingIds.has(conv.id)
            )
            userConversations.push(...uniqueConvs)
          }),

        onCreateConversation: (
          convId: string,
          title: string,
          assistantPrompt: string,
          lang: string
        ) =>
          set((state) => {
            if (!state.allUsersConversations[state.currentUserId]) {
              state.allUsersConversations[state.currentUserId] = []
            }
            const newConv: ChatConversation = {
              id: convId,
              title,
              messages: [
                {
                  role: "assistant",
                  content: assistantPrompt,
                  createdAt: Date.now(),
                },
              ],
              createdAt: Date.now(),
              updatedAt: Date.now(),
              relatedArticles: [],
              relatedQuestions: [],
              isStarred: false,
              isPinned: false,
              isArchived: false,
              votes: [],
              language: lang,
            }
            state.allUsersConversations[state.currentUserId].push(newConv)
            state.currentConversationId = convId

            console.log("Created new conversation:", newConv)
          }),

        onSwitchConversation: (newId: string | null) =>
          set((state) => {
            state.currentConversationId = newId
          }),

        onSwitchConversationWithMessages: (
          convId: string,
          messages: IChatMessage[]
        ) =>
          set((state) => {
            // Load messages first
            const conversation = _getConv(
              state.allUsersConversations,
              state.currentUserId,
              convId
            )
            if (conversation) {
              conversation.messages = messages
              // Update the updatedAt timestamp
              conversation.updatedAt = Date.now()
            }
            // Then switch to the conversation
            state.currentConversationId = convId
          }),

        onUpdateConversationTitle: (id, title) =>
          set((state) => {
            const conversation = _getConv(
              state.allUsersConversations,
              state.currentUserId,
              id
            )
            if (conversation) {
              conversation.title = title
              conversation.updatedAt = Date.now()
            }
          }),

        onDeleteConversation: (id) =>
          set((state) => {
            if (state.currentConversationId === id) {
              state.currentConversationId = null
            }
            state.allUsersConversations[state.currentUserId] =
              state.allUsersConversations[state.currentUserId]?.filter(
                (c) => c.id !== id
              )
          }),

        onBulkDeleteConversations: (convIds) =>
          set((state) => {
            const idsSet = new Set(convIds)
            if (
              state.currentConversationId &&
              idsSet.has(state.currentConversationId)
            ) {
              state.currentConversationId = null
            }
            state.allUsersConversations[state.currentUserId] =
              state.allUsersConversations[state.currentUserId]?.filter(
                (c) => !idsSet.has(c.id)
              )
          }),

        // Enhanced conversation management
        onStarConversation: (convId) =>
          set((state) => {
            const conversation = _getConv(
              state.allUsersConversations,
              state.currentUserId,
              convId
            )
            if (conversation) {
              conversation.isStarred = !conversation.isStarred
              conversation.updatedAt = Date.now()
            }
          }),

        onPinConversation: (convId) =>
          set((state) => {
            const conversation = _getConv(
              state.allUsersConversations,
              state.currentUserId,
              convId
            )
            if (conversation) {
              conversation.isPinned = !conversation.isPinned
              conversation.updatedAt = Date.now()
            }
          }),

        onArchiveConversation: (convId) =>
          set((state) => {
            const conversation = _getConv(
              state.allUsersConversations,
              state.currentUserId,
              convId
            )
            if (conversation) {
              conversation.isArchived = !conversation.isArchived
              conversation.updatedAt = Date.now()
            }
          }),

        onBulkArchiveConversations: (convIds) =>
          set((state) => {
            const idsSet = new Set(convIds)
            if (state.allUsersConversations[state.currentUserId]) {
              state.allUsersConversations[state.currentUserId].forEach(
                (conv) => {
                  if (idsSet.has(conv.id)) {
                    conv.isArchived = true
                    conv.updatedAt = Date.now()
                  }
                }
              )
            }
          }),

        // Related content management
        onSetRelatedArticles: (convId, articles) =>
          set((state) => {
            const conversation = _getConv(
              state.allUsersConversations,
              state.currentUserId,
              convId
            )
            if (conversation) {
              conversation.relatedArticles = articles
              conversation.updatedAt = Date.now()
            }
          }),

        onSetRelatedQuestions: (convId, questions) =>
          set((state) => {
            const conversation = _getConv(
              state.allUsersConversations,
              state.currentUserId,
              convId
            )
            if (conversation) {
              conversation.relatedQuestions = questions
              conversation.updatedAt = Date.now()
            }
          }),

        // Vote management
        onVoteMessage: (convId, messageId, isUpvoted) =>
          set((state) => {
            const conversation = _getConv(
              state.allUsersConversations,
              state.currentUserId,
              convId
            )
            if (conversation) {
              // Remove existing vote for this message
              conversation.votes =
                conversation.votes?.filter((v) => v.messageId !== messageId) ??
                []

              // Add new vote
              conversation.votes?.push({
                messageId,
                isUpvoted,
                chatId: convId,
              })
              conversation.updatedAt = Date.now()
            }
          }),

        getMessageVote: (convId, messageId) => {
          const state = get()
          const conversation = _getConv(
            state.allUsersConversations,
            state.currentUserId,
            convId
          )
          return conversation?.votes?.find((v) => v.messageId === messageId)
        },

        // Computed selectors
        getStarredConversations: () => {
          const state = get()
          const conversations = state.allUsersConversations[state.currentUserId]
          return conversations.filter(
            (conv) => conv.isStarred && !conv.isArchived
          )
        },

        getPinnedConversations: () => {
          const state = get()
          const conversations = state.allUsersConversations[state.currentUserId]
          return conversations
            .filter((conv) => conv.isPinned && !conv.isArchived)
            .sort((a, b) => b.updatedAt - a.updatedAt)
        },

        getArchivedConversations: () => {
          const state = get()
          const conversations = state.allUsersConversations[state.currentUserId]
          return conversations
            .filter((conv) => conv.isArchived)
            .sort((a, b) => b.updatedAt - a.updatedAt)
        },

        getActiveConversations: () => {
          const state = get()
          const conversations = state.allUsersConversations[state.currentUserId]
          return conversations
            .filter((conv) => !conv.isArchived)
            .sort((a, b) => {
              // Pinned conversations first
              if (a.isPinned && !b.isPinned) return -1
              if (!a.isPinned && b.isPinned) return 1
              // Then by update time
              return b.updatedAt - a.updatedAt
            })
        },

        searchConversations: (query: string) => {
          const state = get()
          const conversations = state.allUsersConversations[state.currentUserId]
          const lowercaseQuery = query.toLowerCase()
          return conversations.filter(
            (conv) =>
              !conv.isArchived &&
              (conv.title?.toLowerCase().includes(lowercaseQuery) ||
                conv.messages.some((msg) =>
                  msg.content.toLowerCase().includes(lowercaseQuery)
                ))
          )
        },
      })),
      {
        name: "chats",
        storage: createJSONStorage(() => indexDBStorage),
        partialize: (state) => ({
          allUsersConversations: state.allUsersConversations,
        }),
      }
    ),
    {
      name: "chat-store",
    }
  )
)
