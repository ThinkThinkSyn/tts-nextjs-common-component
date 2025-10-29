"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useIsMobile } from "@/components/ui/use-mobile"
import { useSpeechSettings } from "@/hooks/use-speech-settings"
import { twMerge } from "tailwind-merge"
import {
  SpeechToText,
  checkSpeechSupport,
  getLanguageLength,
  requestMicrophonePermission,
} from "@/utils/speech"
import {
  Mic,
  MicOff,
  Settings,
  AlertCircle,
  Volume2,
  ChevronDown,
  X,
} from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "sonner"

interface SpeechToTextButtonProps {
  onTranscript: (text: string) => void
  disabled?: boolean
  className?: string
  lang: string
  t: (key: string) => string
}

export function SpeechToTextButton({
  onTranscript,
  disabled,
  className,
  lang,
  t,
}: SpeechToTextButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const [isPermissionDenied, setIsPermissionDenied] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  const speechToTextRef = useRef<SpeechToText | null>(null)
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)

  const { settings, updateSettings, availableLanguages } =
    useSpeechSettings(lang)

  const support = checkSpeechSupport()
  const isMobile = useIsMobile()

  // Initialize SpeechToText
  useEffect(() => {
    if (support.speechRecognition) {
      speechToTextRef.current = new SpeechToText()
    }
  }, [support.speechRecognition])

  const startListening = useCallback(async () => {
    if (!speechToTextRef.current?.isSupported()) {
      toast.error(t("Speech recognition not supported in your browser"))
      return
    }

    try {
      // Request permission first
      const hasPermission = await requestMicrophonePermission()
      if (!hasPermission) {
        setIsPermissionDenied(true)
        toast.error(
          t("Microphone permission is required for speech recognition")
        )
        return
      }

      setIsPermissionDenied(false)
      setTranscript("")

      await speechToTextRef.current!.startListening({
        languageCode: settings.sttLanguage,
        continuous: true,
        onResult: (text, isFinal) => {
          setTranscript(text)
          if (isFinal && text.trim()) {
            onTranscript(text.trim())
            setTranscript("")
          }
        },
        onError: (error) => {
          console.error("Speech recognition error:", error)
          setIsListening(false)

          if (error.error === "not-allowed") {
            setIsPermissionDenied(true)
            toast.error(t("Microphone permission denied"))
          } else if (error.error === "no-speech") {
            toast.error(t("No speech detected. Please try again."))
          } else if (error.error === "network") {
            toast.error(t("Network error. Please check your connection."))
          } else {
            toast.error(t("Speech recognition failed. Please try again."))
          }
        },
        onStart: () => {
          setIsListening(true)
        },
        onEnd: () => {
          setIsListening(false)
          if (transcript.trim()) {
            onTranscript(transcript.trim())
          }
          setTranscript("")
        },
      })
    } catch (error) {
      console.error("Failed to start listening:", error)
      setIsListening(false)
      toast.error(t("Failed to start speech recognition"))
    }
  }, [settings.sttLanguage, transcript, onTranscript, t])

  const stopListening = useCallback(() => {
    if (speechToTextRef.current && isListening) {
      speechToTextRef.current.stopListening()
    }
  }, [isListening])

  // Handle mouse/touch events for WhatsApp-style hold-to-record
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isLongPressRef.current = false

      holdTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true
        startListening()
      }, 150) // 150ms threshold for long press
    },
    [startListening]
  )

  const handleMouseUp = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
    }

    if (isLongPressRef.current) {
      stopListening()
    } else {
      // Short press - toggle listening
      if (isListening) {
        stopListening()
      } else {
        startListening()
      }
    }
    isLongPressRef.current = false
  }, [isListening, startListening, stopListening])

  const handleMouseLeave = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
    }
    if (isLongPressRef.current) {
      stopListening()
    }
  }, [stopListening])

  // Touch events for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      handleMouseDown(e as any)
    },
    [handleMouseDown]
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      handleMouseUp()
    },
    [handleMouseUp]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current)
      }
      stopListening()
    }
  }, [stopListening])

  if (!support.speechRecognition) {
    return (
      <Button
        size="icon"
        variant="ghost"
        disabled
        className="text-muted-foreground h-8 w-8 shrink-0 rounded-full"
        title={t("Speech recognition not supported")}
      >
        <MicOff className="h-4 w-4" />
      </Button>
    )
  }

  if (isPermissionDenied) {
    return (
      <Button
        size="icon"
        variant="ghost"
        onClick={() => {
          setIsPermissionDenied(false)
          startListening()
        }}
        className="h-8 w-8 shrink-0 rounded-full text-orange-500 hover:bg-orange-50 hover:text-orange-600"
        title={t("Click to request microphone permission")}
      >
        <AlertCircle className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="flex items-center">
      {/* Listening indicator and transcript */}
      {isListening && (
        <div className="mr-2 flex animate-pulse items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-xs font-medium">
            {transcript || t("Listening...")}
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={stopListening}
            className="h-4 w-4 p-0 hover:bg-red-200 dark:hover:bg-red-800"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <Button
        size="icon"
        variant="ghost"
        disabled={disabled}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={twMerge(
          "h-8 w-8 shrink-0 rounded-full transition-all duration-200",
          isListening
            ? "animate-pulse bg-red-500 text-white hover:bg-red-600"
            : "text-muted-foreground hover:text-primary hover:bg-primary/10",
          className
        )}
        title={
          isListening
            ? t("Release to stop")
            : t("Hold to record or tap to toggle")
        }
      >
        <Mic className={twMerge("h-4 w-4", isListening && "animate-bounce")} />
      </Button>

      <DropdownMenu open={showLanguageMenu} onOpenChange={setShowLanguageMenu}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-primary h-6 w-6 shrink-0 rounded-full"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t("Speech Settings")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
            {t("Speech to Text Language")}
          </DropdownMenuLabel>
          <div
            className={twMerge("overflow-y-scroll", "custom-scrollbar")}
            style={{
              maxHeight:
                availableLanguages.length > getLanguageLength(isMobile)
                  ? `calc(${getLanguageLength(isMobile)} * 2.5rem)` // 2.5rem is Tailwind's spacing.10
                  : undefined,
            }}
          >
            {availableLanguages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => updateSettings({ sttLanguage: lang.code })}
                className={twMerge(
                  "flex items-center gap-2",
                  settings.sttLanguage === lang.code &&
                    "bg-primary/10 text-primary"
                )}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="text-sm">{lang.name}</span>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
