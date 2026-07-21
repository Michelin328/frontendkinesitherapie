'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

const API = process.env.NEXT_PUBLIC_API_URL

interface NotificationKine {
  id: number
  patientId: string
  typeKine: string
  urgence: string
  diagnostic: string
  statut: string
  lue: boolean
  createdAt: string
}

interface TopBarProps {
  title?: string
  searchPlaceholder?: string
  showSearch?: boolean
  actions?: React.ReactNode
}

function jouerCarillon() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const jouerNote = (freq: number, debut: number, duree: number) => {
      const osc = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc2.type = 'sine'
      osc.frequency.value = freq
      osc2.frequency.value = freq * 2.005
      gain.gain.setValueAtTime(0, ctx.currentTime + debut)
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + debut + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + debut + duree)
      osc.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + debut)
      osc2.start(ctx.currentTime + debut)
      osc.stop(ctx.currentTime + debut + duree + 0.05)
      osc2.stop(ctx.currentTime + debut + duree + 0.05)
    }
    jouerNote(1046.5, 0, 0.6)
    jouerNote(783.99, 0.35, 0.75)
  } catch (e) {}
}

function rangUrgence(u: string) {
  if (u === 'TRES_URGENT') return 0
  if (u === 'URGENT') return 1
  return 2
}

function styleUrgence(u: string) {
  if (u === 'TRES_URGENT') return { badge: 'bg-red-100 text-red-700', bord: 'border-l-red-500', fond: 'bg-red-50' }
  if (u === 'URGENT') return { badge: 'bg-orange-100 text-orange-700', bord: 'border-l-orange-400', fond: 'bg-orange-50' }
  return { badge: 'bg-teal-100 text-teal-700', bord: 'border-l-teal-400', fond: 'bg-teal-50' }
}

export default function TopBar({
  searchPlaceholder,
  showSearch = true,
  actions,
}: TopBarProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const placeholder = searchPlaceholder || t('topbar_rechercher')

  const [notifs, setNotifs] = useState<NotificationKine[]>([])
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const dernierNombre = useRef<number | null>(null)

  function fetchNotifs() {
    fetch(`${API}/notifications`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setNotifs(Array.isArray(d) ? d : []))
      .catch(() => {})
  }

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const enAttente = notifs.filter((n) => n.statut === 'CREEE')
  const nonLues = enAttente.filter((n) => !n.lue)

  const triees = [...enAttente].sort((a, b) => {
    const diff = rangUrgence(a.urgence) - rangUrgence(b.urgence)
    if (diff !== 0) return diff
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  useEffect(() => {
    if (dernierNombre.current !== null && nonLues.length > dernierNombre.current) {
      const diff = nonLues.length - dernierNombre.current
      for (let i = 0; i < diff; i++) {
        setTimeout(() => jouerCarillon(), i * 1100)
      }
    }
    dernierNombre.current = nonLues.length
  }, [nonLues.length])

  function formatDateHeure(iso: string) {
    const dt = new Date(iso)
    const date = dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const heure = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return date + ' a ' + heure
  }

  function ouvrirNotif(n: NotificationKine) {
    if (!n.lue) {
      fetch(`${API}/notifications/${n.id}/lire`, { method: 'PATCH' })
        .then(() => fetchNotifs())
        .catch(() => {})
    }
    setOpen(false)
    router.push('/preinscription')
  }

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant px-8 flex justify-between items-center">
      {showSearch && (
        <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-full w-96">
          <span className="material-symbols-outlined text-on-surface-variant text-base">search</span>
          <input
            type="text"
            placeholder={placeholder}
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm w-full text-on-surface placeholder-on-surface-variant"
          />
        </div>
      )}
      {!showSearch && <div />}
      <div className="flex items-center gap-6">
        {actions}

        <div className="relative" ref={menuRef}>
          <button onClick={() => setOpen((o) => !o)} className="relative text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            {nonLues.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-error rounded-full text-[10px] text-white flex items-center justify-center font-bold animate-pulse">
                {nonLues.length}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-96 max-h-[460px] overflow-y-auto bg-surface rounded-xl border border-outline-variant shadow-xl z-50">
              <div className="px-4 py-3 border-b border-outline-variant sticky top-0 bg-surface">
                <p className="font-semibold text-on-surface text-sm">Notifications ({nonLues.length})</p>
              </div>
              {triees.length === 0 ? (
                <div className="py-8 text-center text-on-surface-variant text-sm">
                  Aucune notification
                </div>
              ) : (
                triees.map((n) => {
                  const s = styleUrgence(n.urgence)
                  return (
                    <div
                      key={n.id}
                      onClick={() => ouvrirNotif(n)}
                      className={
                        'px-4 py-3 border-b border-outline-variant last:border-b-0 transition-colors border-l-4 cursor-pointer ' +
                        (n.lue ? 'bg-surface hover:bg-surface-container-low/50 border-l-outline-variant' : s.fond + ' hover:brightness-95 ' + s.bord)
                      }
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' + s.badge}>
                          {n.urgence}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">{formatDateHeure(n.createdAt)}</span>
                      </div>
                      <p className={'text-sm text-on-surface ' + (n.lue ? 'font-medium' : 'font-bold')}>{n.patientId}</p>
                      <p className="text-xs text-on-surface-variant truncate">{n.typeKine} — {n.diagnostic}</p>
                      <p className="text-[11px] text-primary font-semibold mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">call_made</span>
                        Provenance : Prescription
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">EV</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-on-surface leading-none font-manrope">Dr. Elena Vance</p>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider mt-1">{t('topbar_chefDeService')}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
