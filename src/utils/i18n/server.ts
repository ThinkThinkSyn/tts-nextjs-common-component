// server side helper
import i18next, { i18nConfig } from './index'
import { headers } from 'next/headers'
import { useTranslation } from 'react-i18next'

export async function getT(ns: string | string[], options?: Parameters<typeof useTranslation>[1]) {
  const headerList = await headers()
  const lng = headerList.get(i18nConfig.headerName)
  if (lng && i18next.resolvedLanguage !== lng) {
    await i18next.changeLanguage(lng)
    i18next.resolvedLanguage = lng
  }
  if (ns && !i18next.hasLoadedNamespace(ns)) {
    await i18next.loadNamespaces(ns)
  }
  if (!i18next.hasLoadedNamespace(i18nConfig.defaultNS)) {
    await i18next.loadNamespaces(i18nConfig.defaultNS)
  }
  return {
    t: i18next.getFixedT(
      lng ?? i18next.resolvedLanguage ?? i18nConfig.defaultLocale,
      Array.isArray(ns) ? ns[0] : ns,
      options?.keyPrefix,
    ),

    i18n: i18next,
  }
}
