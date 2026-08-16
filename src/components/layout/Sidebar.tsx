'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const [confirmDeconnexion, setConfirmDeconnexion] = useState(false)

  const navItems = [
    { href: '/', icon: 'dashboard', label: t('sidebar_tableauDeBord') },
    { href: '/prescriptions', icon: 'assignment', label: t('sidebar_preinscription') },
    { href: '/patients', icon: 'group', label: t('sidebar_patients') },
    { href: '/calendrier', icon: 'calendar_today', label: t('sidebar_calendrier') },
    { href: '/archives', icon: 'inventory_2', label: t('sidebar_archives') },
    { href: '/rapport', icon: 'assessment', label: t('sidebar_rapport') },
  ]

  function deconnecter() {
    try {
      const cleTokenGarder = (cle: string) =>
        cle.startsWith('historique_patient_') ||
        cle.startsWith('religion_patient_') ||
        cle.startsWith('brouillon_patient_')
      Object.keys(localStorage)
        .filter((cle) => !cleTokenGarder(cle))
        .forEach((cle) => localStorage.removeItem(cle))
    } catch {}
    setConfirmDeconnexion(false)
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed left-0 top-0 h-full w-64 border-r border-[#2a5a8f] bg-gradient-to-b from-[#3273b0] to-[#2a5a8f] shadow-sm flex flex-col z-50 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-xl">clinical_notes</span>
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white font-manrope leading-tight">CHU Andrainjato</h1>
          <p className="text-[10px] text-sky-100 uppercase tracking-widest">{t('sidebar_kinesitherapie')}</p>
        </div>
        <button onClick={onClose} className="lg:hidden text-white/80 hover:text-white">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <nav className="mt-4 flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-out border ${isActive ? 'bg-white text-[#2a5a8f] shadow-md scale-[1.02] border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/25 hover:border-white/40 hover:shadow-sm'}`}
            >
              <span className={`material-symbols-outlined text-xl w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-[#2a5a8f]/10' : 'bg-white/20'}`}>{item.icon}</span>
              <span className="tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="px-4 pb-6">
        <button
          onClick={() => setConfirmDeconnexion(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white/15 hover:bg-red-500 text-white font-semibold text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          {t('par_deconnexion')}
        </button>
      </div>

      {confirmDeconnexion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-500 text-3xl">logout</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">{t('par_deconnecterQ')}</h3>
            <p className="text-sm text-on-surface-variant mb-6">{t('par_deconnecterDesc')}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeconnexion(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low">
                {t('par_annuler')}
              </button>
              <button onClick={deconnecter} className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white font-semibold text-sm hover:bg-red-600 shadow-sm">
                {t('par_confirmer')}
              </button>
            </div>
          </div>
        </div>
      )}
      </aside>
    </>
  )
}
