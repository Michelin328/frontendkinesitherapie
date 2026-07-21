const fs = require('fs');
const content = `'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { TRANSLATIONS, Langue, TranslationKey } from '@/lib/translations'

interface LanguageContextType {
  langue: Langue
  setLangue: (l: Langue) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [langue, setLangueState] = useState<Langue>('fr')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('langue') as Langue | null
    if (saved === 'fr' || saved === 'mg' || saved === 'en') {
      setLangueState(saved)
    }
    setMounted(true)
  }, [])

  function setLangue(l: Langue) {
    setLangueState(l)
    localStorage.setItem('langue', l)
  }

  function t(key: TranslationKey): string {
    return TRANSLATIONS[langue][key] || TRANSLATIONS.fr[key] || key
  }

  if (!mounted) return null

  return (
    <LanguageContext.Provider value={{ langue, setLangue, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
`;
fs.writeFileSync('D:/chu_kine/projet_frontend/src/context/LanguageContext.tsx', content, {encoding:'utf8'});
console.log('Fichier LanguageContext.tsx cree avec succes !');
