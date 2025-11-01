import { ChatConversation } from "@/store/chat.store"
import { IChatMessage } from "@/types/chat.type"
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

  sseConnection = chatResponseSource
  return chatResponseSource
}

export const createConversationId = async (
  url: string = "https://api.thinkthinksyn.com/legalexp/chat/law/conversation/create_id"
) => {
  const resp = await fetch(url).then((res) => res.text())
  return resp
}
