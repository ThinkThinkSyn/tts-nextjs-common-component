"use client"

import { IChatMessage, IChatMedia, IRagMediaEvent } from "@/types/chat.type"
import { create } from "zustand"
import { persist, createJSONStorage, devtools } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { indexDBStorage } from "@/utils/storage"
import { createConversationId, startChatSSE } from "@/utils/chat"

export const SUBMIT_ERRORS = Object.freeze({
  NO_MSG: "Please enter a message",
  FAIL_CONV: "Failed to start conversation. Please try again.",
  FAIL_RESP: "Failed to get response. Please try again.",
})

interface FloatingChatState {
  /** Whether the floating chat widget is open/expanded */
  isOpen: boolean
  /** Messages in the floating chat widget */
  messages: IChatMessage[]
  /** Whether the chat is currently streaming/loading */
  isLoading: boolean
  /** Input value for the chat */
  input: string
  /** Current conversation ID */
  conversationId: string | null
  /** Whether the clear dialog is shown */
  showClearDialog: boolean
}

interface FloatingChatActions {
  /** Toggle the floating chat widget open/closed */
  toggleOpen: () => void
  /** Set the open state explicitly */
  setOpen: (isOpen: boolean) => void
  /** Add a message to the floating chat */
  addMessage: (message: IChatMessage) => void
  /** Clear all messages */
  clearMessages: () => void
  /** Set loading state */
  setLoading: (isLoading: boolean) => void
  /** Set input value */
  setInput: (input: string) => void
  /** Update the last message content (for streaming) */
  updateLastMessage: (content: string) => void
  /** Add RAG media to the last message */
  onRagMedia: (media: IRagMediaEvent) => void
  /** Start streaming response */
  startStreaming: () => void
  /** End streaming response */
  endStreaming: () => void
  /** Set conversation ID */
  setConversationId: (id: string | null) => void
  /** Set show clear dialog state */
  setShowClearDialog: (show: boolean) => void
  /** Handle stop action */
  handleStop: () => void
  /** Handle minimize action */
  handleMinimize: () => void
  /** Handle clear conversation action */
  handleClearConversation: () => void
  /** Handle confirm clear action */
  handleConfirmClear: (t: (key: string) => string) => void
  /** Handle cancel clear action */
  handleCancelClear: () => void
  /** Handle submit message action */
  handleSubmit: (
    content: string,
    attachments: IChatMedia[] | undefined,
    config: {
      userEndpoint: string
      guestEndpoint: string
      defaultTitle: string
      userAccessToken: string | undefined
      /** URL to fetch conversation ID from, or a custom function that returns a conversation ID */
      conversationIdSource?: string | (() => Promise<string>)
    }
  ) => Promise<(typeof SUBMIT_ERRORS)[keyof typeof SUBMIT_ERRORS] | undefined>
}

type FloatingChatStore = FloatingChatState & FloatingChatActions

