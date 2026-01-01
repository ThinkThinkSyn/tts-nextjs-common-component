export type ChatRole = "user" | "assistant" | "system" | "lawyer"
export type ChatMediaType = "image" | "video" | "audio" | "file" | "rag-media"
export type ChatMedias = Record<number, IChatMedia>

/** RAG media event data from SSE stream */
export interface IRagMediaEvent {
  url: string
  type: string
  id: string
}

export interface IChatMedia {
  type: ChatMediaType
  content?: string | Blob
  data: string | Blob
  fileType?: string
  fileSize?: number
  fileName?: string
}

export interface IChatPrompt {
  /**Content of the message, can be text or a combination of text and media tags. */
  content: string
  /**Medias within this message. It can refer to 1 media tag `<__MEDIA_X__> in `content`.
   * e.g. {0: {type: 'image', url: 'https://example.com/image.png'}, ...} */
  medias?: ChatMedias
}

export interface IChatMessage extends IChatPrompt {
  /**Unique identifier for the message, can be a UUID or any unique string */
  id?: string
  role: ChatRole
  /**Timestamp of the message, used for sorting and display */
  createdAt: number
  history_index?: number
  /**Message parts for multimodal content */
  parts?: Array<ChatMessagePart>
}

export interface ChatMessagePart {
  type: "text" | "file"
  text?: string
  url?: string
  name?: string
  mediaType?: string
}

export interface DbConversation {
  id: string
  title: string | null
  description?: string | null
  messages: IChatMessage[]
  createdAt: number
  updatedAt: number
  language: string
}

export interface IArticles {
  id: string
  title: string
  excerpt: string
}

export interface Attachment {
  name: string
  url: string
  contentType: string
}

// Vercel AI SDK compatible types
export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  parts: Array<ChatMessagePart>
  createdAt?: Date
}

export interface Vote {
  messageId: string
  isUpvoted: boolean
  chatId?: string
}
