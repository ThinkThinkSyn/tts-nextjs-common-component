"use client"

import { IChatMessage } from "@/types/chat.type"
import { create } from "zustand"
import { persist, createJSONStorage, devtools } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { indexDBStorage } from "@/utils/storage"

interface FloatingChatState {
  /** Whether the floating chat widget is open/expanded */
  isOpen: boolean
  /** Messages in the floating chat widget */
  messages: IChatMessage[]
  /** Whether the chat is currently streaming/loading */
  isLoading: boolean
  /** Input value for the chat */
  input: string
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