export const useFloatingChatStore = create<FloatingChatStore>()(
  devtools(
    persist(
      immer((set) => ({
        // Initial state
        isOpen: false,
        messages: [],
        isLoading: false,
        input: "",
        conversationId: null,
        showClearDialog: false,

        // Actions
        toggleOpen: () =>
          set((state) => {
            state.isOpen = !state.isOpen
          }),

        setOpen: (isOpen: boolean) =>
          set((state) => {
            state.isOpen = isOpen
          }),

        addMessage: (message: IChatMessage) =>
          set((state) => {
            state.messages.push(message)
          }),

        clearMessages: () =>
          set((state) => {
            state.messages = []
          }),

        setLoading: (isLoading: boolean) =>
          set((state) => {
            state.isLoading = isLoading
          }),

        setInput: (input: string) =>
          set((state) => {
            state.input = input
          }),

        updateLastMessage: (content: string) =>
          set((state) => {
            if (state.messages.length > 0) {
              const lastMessageIndex = state.messages.length - 1
              state.messages[lastMessageIndex].content += content
            }
          }),

        onRagMedia: (media: IRagMediaEvent) =>
          set((state) => {
            if (state.messages.length > 0) {
              const lastMessageIndex = state.messages.length - 1
              const lastMessage = state.messages[lastMessageIndex]

              // Initialize medias if not present
              if (!lastMessage.medias) {
                lastMessage.medias = {}
              }

              // Find the next available index for the media
              const existingIndices = Object.keys(lastMessage.medias).map(Number)
              const nextIndex = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 0

              // Add the RAG media to the message
              lastMessage.medias[nextIndex] = {
                type: "rag-media",
                data: media.url,
                content: media.url,
              } as IChatMedia

              // Also add to parts for multimodal rendering
              if (!lastMessage.parts) {
                lastMessage.parts = []
              }
              lastMessage.parts.push({
                type: "file",
                url: media.url,
                mediaType: media.type,
                name: media.id,
              })
            }
          }),

        startStreaming: () =>
          set((state) => {
            state.isLoading = true
            // Add empty assistant message for streaming
            state.messages.push({
              role: "assistant",
              content: "",
              createdAt: Date.now(),
            })
          }),

        endStreaming: () =>
          set((state) => {
            state.isLoading = false
          }),

        setConversationId: (id: string | null) =>
          set((state) => {
            state.conversationId = id
          }),

        setShowClearDialog: (show: boolean) =>
          set((state) => {
            state.showClearDialog = show
          }),

        handleStop: () =>
          set((state) => {
            state.isLoading = false
          }),

        handleMinimize: () =>
          set((state) => {
            state.isOpen = false
          }),

        handleClearConversation: () =>
          set((state) => {
            state.showClearDialog = true
          }),

        handleConfirmClear: () =>
          set((state) => {
            state.messages = []
            state.conversationId = null
            state.input = ""
            state.showClearDialog = false
          }),

        handleCancelClear: () =>
          set((state) => {
            state.showClearDialog = false
          }),

        handleSubmit: async (
          content: string,
          attachments: IChatMedia[] | undefined,
          config: {
            userEndpoint: string
            guestEndpoint: string
            defaultTitle: string
            userAccessToken: string | undefined
            /** URL to fetch conversation ID from, or a custom function that returns a conversation ID */
            conversationIdSource?: string | (() => Promise<string>)
          }
        ) => {
          const state = useFloatingChatStore.getState()

          if (!content.trim() && (!attachments || attachments.length === 0)) {
            return SUBMIT_ERRORS.NO_MSG
          }

          // Create conversation ID if not exists
          let currentConversationId = state.conversationId
          if (!currentConversationId) {
            try {
              // Support custom function or URL for conversation ID creation
              if (typeof config.conversationIdSource === "function") {
                currentConversationId = await config.conversationIdSource()
              } else {
                currentConversationId = await createConversationId(
                  config.conversationIdSource
                )
              }
              useFloatingChatStore
                .getState()
                .setConversationId(currentConversationId)
            } catch (error) {
              console.error("Failed to create conversation ID:", error)
              return SUBMIT_ERRORS.FAIL_CONV
            }
          }

          // Add user message
          const userMessage: IChatMessage = {
            role: "user",
            content: content.trim(),
            createdAt: Date.now(),
          }

          if (attachments && attachments.length > 0) {
            const filteredMedias = attachments
              .map((media, i) =>
                media.type === "audio" || media.type === "image"
                  ? [
                      i,
                      {
                        ...media,
                        content: media.content ?? (media as any).data,
                      },
                    ]
                  : null
              )
              .filter(Boolean) as [number, IChatMedia][]
            if (filteredMedias.length > 0) {
              userMessage.medias = Object.fromEntries(filteredMedias)
            }
          }

          const storeActions = useFloatingChatStore.getState()
          storeActions.addMessage(userMessage)
          storeActions.setInput("")
          storeActions.setLoading(true)

          try {
            startChatSSE({
              userEndpoint: config.userEndpoint,
              guestEndpoint: config.guestEndpoint,
              conversation: {
                messages: state.messages,
                title: config.defaultTitle,
              },
              conversationId: currentConversationId,
              newMessage: userMessage,
              userAccessToken: config.userAccessToken,
              onAddMessage: (message) => {
                useFloatingChatStore.getState().addMessage(message)
              },
              onStreamStart: () =>
                useFloatingChatStore.getState().setLoading(true),
              onStreamEvent: (data, type) => {
                if (["msg", "message", "text"].includes(type) && data) {
                  useFloatingChatStore.getState().updateLastMessage(data)
                }
              },
              onRagMedia: (media) => {
                useFloatingChatStore.getState().onRagMedia(media)
              },
              setIsLoading: useFloatingChatStore.getState().setLoading,
              onStreamEnd: () => {
                useFloatingChatStore.getState().setLoading(false)
              },
            })
          } catch (error: any) {
            useFloatingChatStore.getState().setLoading(false)
            console.error("Floating chat error:", error)
            return SUBMIT_ERRORS.FAIL_RESP
          }
        },
      })),
      {
        name: "floating-chat",
        storage: createJSONStorage(() => indexDBStorage),
        partialize: (state) => ({
          messages: state.messages,
          isOpen: state.isOpen,
        }),
        // Skip hydration on first render to prevent suspension
        skipHydration: true,
      }
    ),
    {
      name: "floating-chat-store",
    }
  )
)
