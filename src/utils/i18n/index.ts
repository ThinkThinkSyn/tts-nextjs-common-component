import { ArrayToUnion } from '..'
import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import resourcesToBackend from 'i18next-resources-to-backend'
// import LocizeBackend from 'i18next-locize-backend'
import { initReactI18next } from 'react-i18next/initReactI18next'

const runsOnServerSide = typeof window === 'undefined'

// https://developers.google.com/workspace/admin/directory/v1/languages?hl=zh-tw
export const availableLanguageMap = {
  en: 'English',
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  ur: 'اردو',
  ne: 'नेपाली',
}

export const i18nConfig = {
  locales: Object.keys(availableLanguageMap) as Array<keyof typeof availableLanguageMap>,
  defaultLocale: 'en',
  headerName: 'x-i18next-current-lang',
  cookieName: 'i18next',
  defaultNS: 'common',
} as const

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    supportedLngs: i18nConfig.locales,
    fallbackLng: i18nConfig.defaultLocale,
    lng: undefined, // let detect the language on client side
    fallbackNS: i18nConfig.defaultNS,
    defaultNS: i18nConfig.defaultNS,
    detection: {
      order: ['path', 'htmlTag', 'cookie', 'navigator'],
    },
    preload: runsOnServerSide ? i18nConfig.locales : [],
  })

export default i18next

export type Locales = ArrayToUnion<typeof i18nConfig.locales>
export * from './client'
export * from './server'
