"use client"

import { IChatMessage, IChatMedia, IRagMediaEvent } from "@/types/chat.type"
import { create } from "zustand"
import { persist, createJSONStorage, devtools, StateStorage } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { indexDBStorage } from "@/utils/storage"
import { createConversationId, startChatSSE } from "@/utils/chat"

export const SUBMIT_ERRORS = Object.freeze({
  NO_MSG: "Please enter a message",
  FAIL_CONV: "Failed to start conversation. Please try again.",
  FAIL_RESP: "Failed to get response. Please try again.",
})

/** Configuration for submitting messages */
export interface SubmitConfig {
  userEndpoint: string
  guestEndpoint: string
  defaultTitle: string
  userAccessToken: string | undefined
  /** URL to fetch conversation ID from, or a custom function that returns a conversation ID */
  conversationIdSource?: string | (() => Promise<string>)
  /** Custom parameters to be included in the request body */
  customParams?: Record<string, any>
}

/** Custom handlers for chat operations */
export interface ChatHandlers {
  /** Custom submit handler - if provided, overrides default implementation */
  onSubmit?: (
    content: string,
    attachments: IChatMedia[] | undefined,
    context: {
      messages: IChatMessage[]
      conversationId: string | null
      config: SubmitConfig
    }
  ) => Promise<{
    error?: string
    conversationId?: string
    connection?: any
  }>
  
  /** Custom conversation ID creator */
  createConversationId?: (
    source?: string | (() => Promise<string>)
  ) => Promise<string>
  
  /** Custom message validator */
  validateMessage?: (
    content: string,
    attachments?: IChatMedia[]
  ) => string | undefined
  
  /** Custom error handler */
  onError?: (error: Error) => void
  
  /** Custom message transformer before adding to state */
  transformMessage?: (message: IChatMessage) => IChatMessage
  
  /** Custom clear handler */
  onClear?: () => void | Promise<void>
}

/** Storage configuration */
export interface StorageConfig {
  /** Storage strategy (default: indexDB) */
  storage?: StateStorage
  /** Storage key name (default: 'floating-chat') */
  name?: string
  /** Whether to enable devtools (default: true) */
  enableDevtools?: boolean
  /** Whether to skip hydration on mount (default: true) */
  skipHydration?: boolean
}

/** Complete configuration for floating chat store */
export interface FloatingChatConfig {
  /** Custom handlers for chat operations */
  handlers?: ChatHandlers
  /** Storage configuration */
  storage?: StorageConfig
  /** Default submit configuration (can be overridden per submit) */
  defaultSubmitConfig?: Partial<SubmitConfig>
}

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
  /** Current conversation title */
  conversationTitle: string | null
  /** Related questions for the current conversation */
  relatedQuestions: string[]
  /** Whether the clear dialog is shown */
  showClearDialog: boolean
  /** Last error that occurred */
  error: Error | null
  /** Pending RAG media to be attached to the next assistant message */
  pendingRagMedia: IRagMediaEvent[]
  /** Active SSE connection */
  sseConnection: any | null
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
  /** Update the last message log/status message */
  updateLastMessageLog: (logMessage: string) => void
  /** Add RAG media to the last message */
  onRagMedia: (media: IRagMediaEvent) => void
  /** Start streaming response */
  startStreaming: () => void
  /** End streaming response */
  endStreaming: () => void
  /** Set conversation ID */
  setConversationId: (id: string | null) => void
  /** Set conversation title */
  setConversationTitle: (title: string) => void
  /** Set related questions */
  setRelatedQuestions: (questions: string[]) => void
  /** Set show clear dialog state */
  setShowClearDialog: (show: boolean) => void
  /** Set error state */
  setError: (error: Error | null) => void
  /** Clear error state */
  clearError: () => void
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
    config: SubmitConfig
  ) => Promise<(typeof SUBMIT_ERRORS)[keyof typeof SUBMIT_ERRORS] | undefined>
}

type FloatingChatStore = FloatingChatState & FloatingChatActions

