'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle } from 'lucide-react'


interface SuggestedRepliesProps {
  suggestions: string[]
  onSuggestionClick: (suggestion: string) => void
  t: (key: string) => string
}

export function SuggestedReplies({ suggestions, onSuggestionClick, t }: SuggestedRepliesProps) {
  if (suggestions.length === 0) return null

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-2 px-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MessageCircle className="h-4 w-4" />
          {t('Suggested Replies')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-3">
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="h-auto w-full justify-start px-3 py-2 text-left text-xs"
            onClick={() => onSuggestionClick(suggestion)}
          >
            <span className="line-clamp-2">{suggestion}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
