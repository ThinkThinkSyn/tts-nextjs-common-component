"use client"

import { IChatMessage, IChatMedia } from "@/types/chat.type"
import { create } from "zustand"
import { persist, createJSONStorage, devtools } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { indexDBStorage } from "@/utils/storage"
import { toast } from "sonner"
import { createConversationId, startChatSSE } from "@/utils/chat"

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
      t: (key: string) => string
    }
  ) => Promise<void>
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

        handleConfirmClear: (t: (key: string) => string) =>
          set((state) => {
            state.messages = []
            state.conversationId = null
            state.input = ""
            state.showClearDialog = false
            toast.success(t("Conversation cleared successfully"))
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
            t: (key: string) => string
          }
        ) => {
          const state = useFloatingChatStore.getState()

          if (!content.trim() && (!attachments || attachments.length === 0)) {
            toast.error(config.t("Please enter a message"))
            return
          }

          // Create conversation ID if not exists
          let currentConversationId = state.conversationId
          if (!currentConversationId) {
            try {
              currentConversationId = await createConversationId()
              useFloatingChatStore
                .getState()
                .setConversationId(currentConversationId)
            } catch (error) {
              console.error("Failed to create conversation ID:", error)
              toast.error(
                config.t("Failed to start conversation. Please try again.")
              )
              return
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
              setIsLoading: useFloatingChatStore.getState().setLoading,
              onStreamEnd: () => {
                useFloatingChatStore.getState().setLoading(false)
              },
            })
          } catch (error: any) {
            useFloatingChatStore.getState().setLoading(false)
            toast.error(config.t("Failed to get response. Please try again."))
            console.error("Floating chat error:", error)
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
