'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Slider } from '@/components/ui/slider'
import { useSpeechSettings } from '@/hooks/use-speech-settings'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/store/chat.store'

import { TextToSpeech, checkSpeechSupport, getLanguageLength } from '@/utils/speech'
import { Volume2, VolumeX, Pause, Play, Settings, ChevronDown, Speaker } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { useIsMobile } from '../ui/use-mobile'

interface TextToSpeechButtonProps {
  text: string
  disabled?: boolean
  className?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  t: (key: string) => string
  lang: string
}

export function TextToSpeechButton({
  text,
  disabled,
  className,
  variant = 'ghost',
  size = 'icon',
  t,
  lang,
}: TextToSpeechButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const isStreaming = useChatStore((state) => state.isStreaming)
  const ttsRef = useRef<TextToSpeech | null>(null)
  const { settings, updateSettings, availableLanguages } = useSpeechSettings(lang)
  const isMobile = useIsMobile()
  const support = checkSpeechSupport()

  // Initialize TextToSpeech
  useEffect(() => {
    if (support.speechSynthesis) {
      ttsRef.current = new TextToSpeech()
    }
  }, [support.speechSynthesis])

  // Check if TTS is currently speaking to update UI state
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isPlaying) {
      interval = setInterval(() => {
        if (ttsRef.current && !ttsRef.current.isSpeaking()) {
          setIsPlaying(false)
        }
      }, 500)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isPlaying])

  const handleSpeak = () => {
    if (!ttsRef.current) {
      toast.error(t('Text-to-speech not supported in your browser'))
      return
    }

    // If currently playing, stop all speech
    if (isPlaying || ttsRef.current.isSpeaking()) {
      ttsRef.current.stop()
      setIsPlaying(false)
      return
    }

    if (!text.trim()) {
      toast.error(t('No text to speak'))
      return
    }

    try {
      ttsRef.current.speak(text, {
        languageCode: settings.ttsLanguage,
        rate: settings.ttsRate,
        pitch: settings.ttsPitch,
        volume: settings.ttsVolume,
        onStart: () => {
          setIsPlaying(true)
        },
        onEnd: () => {
          setIsPlaying(false)
        },
        onError: (error) => {
          console.error('TTS Error:', error)
          setIsPlaying(false)
          // Only show error toast for non-interrupted errors
          if (error.error !== 'interrupted') {
            toast.error(t('Failed to speak text'))
          }
        },
      })
    } catch (error) {
      console.error('TTS Error:', error)
      setIsPlaying(false)
      toast.error(t('Failed to speak text'))
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ttsRef.current) {
        ttsRef.current.stop()
      }
    }
  }, [])

  if (!support.speechSynthesis || isStreaming) {
    return null
  }

  return (
    <div className="flex items-center">
      <DropdownMenu open={showSettings} onOpenChange={setShowSettings}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-primary h-6 w-6"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('Speech Settings')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Language Selection */}
          <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
            {t('Text to Speech Language')}
          </DropdownMenuLabel>
          <div
            className={cn(
              'overflow-y-scroll',
              'custom-scrollbar',
            )}
            style={{
              maxHeight:
                availableLanguages.length > getLanguageLength(isMobile)
                  ? `calc(${getLanguageLength(isMobile)} * 2.5rem)` // 2.5rem is Tailwind's spacing.10
                  : undefined,
            }}>
            {availableLanguages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => updateSettings({ ttsLanguage: lang.code })}
                className={cn(
                  'flex items-center gap-2',
                  settings.ttsLanguage === lang.code && 'bg-primary/10 text-primary',
                )}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="text-sm">{lang.name}</span>
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator />

          {/* Speed Control */}
          <div className="px-2 py-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-xs">{t('Speed')}</span>
              <span className="text-muted-foreground text-xs">{settings.ttsRate.toFixed(1)}x</span>
            </div>
            <Slider
              value={[settings.ttsRate]}
              onValueChange={([value]) => updateSettings({ ttsRate: value })}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Pitch Control */}
          <div className="px-2 py-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-xs">{t('Pitch')}</span>
              <span className="text-muted-foreground text-xs">{settings.ttsPitch.toFixed(1)}</span>
            </div>
            <Slider
              value={[settings.ttsPitch]}
              onValueChange={([value]) => updateSettings({ ttsPitch: value })}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Volume Control */}
          <div className="px-2 py-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-xs">{t('Volume')}</span>
              <span className="text-muted-foreground text-xs">
                {Math.round(settings.ttsVolume * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.ttsVolume]}
              onValueChange={([value]) => updateSettings({ ttsVolume: value })}
              min={0.1}
              max={1.0}
              step={0.1}
              className="w-full"
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        size={size}
        variant={variant}
        disabled={disabled || !text.trim()}
        onClick={handleSpeak}
        className={cn(
          'transition-colors duration-200',
          isPlaying && 'text-primary animate-pulse',
          className,
        )}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </Button>
    </div>
  )
}
