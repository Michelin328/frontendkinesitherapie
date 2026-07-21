const fs = require('fs');
const content = `'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useLanguage } from '@/context/LanguageContext'

type Theme = 'clair' | 'sombre' | 'systeme'

export default function ParametresPage() {
  const { langue, setLangue, t } = useLanguage()
  const [theme, setTheme] = useState<Theme>(() => (typeof window !== 'undefined' ? (localStorage.getItem('theme') as Theme) || 'clair' : 'clair'))
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showAideModal, setShowAideModal] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const root = document.documentElement
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = theme === 'sombre' || (theme === 'systeme' && prefersDark)
    isDark ? root.classList.add('dark') : root.classList.remove('dark')
    localStorage.setItem('theme', theme)
    showToast(t('par_themeApplique') + ' : ' + (theme === 'clair' ? t('par_clair') : theme === 'sombre' ? t('par_sombre') : t('par_systeme')))
  }, [theme])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function changerLangue(val: 'fr' | 'mg' | 'en') {
    setLangue(val)
    showToast(val === 'fr' ? '[FR] Francais selectionne' : val === 'mg' ? '[MG] Malagasy voafidy' : '[EN] English selected')
  }

  return (
    <AppShell searchPlaceholder="Rechercher...">

      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-surface-container-low text-on-surface text-sm font-semibold px-5 py-3 rounded-xl shadow-2xl border border-outline-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-green-400">check_circle</span>
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h2 className="font-headline-md text-on-surface">{t('par_titre')}</h2>
        <p className="font-body-lg text-on-surface-variant">{t('par_sousTitre')}</p>
      </div>

      <div className="max-w-2xl space-y-6">

        <section className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">palette</span>
            <h3 className="font-title-sm text-on-surface">{t('par_theme')}</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-on-surface-variant mb-4">{t('par_themeDesc')}</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'clair' as Theme, icon: 'light_mode', label: t('par_clair') },
                { value: 'sombre' as Theme, icon: 'dark_mode', label: t('par_sombre') },
                { value: 'systeme' as Theme, icon: 'contrast', label: t('par_systeme') },
              ]).map((opt) => (
                <button key={opt.value} onClick={() => setTheme(opt.value)}
                  className={"flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 " + (theme === opt.value ? "border-primary bg-teal-50 text-primary" : "border-outline-variant text-on-surface-variant hover:border-outline hover:bg-surface-container-low")}>
                  <span className="material-symbols-outlined text-2xl">{opt.icon}</span>
                  <span className="text-sm font-semibold">{opt.label}</span>
                  {theme === opt.value && <span className="material-symbols-outlined text-base text-primary">check_circle</span>}
                </button>
              ))}
            </div>
            <div className={"mt-4 rounded-xl p-4 border flex items-center gap-3 transition-all duration-300 " + (theme === 'sombre' ? "bg-surface-container-low border-outline-variant" : theme === 'systeme' ? "bg-surface-container-low border-outline-variant" : "bg-surface border-outline-variant")}>
              <span className={"material-symbols-outlined text-2xl " + (theme === 'sombre' ? "text-on-surface" : "text-on-surface-variant")}>
                {theme === 'clair' ? 'light_mode' : theme === 'sombre' ? 'dark_mode' : 'contrast'}
              </span>
              <div>
                <p className="text-sm font-semibold text-on-surface">{t('par_themeApplique')}</p>
                <p className="text-xs text-on-surface-variant">{theme === 'clair' ? t('par_clair') : theme === 'sombre' ? t('par_sombre') : t('par_systeme')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">language</span>
            <h3 className="font-title-sm text-on-surface">{t('par_langue')}</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-on-surface-variant mb-4">{t('par_langueDesc')}</p>
            <div className="space-y-2">
              {([
                { value: 'fr' as const, flag: 'FR', label: t('par_francais'), sub: t('par_langueParDefaut'), bg: 'bg-blue-100 text-blue-700' },
                { value: 'mg' as const, flag: 'MG', label: t('par_malagasy'), sub: t('par_fitenyMalagasy'), bg: 'bg-red-100 text-red-700' },
                { value: 'en' as const, flag: 'EN', label: t('par_english'), sub: t('par_englishLanguage'), bg: 'bg-surface-container-low text-on-surface-variant' },
              ]).map((opt) => (
                <button key={opt.value} onClick={() => changerLangue(opt.value)}
                  className={"w-full flex items-center gap-4 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left " + (langue === opt.value ? "border-primary bg-teal-50" : "border-outline-variant hover:border-outline hover:bg-surface-container-low")}>
                  <div className={"w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 " + opt.bg}>{opt.flag}</div>
                  <div className="flex-1">
                    <p className={"text-sm font-semibold " + (langue === opt.value ? "text-primary" : "text-on-surface")}>{opt.label}</p>
                    <p className="text-xs text-on-surface-variant">{opt.sub}</p>
                  </div>
                  {langue === opt.value && <span className="material-symbols-outlined text-primary text-xl">check_circle</span>}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">help</span>
            <h3 className="font-title-sm text-on-surface">{t('par_aide')}</h3>
          </div>
          <div className="p-6 space-y-3">
            {([
              { icon: 'menu_book', label: t('par_guide'), sub: t('par_guideDesc'), color: 'text-blue-600 bg-blue-50' },
              { icon: 'support_agent', label: t('par_support'), sub: t('par_supportDesc'), color: 'text-teal-600 bg-teal-50' },
              { icon: 'info', label: t('par_apropos'), sub: t('par_aproposDesc'), color: 'text-on-surface-variant bg-surface-container-low' },
            ]).map((item) => (
              <button key={item.label} onClick={() => setShowAideModal(true)}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border border-outline-variant hover:border-outline hover:bg-surface-container-low transition-all text-left">
                <div className={"w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 " + item.color}>
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-on-surface">{item.label}</p>
                  <p className="text-xs text-on-surface-variant">{item.sub}</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-xl">chevron_right</span>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-surface rounded-xl border border-red-200/40 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-50 bg-red-50/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">logout</span>
            <h3 className="font-title-sm text-red-600">{t('par_deconnexion')}</h3>
          </div>
          <div className="p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-on-surface font-semibold">Dr. Elena Vance</p>
              <p className="text-xs text-on-surface-variant">{t('topbar_chefDeService')} - elena.vance@chu.mg</p>
            </div>
            <button onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-lg font-semibold text-sm hover:bg-red-600 active:scale-95 transition-all shadow-sm">
              <span className="material-symbols-outlined text-lg">logout</span>
              {t('par_seDeconnecter')}
            </button>
          </div>
        </section>

      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-500 text-3xl">logout</span>
            </div>
            <h3 className="font-headline-md text-on-surface mb-2">{t('par_deconnecterQ')}</h3>
            <p className="text-sm text-on-surface-variant mb-6">{t('par_deconnecterDesc')}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low">{t('par_annuler')}</button>
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white font-semibold text-sm hover:bg-red-600 shadow-sm">{t('par_confirmer')}</button>
            </div>
          </div>
        </div>
      )}

      {showAideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-blue-500 text-3xl">support_agent</span>
            </div>
            <h3 className="font-headline-md text-on-surface mb-2">{t('par_aideTitle')}</h3>
            <p className="text-sm text-on-surface-variant mb-2">{t('par_aideDesc')}</p>
            <p className="text-sm font-semibold text-primary mb-6">support@chu-andrainjato.mg</p>
            <button onClick={() => setShowAideModal(false)} className="w-full px-4 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:opacity-90 shadow-sm">{t('par_fermer')}</button>
          </div>
        </div>
      )}

    </AppShell>
  )
}
`;
fs.writeFileSync('D:/chu_kine/projet_frontend/src/app/parametres/page.tsx', content, {encoding:'utf8'});
console.log('parametres/page.tsx reecrit avec succes !');
