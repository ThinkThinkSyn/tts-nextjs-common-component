// Web Speech API type declarations for better TypeScript support
interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

declare global {
  interface Window {
    webkitSpeechRecognition: SpeechRecognitionConstructor
    SpeechRecognition: SpeechRecognitionConstructor
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
    | null
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

export interface SpeechLanguage {
  code: string
  name: string
  flag: string
}

// Common speech languages with their codes and display names
export const speechLanguages: SpeechLanguage[] = [
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
  { code: "en-GB", name: "English (UK)", flag: "🇬🇧" },
  { code: "zh-CN", name: "中文 (普通话)", flag: "🇨🇳" },
  { code: "zh-TW", name: "中文 (台灣)", flag: "🇹🇼" },
  { code: "zh-HK", name: "中文 (香港)", flag: "🇭🇰" },
  { code: "ur-PK", name: "اردو (پاکستان)", flag: "🇵🇰" },
  { code: "ur-IN", name: "اردو (بھارت)", flag: "🇮🇳" },
  { code: "ne-NP", name: "नेपाली", flag: "🇳🇵" },
  { code: "es-ES", name: "Español (España)", flag: "🇪🇸" },
  { code: "fr-FR", name: "Français (France)", flag: "🇫🇷" },
  { code: "de-DE", name: "Deutsch (Deutschland)", flag: "🇩🇪" },
  { code: "ja-JP", name: "日本語", flag: "🇯🇵" },
  { code: "ko-KR", name: "한국어", flag: "🇰🇷" },
  { code: "ar-SA", name: "العربية (السعودية)", flag: "🇸🇦" },
  { code: "hi-IN", name: "हिन्दी (भारत)", flag: "🇮🇳" },
]

export const getLanguageLength = (isMobile: boolean) => {
  if (isMobile) return 3
  return 5
}

// Check if Web Speech API is supported
export const checkSpeechSupport = () => {
  const speechRecognitionSupported =
    "webkitSpeechRecognition" in window || "SpeechRecognition" in window
  const speechSynthesisSupported = "speechSynthesis" in window

  return {
    speechRecognition: speechRecognitionSupported,
    speechSynthesis: speechSynthesisSupported,
    userAgent: navigator.userAgent,
  }
}

// Get SpeechRecognition class (cross-browser)
export const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
  if ("webkitSpeechRecognition" in window) {
    return window.webkitSpeechRecognition
  }
  if ("SpeechRecognition" in window) {
    return (window as any).SpeechRecognition
  }
  return null
}

// Global TTS manager to handle multiple TTS requests
class GlobalTTSManager {
  private synthesis: SpeechSynthesis
  private voices: SpeechSynthesisVoice[] = []
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private currentCallbacks: {
    onStart?: () => void
    onEnd?: () => void
    onError?: (error: SpeechSynthesisErrorEvent) => void
  } | null = null
  private isInitialized = false

  constructor() {
    this.synthesis = window.speechSynthesis
    this.loadVoices()

    // Handle voices loading (some browsers load them asynchronously)
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices()
    }
  }

  private loadVoices() {
    this.voices = this.synthesis.getVoices()
    this.isInitialized = true
  }

  getAvailableVoices(languageCode?: string): SpeechSynthesisVoice[] {
    if (!languageCode) return this.voices
    return this.voices.filter((voice) =>
      voice.lang
        .toLowerCase()
        .startsWith(languageCode.toLowerCase().split("-")[0])
    )
  }

  speak(
    text: string,
    options: {
      languageCode?: string
      rate?: number
      pitch?: number
      volume?: number
      onStart?: () => void
      onEnd?: () => void
      onError?: (error: SpeechSynthesisErrorEvent) => void
    } = {}
  ) {
    // Stop any current speech gracefully
    this.stop()

    const {
      languageCode = "en-US",
      rate = 1,
      pitch = 1,
      volume = 1,
      onStart,
      onEnd,
      onError,
    } = options

    // Store callbacks for this speech request
    this.currentCallbacks = { onStart, onEnd, onError }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = languageCode
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume

    // Try to find a suitable voice
    const availableVoices = this.getAvailableVoices(languageCode)
    if (availableVoices.length > 0) {
      // Prefer young female voices if available
      const femaleKeywords = ["female", "girl", "woman", "young"]
      const youngFemaleVoice = availableVoices.find((voice) => {
        const name = (voice.name || "").toLowerCase()
        const desc = (voice.voiceURI || "").toLowerCase()
        return (
          femaleKeywords.some((k) => name.includes(k) || desc.includes(k)) &&
          (name.includes("young") || desc.includes("young"))
        )
      })
      // Fallback to any female voice
      const femaleVoice = availableVoices.find((voice) => {
        const name = (voice.name || "").toLowerCase()
        const desc = (voice.voiceURI || "").toLowerCase()
        return femaleKeywords.some((k) => name.includes(k) || desc.includes(k))
      })
      // Prefer native voices over remote voices
      const nativeVoice = availableVoices.find((voice) => voice.localService)
      utterance.voice =
        youngFemaleVoice || femaleVoice || nativeVoice || availableVoices[0]
    }

    utterance.onstart = () => {
      this.currentCallbacks?.onStart?.()
    }

    utterance.onend = () => {
      this.currentUtterance = null
      this.currentCallbacks?.onEnd?.()
      this.currentCallbacks = null
    }

    utterance.onerror = (error) => {
      // Don't call error callback for "interrupted" errors as they're expected
      if (error.error !== "interrupted") {
        this.currentCallbacks?.onError?.(error)
      }
      this.currentUtterance = null
      this.currentCallbacks = null
    }

    this.currentUtterance = utterance
    // Add a small delay to ensure previous speech is fully stopped
    setTimeout(() => {
      if (this.currentUtterance === utterance) {
        this.synthesis.speak(utterance)
      }
    }, 50)
  }

  stop() {
    if (this.synthesis.speaking) {
      this.synthesis.cancel()
    }
    if (this.currentUtterance) {
      this.currentUtterance = null
    }
    if (this.currentCallbacks) {
      this.currentCallbacks = null
    }
  }

  pause() {
    if (this.synthesis.speaking) {
      this.synthesis.pause()
    }
  }

  resume() {
    if (this.synthesis.paused) {
      this.synthesis.resume()
    }
  }

  isSpeaking(): boolean {
    return this.synthesis.speaking
  }

  isPaused(): boolean {
    return this.synthesis.paused
  }
}

