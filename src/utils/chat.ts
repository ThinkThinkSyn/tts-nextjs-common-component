import { ChatConversation } from "@/store/chat.store"
import { IChatMessage, IRagMediaEvent } from "@/types/chat.type"
import { SSE } from "sse.js"

type ChatReceiptEventData = {
  conversation_id: string
  input_token_count: number
  output_token_count: number
}

export interface StartChatSSEOptions {
  userEndpoint: string
  guestEndpoint: string
  conversation: Pick<ChatConversation, "messages" | "title">
  conversationId: string
  newMessage: IChatMessage
  userAccessToken: string | undefined
  onAddMessage: (msg: IChatMessage, convId: string) => void
  onStreamStart: (convId: string) => void
  onStreamEvent: (data: string, type: string, convId: string) => void
  onRagMedia?: (media: IRagMediaEvent, convId: string) => void
  onError?: (error: Error, convId: string) => void
  setIsLoading: (loading: boolean) => void
  onStreamEnd: (convId: string) => void
}

export function startChatSSE(options: StartChatSSEOptions) {
  const {
    userEndpoint,
    guestEndpoint,
    conversation,
    conversationId,
    newMessage,
    userAccessToken,
    onAddMessage,
    onStreamStart,
    onStreamEvent,
    onRagMedia,
    onError,
    setIsLoading,
    onStreamEnd,
  } = options
  let sseConnection: SSE | null = null

  const chatResponseSource = userAccessToken
    ? new SSE(`${userEndpoint}/${conversationId}`, {
        payload: JSON.stringify({
          title: conversation.title,
          inputs: [newMessage],
        }),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Token": userAccessToken,
        },
      })
    : new SSE(guestEndpoint, {
        payload: JSON.stringify({
          title: conversation.title,
          inputs: [...conversation.messages, newMessage],
        }),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

  let hasReceivedContent = false
  onStreamStart(conversationId)

  chatResponseSource.onmessage = (ev) => {
    const messageData = ev.data?.trim()
    if (messageData && messageData !== "") {
      if (!hasReceivedContent) {
        hasReceivedContent = true
        onAddMessage(
          { role: "assistant", content: "", createdAt: Date.now() },
          conversationId
        )
      }
    }
    onStreamEvent(ev.data, ev.type, conversationId)
  }

  chatResponseSource.onerror = (ev) => {
    console.error("sse error:", ev)
    setIsLoading(false)
    onStreamEnd(conversationId)
    if (sseConnection) sseConnection.close()
    
    const error = new Error("Chat connection error, please try again later.")
    if (onError) {
      onError(error, conversationId)
    }
  }

  chatResponseSource.onabort = () => {
    console.warn("sse connection aborted")
    setIsLoading(false)
    onStreamEnd(conversationId)
    if (sseConnection) sseConnection.close()
  }

  chatResponseSource.addEventListener(
    "related_questions",
    (ev: MessageEvent) => {
      try {
        onStreamEvent(ev.data, "related_questions", conversationId)
      } catch (error) {
        console.error("Error parsing related questions:", error)
      }
    }
  )

  chatResponseSource.addEventListener("receipt", (ev: MessageEvent) => {
    setIsLoading(false)
    if (sseConnection) sseConnection.close()
    try {
      const data: ChatReceiptEventData = JSON.parse(ev.data)
      onStreamEnd(data.conversation_id)
    } catch (error) {
      console.error("Error parsing receipt data:", error)
    }
  })

  chatResponseSource.addEventListener("rag-media", (ev: MessageEvent) => {
    try {
      const data: IRagMediaEvent = JSON.parse(ev.data)
      if (onRagMedia) {
        onRagMedia(data, conversationId)
      }
    } catch (error) {
      console.error("Error parsing rag-media data:", error)
    }
  })

  sseConnection = chatResponseSource
  return chatResponseSource
}

/**
 * Creates a conversation ID by fetching from a URL endpoint.
 * @param url - The URL endpoint to fetch the conversation ID from. Required.
 * @returns The conversation ID as a string.
 * @throws Error if URL is not provided or fetch fails.
 */
export const createConversationId = async (url?: string) => {
  if (!url) {
    throw new Error(
      "Conversation ID URL is required. Please provide a URL or use a custom function via conversationIdSource."
    )
  }
  const resp = await fetch(url).then((res) => res.text())
  
  return resp.trim().replace(/^"(.*)"$/, '$1')
}
