import { useState, useEffect } from "react"
import { speechLanguages, getDefaultSpeechLanguage } from "@/utils/speech"

interface SpeechSettings {
  sttLanguage: string
  ttsLanguage: string
  ttsRate: number
  ttsVolume: number
  ttsPitch: number
}

const SPEECH_SETTINGS_KEY = "legalExpression_speechSettings"

export const useSpeechSettings = (appLang: string) => {
  const [settings, setSettings] = useState<SpeechSettings>(() => {
    const defaultLang = getDefaultSpeechLanguage(appLang)
    return {
      sttLanguage: defaultLang,
      ttsLanguage: defaultLang,
      ttsRate: 1.0,
      ttsVolume: 1.0,
      ttsPitch: 1.0,
    }
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SPEECH_SETTINGS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as SpeechSettings
        setSettings((prev) => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.error("Failed to load speech settings:", error)
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(SPEECH_SETTINGS_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error("Failed to save speech settings:", error)
    }
  }, [settings])

  const updateSettings = (updates: Partial<SpeechSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }

  const resetToDefault = () => {
    const defaultLang = getDefaultSpeechLanguage(appLang)
    setSettings({
      sttLanguage: defaultLang,
      ttsLanguage: defaultLang,
      ttsRate: 1.0,
      ttsVolume: 1.0,
      ttsPitch: 1.0,
    })
  }

  return {
    settings,
    updateSettings,
    resetToDefault,
    availableLanguages: speechLanguages,
  }
}
