'use client'


import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'


interface ScrollToBottomProps {
  isVisible: boolean
  onClick: () => void
  t: (key: string) => string
}

export function ScrollToBottom({ isVisible, onClick, t }: ScrollToBottomProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Button
            variant="outline"
            size="sm"
            className="rounded-full shadow-md bg-background/95 backdrop-blur-sm"
            onClick={onClick}
            aria-label={t('scrollToBottom')}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
