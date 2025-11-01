"use client"

import { type IChatMedia } from "@/types/chat.type"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

export interface ChatMedia extends IChatMedia {
  fileName?: string
  fileSize?: number
  fileType?: string
}

interface ChatInputState {
  attachments: ChatMedia[]
  previewImg: string | null
}

interface ChatInputActions {
  setAttachments: (attachments: ChatMedia[]) => void
  addAttachment: (attachment: ChatMedia) => void
  removeAttachment: (index: number) => void
  clearAttachments: () => void
  setPreviewImg: (img: string | null) => void
}

type ChatInputStore = ChatInputState & ChatInputActions

export const useChatInputStore = create<ChatInputStore>()(
  immer((set) => ({
    // Initial state
    attachments: [],
    previewImg: null,

    // Actions
    setAttachments: (attachments: ChatMedia[]) =>
      set((state) => {
        state.attachments = attachments
      }),

    addAttachment: (attachment: ChatMedia) =>
      set((state) => {
        state.attachments.push(attachment)
      }),

    removeAttachment: (index: number) =>
      set((state) => {
        state.attachments = state.attachments.filter((_, i) => i !== index)
      }),

    clearAttachments: () =>
      set((state) => {
        state.attachments = []
      }),

    setPreviewImg: (img: string | null) =>
      set((state) => {
        state.previewImg = img
      }),
  }))
)
