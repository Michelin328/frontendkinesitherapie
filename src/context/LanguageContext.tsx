'use client'

import { createContext, useContext, ReactNode } from 'react'
import { TRANSLATIONS, TranslationKey } from '@/lib/translations'

interface LanguageContextType {
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  function t(key: TranslationKey): string {
    return TRANSLATIONS.fr[key] || key
  }

  return (
    <LanguageContext.Provider value={{ t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