/** Create a configured floating chat store */
export const createFloatingChatStore = (config?: FloatingChatConfig) => {
  const {
    handlers = {},
    storage: storageConfig = {},
    defaultSubmitConfig = {},
  } = config || {}

  const {
    storage = indexDBStorage,
    name = "floating-chat",
    enableDevtools = true,
    skipHydration = true,
  } = storageConfig

  const storeCreator = immer<FloatingChatStore>((set) => ({
        // Initial state
        isOpen: false,
        messages: [],
        isLoading: false,
        input: "",
        conversationId: null,
        conversationTitle: null,
        relatedQuestions: [],
        showClearDialog: false,
        error: null,
        pendingRagMedia: [],
        sseConnection: null,

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
            // Apply custom message transformer if provided
            let processedMessage = handlers.transformMessage
              ? handlers.transformMessage(message)
              : message

            // If this is an assistant message and we have pending RAG media, attach it
            if (processedMessage.role === "assistant" && state.pendingRagMedia.length > 0) {
              if (!processedMessage.medias) {
                processedMessage.medias = {}
              }
              if (!processedMessage.parts) {
                processedMessage.parts = []
              }
              
              state.pendingRagMedia.forEach((media, index) => {
                processedMessage.medias![index] = {
                  type: "rag-media",
                  data: media.url,
                  fileName: media.id,
                } as IChatMedia
                
                processedMessage.parts!.push({
                  type: "file",
                  url: media.url,
                  mediaType: media.type,
                  name: media.id,
                })
              })
              
              // Clear pending media after attaching
              state.pendingRagMedia = []
            }
            
            state.messages.push(processedMessage)
          }),

        clearMessages: () =>
          set((state) => {
            state.messages = []
            state.pendingRagMedia = []
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

        updateLastMessageLog: (logMessage: string) =>
          set((state) => {
            if (state.messages.length > 0) {
              const lastMessageIndex = state.messages.length - 1
              // Only update log if the message doesn't have content yet
              // This ensures log messages show before actual content
              if (state.messages[lastMessageIndex].role === "assistant") {
                state.messages[lastMessageIndex].logMessage = logMessage
              }
            }
          }),

        onRagMedia: (media: IRagMediaEvent) =>
          set((state) => {
            // Buffer the RAG media - it will be attached when assistant message is created
            state.pendingRagMedia.push(media)
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

        setConversationTitle: (title: string) =>
          set((state) => {
            state.conversationTitle = title
          }),

        setRelatedQuestions: (questions: string[]) =>
          set((state) => {
            state.relatedQuestions = questions
          }),

        setShowClearDialog: (show: boolean) =>
          set((state) => {
            state.showClearDialog = show
          }),

        setError: (error: Error | null) =>
          set((state) => {
            state.error = error
            if (error && handlers.onError) {
              handlers.onError(error)
            }
          }),

        clearError: () =>
          set((state) => {
            state.error = null
          }),

        handleStop: () =>
          set((state) => {
            state.isLoading = false
            if (state.sseConnection) {
              state.sseConnection.close()
              state.sseConnection = null
            }
          }),

        handleMinimize: () =>
          set((state) => {
            state.isOpen = false
          }),

        handleClearConversation: () =>
          set((state) => {
            state.showClearDialog = true
          }),

        handleConfirmClear: async () => {
          // Call custom clear handler if provided
          if (handlers.onClear) {
            await handlers.onClear()
          }
          
          set((state) => {
            state.messages = []
            state.conversationId = null
            state.conversationTitle = null
            state.relatedQuestions = []
            state.input = ""
            state.showClearDialog = false
            state.pendingRagMedia = []
          })
        },

        handleCancelClear: () =>
          set((state) => {
            state.showClearDialog = false
          }),

        handleSubmit: async (
          content: string,
          attachments: IChatMedia[] | undefined,
          config: SubmitConfig
        ) => {
          // Merge with default config
          const finalConfig = { ...defaultSubmitConfig, ...config } as SubmitConfig
          
          const getState = () => {
            // Use a local reference that will be bound to the actual store
            const boundStore = storeRef.current
            return boundStore ? boundStore.getState() : null
          }
          
          const state = getState()
          if (!state) return SUBMIT_ERRORS.FAIL_RESP

          // Use custom validator if provided
          if (handlers.validateMessage) {
            const validationError = handlers.validateMessage(content, attachments)
            if (validationError) {
              return validationError as any
            }
          } else {
            // Default validation
            if (!content.trim() && (!attachments || attachments.length === 0)) {
              return SUBMIT_ERRORS.NO_MSG
            }
          }

          // Create conversation ID if not exists
          let currentConversationId = state.conversationId
          if (!currentConversationId) {
            try {
              // Use custom conversation ID creator if provided
              if (handlers.createConversationId) {
                currentConversationId = await handlers.createConversationId(
                  finalConfig.conversationIdSource
                )
              } else {
                // Default implementation
                if (typeof finalConfig.conversationIdSource === "function") {
                  currentConversationId = await finalConfig.conversationIdSource()
                } else {
                  currentConversationId = await createConversationId(
                    finalConfig.conversationIdSource
                  )
                }
              }
              getState()?.setConversationId(currentConversationId)
            } catch (error) {
              console.error("Failed to create conversation ID:", error)
              const storeActions = getState()
              if (storeActions) {
                storeActions.setError(error as Error)
                storeActions.setLoading(false)
              }
              return SUBMIT_ERRORS.FAIL_CONV
            }
          }

          // Use custom submit handler if provided
          if (handlers.onSubmit) {
            const storeActions = getState()
            if (!storeActions) return SUBMIT_ERRORS.FAIL_RESP
            
            storeActions.setInput("")
            storeActions.setLoading(true)
            storeActions.clearError()

            try {
              const result = await handlers.onSubmit(content, attachments, {
                messages: state.messages,
                conversationId: currentConversationId,
                config: finalConfig,
              })

              if (result.error) {
                getState()?.setLoading(false)
                return result.error as any
              }

              if (result.conversationId) {
                getState()?.setConversationId(result.conversationId)
              }

              if (result.connection) {
                const boundStore = storeRef.current
                if (boundStore) {
                  boundStore.setState({ sseConnection: result.connection })
                }
              }

              return undefined
            } catch (error: any) {
              const storeActions = getState()
              if (storeActions) {
                storeActions.setLoading(false)
                storeActions.setError(error)
                // Clean up pending RAG media on error
                const boundStore = storeRef.current
                if (boundStore) {
                  boundStore.setState({ pendingRagMedia: [] })
                }
              }
              console.error("Custom submit handler error:", error)
              return SUBMIT_ERRORS.FAIL_RESP
            }
          }

          // Default implementation
          const userMessage: IChatMessage = {
            role: "user",
            content: content.trim(),
            createdAt: Date.now(),
          }

          if (attachments && attachments.length > 0) {
            const filteredMedias = attachments
              .map((media, i) =>
                media.type === "audio" || media.type === "image"
                  ? [i, media]
                  : null
              )
              .filter(Boolean) as [number, IChatMedia][]
            if (filteredMedias.length > 0) {
              userMessage.medias = Object.fromEntries(filteredMedias)
            }
          }

          const storeActions = getState()
          if (!storeActions) return SUBMIT_ERRORS.FAIL_RESP
          
          storeActions.addMessage(userMessage)
          storeActions.setInput("")
          storeActions.setLoading(true)
          storeActions.clearError()

          try {
            const connection = startChatSSE({
              userEndpoint: finalConfig.userEndpoint,
              guestEndpoint: finalConfig.guestEndpoint,
              conversation: {
                messages: state.messages,
                title: finalConfig.defaultTitle,
              },
              conversationId: currentConversationId,
              newMessage: userMessage,
              userAccessToken: finalConfig.userAccessToken,
              customParams: finalConfig.customParams,
              onAddMessage: (message) => {
                getState()?.addMessage(message)
              },
              onStreamStart: () => getState()?.setLoading(true),
              onStreamEvent: (data, type) => {
                if (["msg", "message", "text"].includes(type) && data) {
                  getState()?.updateLastMessage(data)
                } else if (type === "log" && data) {
                  // Handle log events - parse the log data and update last message
                  try {
                    const logData = typeof data === "string" ? JSON.parse(data) : data
                    if (logData.message) {
                      getState()?.updateLastMessageLog(logData.message)
                    }
                  } catch (error) {
                    console.error("Failed to parse log event:", error)
                  }
                } else if (type === "conversation_title" && data) {
                  getState()?.setConversationTitle(data)
                } else if (type === "related_questions" && data) {
                  try {
                    const questions = JSON.parse(data)
                    getState()?.setRelatedQuestions(questions)
                  } catch (error) {
                    console.error("Failed to parse related_questions:", error)
                  }
                }
              },
              onRagMedia: (media) => {
                getState()?.onRagMedia(media)
              },
              onError: (error) => {
                getState()?.setError(error)
              },
              setIsLoading: (loading) => getState()?.setLoading(loading),
              onStreamEnd: () => {
                const currentState = getState()
                currentState?.setLoading(false)
                // Clear the connection reference
                const boundStore = storeRef.current
                if (boundStore) {
                  boundStore.setState({ sseConnection: null })
                }
              },
            })
            
            // Store the connection so handleStop can close it
            const boundStore = storeRef.current
            if (boundStore) {
              boundStore.setState({ sseConnection: connection })
            }
          } catch (error: any) {
            const storeActions = getState()
            if (storeActions) {
              storeActions.setLoading(false)
              storeActions.setError(error)
              // Clean up pending RAG media on error
              const boundStore = storeRef.current
              if (boundStore) {
                boundStore.setState({ pendingRagMedia: [] })
              }
            }
            console.error("Floating chat error:", error)
            return SUBMIT_ERRORS.FAIL_RESP
          }
        },
      }))

  const middlewareStack = enableDevtools
    ? devtools(
        persist(storeCreator, {
          name,
          storage: createJSONStorage(() => storage),
          partialize: (state) => ({
            messages: state.messages,
            isOpen: state.isOpen,
          }),
          skipHydration,
        }),
        { name: `${name}-store` }
      )
    : persist(storeCreator, {
        name,
        storage: createJSONStorage(() => storage),
        partialize: (state) => ({
          messages: state.messages,
          isOpen: state.isOpen,
        }),
        skipHydration,
      })

  // Store reference for internal use - create before store to avoid race conditions
  // Using any to avoid complex Zustand type gymnastics
  const storeRef: { current: any } = { current: null }
  
  const store = create<FloatingChatStore>()(middlewareStack as any)
  storeRef.current = store

  return store
}

/** Default instance for backward compatibility */
export const useFloatingChatStore = createFloatingChatStore()
