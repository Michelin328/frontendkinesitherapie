const fs = require('fs');
const content = `'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'

const TRANSLATIONS = {
  fr: {
    titre: 'Parametres', sousTitre: 'Personnalisez votre experience.',
    theme: 'Theme', themeDesc: 'Choisissez l apparence de l interface.',
    clair: 'Clair', sombre: 'Sombre', systeme: 'Systeme',
    langue: 'Langue', langueDesc: 'Selectionnez la langue.',
    aide: 'Besoin d aide ?', guide: 'Guide utilisation', guideDesc: 'Documentation complete',
    support: 'Contacter le support', supportDesc: 'Envoyer un message a l equipe',
    apropos: 'A propos', aproposDesc: 'Version 1.0.0 - CHU Andrainjato Fianarantsoa',
    deconnexion: 'Deconnexion', seDeconnecter: 'Se deconnecter',
    confirmer: 'Confirmer', annuler: 'Annuler',
    deconnecterQ: 'Se deconnecter ?', deconnecterDesc: 'Votre session sera fermee.',
    aideTitle: 'Besoin d aide ?', aideDesc: 'Pour toute assistance, contactez :', fermer: 'Fermer',
    themeApplique: 'Theme applique',
  },
  mg: {
    titre: 'Fikirana', sousTitre: 'Amboary ny fomba fampiasana.',
    theme: 'Loko', themeDesc: 'Safidio ny endrika ny rindranasa.',
    clair: 'Mazava', sombre: 'Maizina', systeme: 'Rafitra',
    langue: 'Fiteny', langueDesc: 'Safidio ny fiteny hampisehoana.',
    aide: 'Mila fanampiana ?', guide: 'Torolalana', guideDesc: 'Antontan-taratasy feno',
    support: 'Mifandraisa', supportDesc: 'Mandefa hafatra ho an ny ekipa',
    apropos: 'Momba', aproposDesc: 'Version 1.0.0 - CHU Andrainjato Fianarantsoa',
    deconnexion: 'Hiala', seDeconnecter: 'Miala',
    confirmer: 'Ekena', annuler: 'Hanafoana',
    deconnecterQ: 'Hiala ?', deconnecterDesc: 'Hikatona ny fotoam-piasanao.',
    aideTitle: 'Mila fanampiana ?', aideDesc: 'Mifandraisa amin ny ekipa:', fermer: 'Akatona',
    themeApplique: 'Loko voaova',
  },
  en: {
    titre: 'Settings', sousTitre: 'Customize your experience.',
    theme: 'Theme', themeDesc: 'Choose the interface appearance.',
    clair: 'Light', sombre: 'Dark', systeme: 'System',
    langue: 'Language', langueDesc: 'Select the display language.',
    aide: 'Need help ?', guide: 'User guide', guideDesc: 'Complete documentation',
    support: 'Contact support', supportDesc: 'Send a message to the technical team',
    apropos: 'About', aproposDesc: 'Version 1.0.0 - CHU Andrainjato Fianarantsoa',
    deconnexion: 'Logout', seDeconnecter: 'Log out',
    confirmer: 'Confirm', annuler: 'Cancel',
    deconnecterQ: 'Log out ?', deconnecterDesc: 'Your session will be closed.',
    aideTitle: 'Need help ?', aideDesc: 'For assistance, contact:', fermer: 'Close',
    themeApplique: 'Theme applied',
  },
}

type Theme  = 'clair' | 'sombre' | 'systeme'
type Langue = 'fr' | 'mg' | 'en'

export default function ParametresPage() {
  const [theme, setTheme]   = useState<Theme>(() => (typeof window !== 'undefined' ? (localStorage.getItem('theme') as Theme) || 'clair' : 'clair'))
  const [langue, setLangue] = useState<Langue>(() => (typeof window !== 'undefined' ? (localStorage.getItem('langue') as Langue) || 'fr' : 'fr'))
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showAideModal, setShowAideModal]     = useState(false)
  const [toast, setToast] = useState('')

  const t = TRANSLATIONS[langue]

  useEffect(() => {
    const root = document.documentElement
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = theme === 'sombre' || (theme === 'systeme' && prefersDark)
    isDark ? root.classList.add('dark') : root.classList.remove('dark')
    localStorage.setItem('theme', theme)
    showToast(t.themeApplique + ' : ' + (theme === 'clair' ? t.clair : theme === 'sombre' ? t.sombre : t.systeme))
  }, [theme])

  useEffect(() => {
    localStorage.setItem('langue', langue)
  }, [langue])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function changerLangue(val: Langue) {
    setLangue(val)
    showToast(val === 'fr' ? '[FR] Francais selectionne' : val === 'mg' ? '[MG] Malagasy voafidy' : '[EN] English selected')
  }

  return (
    <AppShell searchPlaceholder="Rechercher...">

      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-800 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-green-400">check_circle</span>
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h2 className="font-headline-md text-on-surface">{t.titre}</h2>
        <p className="font-body-lg text-on-surface-variant">{t.sousTitre}</p>
      </div>

      <div className="max-w-2xl space-y-6">

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">palette</span>
            <h3 className="font-title-sm text-on-surface">{t.theme}</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-on-surface-variant mb-4">{t.themeDesc}</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                {value:'clair'   as Theme, icon:'light_mode', label:t.clair},
                {value:'sombre'  as Theme, icon:'dark_mode',  label:t.sombre},
                {value:'systeme' as Theme, icon:'contrast',   label:t.systeme},
              ]).map((opt) => (
                <button key={opt.value} onClick={() => setTheme(opt.value)}
                  className={"flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 " + (theme===opt.value ? "border-primary bg-teal-50 text-primary" : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50")}>
                  <span className="material-symbols-outlined text-2xl">{opt.icon}</span>
                  <span className="text-sm font-semibold">{opt.label}</span>
                  {theme===opt.value && <span className="material-symbols-outlined text-base text-primary">check_circle</span>}
                </button>
              ))}
            </div>
            <div className={"mt-4 rounded-xl p-4 border flex items-center gap-3 transition-all duration-300 " + (theme==='sombre' ? "bg-slate-800 border-slate-700" : theme==='systeme' ? "bg-slate-100 border-slate-200" : "bg-white border-slate-200")}>
              <span className={"material-symbols-outlined text-2xl " + (theme==='sombre' ? "text-white" : "text-slate-600")}>
                {theme==='clair' ? 'light_mode' : theme==='sombre' ? 'dark_mode' : 'contrast'}
              </span>
              <div>
                <p className={"text-sm font-semibold " + (theme==='sombre' ? "text-white" : "text-slate-800")}>{t.themeApplique}</p>
                <p className={"text-xs " + (theme==='sombre' ? "text-slate-400" : "text-slate-500")}>{theme==='clair' ? t.clair : theme==='sombre' ? t.sombre : t.systeme}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">language</span>
            <h3 className="font-title-sm text-on-surface">{t.langue}</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-on-surface-variant mb-4">{t.langueDesc}</p>
            <div className="space-y-2">
              {([
                {value:'fr' as Langue, flag:'FR', label:'Francais', sub:'Langue par defaut', bg:'bg-blue-100 text-blue-700'},
                {value:'mg' as Langue, flag:'MG', label:'Malagasy',  sub:'Fiteny malagasy',  bg:'bg-red-100 text-red-700'},
                {value:'en' as Langue, flag:'EN', label:'English',   sub:'English language', bg:'bg-slate-100 text-slate-700'},
              ]).map((opt) => (
                <button key={opt.value} onClick={() => changerLangue(opt.value)}
                  className={"w-full flex items-center gap-4 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left " + (langue===opt.value ? "border-primary bg-teal-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50")}>
                  <div className={"w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 " + opt.bg}>{opt.flag}</div>
                  <div className="flex-1">
                    <p className={"text-sm font-semibold " + (langue===opt.value ? "text-primary" : "text-on-surface")}>{opt.label}</p>
                    <p className="text-xs text-on-surface-variant">{opt.sub}</p>
                  </div>
                  {langue===opt.value && <span className="material-symbols-outlined text-primary text-xl">check_circle</span>}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">help</span>
            <h3 className="font-title-sm text-on-surface">{t.aide}</h3>
          </div>
          <div className="p-6 space-y-3">
            {([
              {icon:'menu_book',     label:t.guide,   sub:t.guideDesc,   color:'text-blue-600 bg-blue-50'},
              {icon:'support_agent', label:t.support, sub:t.supportDesc, color:'text-teal-600 bg-teal-50'},
              {icon:'info',          label:t.apropos, sub:t.aproposDesc, color:'text-slate-500 bg-slate-100'},
            ]).map((item) => (
              <button key={item.label} onClick={() => setShowAideModal(true)}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left">
                <div className={"w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 " + item.color}>
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-on-surface">{item.label}</p>
                  <p className="text-xs text-on-surface-variant">{item.sub}</p>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-50 bg-red-50/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">logout</span>
            <h3 className="font-title-sm text-red-600">{t.deconnexion}</h3>
          </div>
          <div className="p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-on-surface font-semibold">Dr. Elena Vance</p>
              <p className="text-xs text-on-surface-variant">Chef de service - elena.vance@chu.mg</p>
            </div>
            <button onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-lg font-semibold text-sm hover:bg-red-600 active:scale-95 transition-all shadow-sm">
              <span className="material-symbols-outlined text-lg">logout</span>
              {t.seDeconnecter}
            </button>
          </div>
        </section>

      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-500 text-3xl">logout</span>
            </div>
            <h3 className="font-headline-md text-on-surface mb-2">{t.deconnecterQ}</h3>
            <p className="text-sm text-on-surface-variant mb-6">{t.deconnecterDesc}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-on-surface font-semibold text-sm hover:bg-slate-50">{t.annuler}</button>
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white font-semibold text-sm hover:bg-red-600 shadow-sm">{t.confirmer}</button>
            </div>
          </div>
        </div>
      )}

      {showAideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-blue-500 text-3xl">support_agent</span>
            </div>
            <h3 className="font-headline-md text-on-surface mb-2">{t.aideTitle}</h3>
            <p className="text-sm text-on-surface-variant mb-2">{t.aideDesc}</p>
            <p className="text-sm font-semibold text-primary mb-6">support@chu-andrainjato.mg</p>
            <button onClick={() => setShowAideModal(false)} className="w-full px-4 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:opacity-90 shadow-sm">{t.fermer}</button>
          </div>
        </div>
      )}

    </AppShell>
  )
}
`;
fs.writeFileSync('D:/chu_kine/projet_frontend/src/app/parametres/page.tsx', content, {encoding:'utf8'});
console.log('OK fichier ecrit avec succes !');
