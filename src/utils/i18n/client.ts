'use client'

import i18next, { Locales } from './index'
import { zhHK, enUS } from 'date-fns/locale'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

/* eslint-disable react-hooks/rules-of-hooks */

const runsOnServerSide = typeof window === 'undefined'

// https://www.locize.com/blog/i18n-next-app-router
export function useT(ns: string | string[], options?: Parameters<typeof useTranslation>[1]) {
  const lang = useParams()?.lang
  if (typeof lang !== 'string') throw new Error('useT is only available inside /app/[lang]')
  if (runsOnServerSide && i18next.resolvedLanguage !== lang) {
    i18next.changeLanguage(lang)
  } else {
    const [activeLng, setActiveLng] = useState(i18next.resolvedLanguage)
    useEffect(() => {
      if (activeLng === i18next.resolvedLanguage) return
      setActiveLng(i18next.resolvedLanguage)
    }, [activeLng, i18next.resolvedLanguage])
    useEffect(() => {
      if (!lang || i18next.resolvedLanguage === lang) return
      i18next.changeLanguage(lang)
    }, [lang, i18next])
  }
  return useTranslation(ns, options)
}

export function useLanguage() {
  const lang = useParams().lang
  if (typeof lang !== 'string') {
    throw new Error('language not found')
  }

  return lang as Locales
}

export function langToLocale(lang: Locales) {
  switch (lang) {
    case 'zh-TW':
      return zhHK
    case 'en':
      return enUS
    default:
      return zhHK
  }
}

export const switchLanguage = (
  currentLang: string | undefined,
  targetLang: Locales,
  router: AppRouterInstance,
) => {
  const path = window.location.pathname

  if (currentLang === targetLang) {
    return
  }

  let newPath = ''
  if (path.startsWith(`/${currentLang}/`)) {
    newPath = path.replace(`/${currentLang}/`, `/${targetLang}/`)
  }
  // handle path /en (home page)
  else if (path.endsWith(`/${currentLang}`)) {
    newPath = path.replace(`/${currentLang}`, `/${targetLang}`)
  } else {
    // dont handle this becuz it should be done by middleware. throwing this error means the middleware has sth wrong
    throw new Error('no lang found in current url')
  }

  router.replace(newPath)
  
}

export function getLocalizedHashLink(hash: string, lang: Locales) {
  return `/${lang}${hash}`
}
