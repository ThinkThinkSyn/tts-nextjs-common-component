import { useEffect } from "react"
import { useFloatingChatStore } from "@/store/floating-chat.store"

/**
 * Hook to handle chat errors with a custom error handler (e.g., toast notifications).
 * 
 * @example
 * ```tsx
 * import { useChatErrorHandler } from "@thinkthinksyn/nextjs-component"
 * import { toast } from "sonner" // or any toast library
 * 
 * function MyComponent() {
 *   useChatErrorHandler((error) => {
 *     toast.error(error.message)
 *   })
 *   
 *   return <FloatingChat />
 * }
 * ```
 */
export function useChatErrorHandler(
  onError: (error: Error) => void,
  options?: {
    /** Whether to auto-clear the error after handling it. Default: true */
    autoClear?: boolean
  }
) {
  const { error, clearError } = useFloatingChatStore()
  const autoClear = options?.autoClear !== false

  useEffect(() => {
    if (error) {
      onError(error)
      if (autoClear) {
        clearError()
      }
    }
  }, [error, onError, autoClear, clearError])
}
