import { motion } from "framer-motion"
import { Bot } from "lucide-react"

interface ThinkingIndicatorProps {
  isVisible: boolean
}

export function ThinkingIndicator({ isVisible }: ThinkingIndicatorProps) {
  if (!isVisible) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-primary/10 mr-12 flex items-center gap-3 rounded-lg p-4"
    >
      <div className="bg-background flex h-8 w-8 shrink-0 items-center justify-center rounded-md border shadow select-none">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex-1 flex">
        <div className="flex space-x-2">
          <div className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full"></div>
          <div className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full delay-150"></div>
          <div className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full delay-300"></div>
        </div>
      </div>
    </motion.div>
  )
}