// Global instance
let globalTTSManager: GlobalTTSManager | null = null

// Get or create the global TTS manager
const getGlobalTTSManager = (): GlobalTTSManager => {
  if (!globalTTSManager) {
    globalTTSManager = new GlobalTTSManager()
  }
  return globalTTSManager
}

// Text-to-Speech utility class (now uses global manager)
export class TextToSpeech {
  private manager: GlobalTTSManager

  constructor() {
    this.manager = getGlobalTTSManager()
  }

  getAvailableVoices(languageCode?: string): SpeechSynthesisVoice[] {
    return this.manager.getAvailableVoices(languageCode)
  }

  speak(
    text: string,
    options: {
      languageCode?: string
      rate?: number
      pitch?: number
      volume?: number
      onStart?: () => void
      onEnd?: () => void
      onError?: (error: SpeechSynthesisErrorEvent) => void
    } = {}
  ) {
    return this.manager.speak(text, options)
  }

  stop() {
    return this.manager.stop()
  }

  pause() {
    return this.manager.pause()
  }

  resume() {
    return this.manager.resume()
  }

  isSpeaking(): boolean {
    return this.manager.isSpeaking()
  }

  isPaused(): boolean {
    return this.manager.isPaused()
  }
}

// Speech-to-Text utility class
export class SpeechToText {
  private recognition: SpeechRecognition | null = null
  private isListening = false

  constructor() {
    const SpeechRecognitionClass = getSpeechRecognition()
    if (SpeechRecognitionClass) {
      this.recognition = new SpeechRecognitionClass()
      this.setupRecognition()
    }
  }

  private setupRecognition() {
    if (!this.recognition) return

    this.recognition.continuous = false
    this.recognition.interimResults = true
    this.recognition.maxAlternatives = 1
  }

  isSupported(): boolean {
    return this.recognition !== null
  }

  startListening(
    options: {
      languageCode?: string
      continuous?: boolean
      onResult?: (transcript: string, isFinal: boolean) => void
      onError?: (error: SpeechRecognitionErrorEvent) => void
      onStart?: () => void
      onEnd?: () => void
    } = {}
  ) {
    if (!this.recognition || this.isListening) {
      return Promise.reject(
        new Error("Speech recognition not available or already listening")
      )
    }

    const {
      languageCode = "en-US",
      continuous = false,
      onResult,
      onError,
      onStart,
      onEnd,
    } = options

    return new Promise<void>((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error("Speech recognition not supported"))
        return
      }

      this.recognition.lang = languageCode
      this.recognition.continuous = continuous

      this.recognition.onstart = () => {
        this.isListening = true
        onStart?.()
        resolve()
      }

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = Array.from(event.results)
        const transcript = results
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("")

        const isFinal = results.some((result) => result.isFinal)
        onResult?.(transcript, isFinal)
      }

      this.recognition.onerror = (error: SpeechRecognitionErrorEvent) => {
        this.isListening = false
        onError?.(error)
        reject(error)
      }

      this.recognition.onend = () => {
        this.isListening = false
        onEnd?.()
      }

      try {
        this.recognition.start()
      } catch (error) {
        this.isListening = false
        reject(error)
      }
    })
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  getIsListening(): boolean {
    return this.isListening
  }
}

// Request microphone permission
export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // Immediately stop the stream as we just needed permission
    stream.getTracks().forEach((track) => track.stop())
    return true
  } catch (error) {
    console.error("Microphone permission denied:", error)
    return false
  }
}

// Get default language based on browser/app language
export const getDefaultSpeechLanguage = (appLang: string): string => {
  const langMap: Record<string, string> = {
    "zh-CN": "zh-CN",
    "zh-TW": "zh-TW",
    ur: "ur-PK",
    ne: "ne-NP",
    en: "en-US",
  }

  return langMap[appLang] || "en-US"
}
