// Example: Using the floating chat store with error handling

import { useFloatingChatStore, useChatErrorHandler } from "@thinkthinksyn/nextjs-component"
import { toast } from "sonner" // or react-hot-toast, react-toastify, etc.

export function FloatingChatExample() {
  const { 
    messages, 
    isLoading, 
    input, 
    setInput,
    handleSubmit,
    error,
    clearError 
  } = useFloatingChatStore()

  // Option 1: Use the convenience hook for automatic error handling
  useChatErrorHandler((error) => {
    toast.error(error.message)
  })

  // Option 2: Manual error handling
  // useEffect(() => {
  //   if (error) {
  //     toast.error(error.message)
  //     clearError()
  //   }
  // }, [error, clearError])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errorResult = await handleSubmit(input, undefined, {
      userEndpoint: "https://api.example.com/chat",
      guestEndpoint: "https://api.example.com/guest-chat",
      defaultTitle: "New Chat",
      userAccessToken: undefined, // or your token
      conversationIdSource: "https://api.example.com/create-conversation"
      // or use a function: conversationIdSource: async () => crypto.randomUUID()
    })

    // Handle submission errors (validation, conversation creation failures)
    if (errorResult) {
      toast.error(errorResult)
    }
  }

  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.content}
            
            {/* Render RAG media if present */}
            {msg.parts?.map((part, j) => (
              part.type === "file" && (
                <div key={j}>
                  <a href={part.url} target="_blank" rel="noopener noreferrer">
                    {part.name}
                  </a>
                </div>
              )
            ))}
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  )
}
