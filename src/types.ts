// Common types for the floating chat widget
export interface IChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
  medias?: Record<number, IChatMedia>
}

export interface IChatMedia {
  type: 'audio' | 'image' | 'file'
  content?: string
  data?: string
  name?: string
  size?: number
}

export interface FloatingChatProps {
  // Optional props to customize the widget
  title?: string
  placeholder?: string
  maxLength?: number
  showFileUpload?: boolean
  className?: string
  // Callback functions that must be provided by the consuming app
  onSubmit: (content: string, attachments?: IChatMedia[]) => Promise<void>
  onClear?: () => void
  // State management props
  isOpen?: boolean
  onToggle?: (open: boolean) => void
  messages?: IChatMessage[]
  isLoading?: boolean
}