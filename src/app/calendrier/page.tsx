'use client'

import { useState, useEffect, useMemo } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import { useLanguage } from '@/context/LanguageContext'

const API = process.env.NEXT_PUBLIC_API_URL
const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']

interface Patient {
  id: number; nom: string; prenom: string; dateNaissance?: string; sexe?: string
  diagnostic?: string; statut?: string; numeroDossier?: string; dateAdmission?: string
}

interface RendezVous {
  id: number; date: string; heureDebut: string; heureFin: string
  motif: string; type: string; statut: string; patientId: number
  patient?: Patient
}

const TYPE_COLOR: Record<string, string> = {
  consultation: 'bg-teal-50 border-teal-500 text-teal-800',
  soin:         'bg-blue-100 border-blue-500 text-blue-800',
  bilan:        'bg-purple-50 border-purple-500 text-purple-800',
  exercice:     'bg-amber-50 border-amber-500 text-amber-800',
}



const STATUT_COLOR: Record<string, string> = {
  actif:      'bg-emerald-100 text-emerald-700',
  inactif:    'bg-slate-100 text-slate-500',
  en_attente: 'bg-amber-100 text-amber-700',
  archive:    'bg-red-100 text-red-500',
}

function toKey(d: Date) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate()+n); return r }
function startOfWeek(d: Date) { const r = new Date(d); const day = r.getDay(); const diff = day===0?-6:1-day; r.setDate(r.getDate()+diff); return r }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function heureToIndex(h: string) { if (!h) return -1; const hn = parseInt(h.substring(0,2), 10); const idx = hn - 8; return (idx >= 0 && idx < HOURS.length) ? idx : -1 }

type View = 'jour' | 'semaine' | 'mois'

export default function CalendrierPage() {
  const { t } = useLanguage()

  const DAYS_SHORT = [t('cal_lun'),t('cal_mar'),t('cal_mer'),t('cal_jeu'),t('cal_ven'),t('cal_sam'),t('cal_dim')]
  const MONTHS = [t('cal_janvier'),t('cal_fevrier'),t('cal_mars'),t('cal_avril'),t('cal_mai'),t('cal_juin'),t('cal_juillet'),t('cal_aout'),t('cal_septembre'),t('cal_octobre'),t('cal_novembre'),t('cal_decembre')]

  const [view, setView]               = useState<View>('semaine')
  const [current, setCurrent]         = useState(new Date())
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [rdvs, setRdvs]               = useState<RendezVous[]>([])
  const [loading, setLoading]         = useState(true)
  const [selectedRdv, setSelectedRdv] = useState<RendezVous | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientLoading, setPatientLoading]   = useState(false)

  useEffect(() => {
    fetch(`${API}/rendezvous`, { cache: 'no-store' })
      .then(r => r.json())
      .then((data: RendezVous[]) => setRdvs(Array.isArray(data) ? data : []))
      .catch(() => setRdvs([]))
      .finally(() => setLoading(false))
  }, [])

  function selectRdv(rdv: RendezVous) {
    setSelectedRdv(rdv)
    setSelectedPatient(rdv.patient || null)
    setPatientLoading(false)
    setDrawerOpen(true)
  }

  function navigate(dir: number) {
    const d = new Date(current)
    if (view==='jour')    d.setDate(d.getDate()+dir)
    if (view==='semaine') d.setDate(d.getDate()+dir*7)
    if (view==='mois')    d.setMonth(d.getMonth()+dir)
    setCurrent(d)
  }

  const title = useMemo(() => {
    if (view==='jour') return DAYS_SHORT[current.getDay()===0?6:current.getDay()-1] + ' ' + current.getDate() + ' ' + MONTHS[current.getMonth()] + ' ' + current.getFullYear()
    if (view==='semaine') { const s=startOfWeek(current); const e=addDays(s,6); return t('cal_semaineDu') + ' ' + s.getDate() + ' - ' + e.getDate() + ' ' + MONTHS[e.getMonth()] + ' ' + e.getFullYear() }
    return MONTHS[current.getMonth()] + ' ' + current.getFullYear()
  }, [view, current, t])

  const weekDays  = useMemo(() => { const s=startOfWeek(current); return Array.from({length:7},(_,i)=>addDays(s,i)) }, [current])
  const monthGrid = useMemo(() => { const first=startOfMonth(current); const dow=first.getDay()===0?6:first.getDay()-1; const start=addDays(first,-dow); return Array.from({length:42},(_,i)=>addDays(start,i)) }, [current])

  const apptForDay = (key: string) => rdvs.filter(r => r.date === key)
  const colorOf    = (r: RendezVous) => TYPE_COLOR[r.type] || 'bg-slate-100 border-slate-400 text-slate-700'
  const patientName= (r: RendezVous) => r.patient ? r.patient.prenom + ' ' + r.patient.nom : '-'
  const today      = toKey(new Date())

  function RdvCard({ a, style, small }: { a: RendezVous; style?: React.CSSProperties; small?: boolean }) {
    return (
      <div
        onClick={() => selectRdv(a)}
        className={'border-l-4 rounded-r shadow-sm cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ' + (selectedRdv?.id===a.id ? 'ring-2 ring-primary scale-[1.02] ' : '') + colorOf(a) + (small ? ' p-1.5' : ' p-3')}
        style={style}
      >
        <p className={'font-bold truncate ' + (small?'text-[10px]':'text-xs')}>{a.motif}</p>
        <p className={'opacity-80 mt-0.5 truncate ' + (small?'text-[9px]':'text-[10px]')}>{patientName(a)}</p>
        {!small && <p className="text-[10px] opacity-70 mt-0.5">{a.heureDebut?.substring(0,5)} - {a.heureFin?.substring(0,5)}</p>}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopBar searchPlaceholder={t('cal_rechercherPlaceholder')} />
        <div className="flex flex-1 overflow-hidden">
          <section className="flex-1 overflow-auto">

            <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-sm border-b border-outline-variant px-6 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg border border-outline-variant flex items-center justify-center hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <h3 className="font-semibold text-on-surface px-2 text-sm">{title}</h3>
                <button onClick={() => navigate(1)} className="w-8 h-8 rounded-lg border border-outline-variant flex items-center justify-center hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex rounded-lg border border-outline-variant overflow-hidden text-sm">
                  {(['jour','semaine','mois'] as View[]).map((v) => (
                    <button key={v} onClick={() => setView(v)}
                      className={'px-3 py-1.5 font-semibold transition-colors capitalize ' + (view===v?'bg-primary text-white':'text-on-surface-variant hover:bg-surface-container-low')}>
                      {v==='jour'?t('cal_jour'):v==='semaine'?t('cal_semaine'):t('cal_mois')}
                    </button>
                  ))}
                </div>
                <button className="btn-primary text-sm px-4 py-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">add</span>
                  {t('cal_nouveauRdv')}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm">{t('cal_chargement')}</p>
              </div>
            ) : (
              <>
                {view==='jour' && (() => {
                  const key = toKey(current)
                  const appts = apptForDay(key)
                  return (
                    <div className="min-w-[400px]">
                      <div className="border-b border-outline-variant bg-surface sticky top-[57px] z-20 px-6 py-3 text-center">
                        <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{DAYS_SHORT[current.getDay()===0?6:current.getDay()-1]}</p>
                        <p className="text-2xl font-bold text-primary">{current.getDate()}</p>
                        <p className="text-xs text-on-surface-variant">{appts.length} {t('cal_rendezVous').toLowerCase()}</p>
                      </div>
                      <div className="relative">
                        {HOURS.map((h, hi) => (
                          <div key={h} className="flex border-b border-outline-variant min-h-[80px]">
                            <div className="w-20 flex-shrink-0 p-3 border-r border-outline-variant flex items-start justify-end pr-3">
                              <span className="text-[11px] text-on-surface-variant font-semibold">{h}</span>
                            </div>
                            <div className="flex-1 hover:bg-surface-container-low/30 transition-colors relative">
                              {appts.filter(a => heureToIndex(a.heureDebut)===hi).map(a => (
                                <RdvCard key={a.id} a={a}
                                  style={{ position:'absolute', left:'8px', right:'8px', top:'4px',
                                    height:(Math.max(1,heureToIndex(a.heureFin)-heureToIndex(a.heureDebut))*80-8) + 'px' }} />
                              ))}
                            </div>
                          </div>
                        ))}
                        {appts.length===0 && (
                          <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
                            <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                            <p className="text-sm">{t('cal_aucunRdvJour')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {view==='semaine' && (
                  <div className="min-w-[700px]">
                    <div className="grid border-b border-outline-variant bg-surface sticky top-[57px] z-20" style={{gridTemplateColumns:'80px repeat(7,1fr)'}}>
                      <div className="p-3 border-r border-outline-variant" />
                      {weekDays.map((d) => {
                        const k = toKey(d)
                        const isToday = k===today
                        return (
                          <div key={k} onClick={() => { setCurrent(d); setView('jour') }}
                            className={'p-3 text-center border-r border-outline-variant last:border-r-0 cursor-pointer hover:bg-primary/5 transition-colors ' + (isToday?'bg-primary/5':'')}>
                            <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{DAYS_SHORT[d.getDay()===0?6:d.getDay()-1]}</p>
                            <p className={'text-lg font-bold mt-0.5 ' + (isToday?'text-primary':'text-on-surface')}>{d.getDate()}</p>
                            <p className="text-[10px] text-on-surface-variant">{apptForDay(k).length>0?apptForDay(k).length+' RDV':''}</p>
                          </div>
                        )
                      })}
                    </div>
                    <div className="relative">
                      {HOURS.map((h, hi) => (
                        <div key={h} className="border-b border-outline-variant min-h-[80px]" style={{display:'grid',gridTemplateColumns:'80px repeat(7,1fr)'}}>
                          <div className="p-3 border-r border-outline-variant flex items-start justify-end pr-3">
                            <span className="text-[11px] text-on-surface-variant font-semibold">{h}</span>
                          </div>
                          {weekDays.map((d) => {
                            const k = toKey(d)
                            const isToday = k===today
                            const appts = apptForDay(k).filter(a => heureToIndex(a.heureDebut)===hi)
                            return (
                              <div key={k} className={'border-r border-outline-variant last:border-r-0 relative ' + (isToday?'bg-primary/5':'')}>
                                {appts.map(a => (
                                  <RdvCard key={a.id} a={a} small
                                    style={{ position:'absolute', left:'2px', right:'2px', top:'4px',
                                      height:(Math.max(1,heureToIndex(a.heureFin)-heureToIndex(a.heureDebut))*80-8) + 'px' }} />
                                ))}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                      <div className="absolute left-0 right-0 h-[2px] bg-red-500 z-20 pointer-events-none flex items-center" style={{top:'280px'}}>
                        <div className="w-3 h-3 rounded-full bg-red-500 ml-20 -translate-x-1/2" />
                      </div>
                    </div>
                  </div>
                )}

                {view==='mois' && (
                  <div className="p-4">
                    <div className="grid grid-cols-7 mb-1">
                      {DAYS_SHORT.map(d => (
                        <div key={d} className="text-center text-xs font-semibold text-on-surface-variant uppercase tracking-wider py-2">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {monthGrid.map((d) => {
                        const k = toKey(d)
                        const isCurrentMonth = d.getMonth()===current.getMonth()
                        const isToday = k===today
                        const appts = apptForDay(k)
                        return (
                          <div key={k}
                            className={'min-h-[90px] rounded-xl border p-2 transition-colors ' + (isCurrentMonth?'bg-surface border-outline-variant':'bg-surface-container-low border-outline-variant') + (isToday?' border-primary ring-2 ring-primary/20':'')}>
                            <p onClick={() => { setCurrent(d); setView('jour') }}
                              className={'text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full cursor-pointer hover:bg-primary/10 ' + (isToday?'bg-primary text-white':isCurrentMonth?'text-on-surface':'text-on-surface-variant')}>
                              {d.getDate()}
                            </p>
                            <div className="space-y-0.5">
                              {appts.slice(0,2).map(a => (
                                <div key={a.id} onClick={() => selectRdv(a)}
                                  className={'text-[9px] font-semibold px-1.5 py-0.5 rounded truncate border-l-2 cursor-pointer hover:opacity-80 transition-opacity ' + colorOf(a) + (selectedRdv?.id===a.id?' ring-1 ring-primary':'')}>
                                  {a.motif}
                                </div>
                              ))}
                              {appts.length>2 && (
                                <p onClick={() => { setCurrent(d); setView('jour') }}
                                  className="text-[9px] text-on-surface-variant font-semibold pl-1 cursor-pointer hover:text-primary">
                                  +{appts.length-2} {t('cal_autres')}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {drawerOpen && (
            <aside className="w-96 border-l border-outline-variant bg-surface overflow-y-auto flex flex-col flex-shrink-0">
              <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                <h3 className="font-semibold text-primary">{t('cal_profilPatient')}</h3>
                <button onClick={() => { setDrawerOpen(false); setSelectedRdv(null); setSelectedPatient(null) }}
                  className="text-on-surface-variant hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {patientLoading ? (
                <div className="flex flex-col items-center justify-center flex-1 py-16 text-on-surface-variant">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-xs">{t('cal_chargementProfil')}</p>
                </div>
              ) : selectedPatient ? (
                <>
                  <div className="p-8 text-center border-b border-outline-variant">
                    <div className="relative inline-block">
                      <div className="w-24 h-24 rounded-full mx-auto border-4 border-surface shadow-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-3xl font-bold text-primary">
                          {selectedPatient.prenom?.[0]}{selectedPatient.nom?.[0]}
                        </span>
                      </div>
                      <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-surface rounded-full" />
                    </div>
                    <a href={'/patients/' + selectedPatient.id + '?from=calendrier'} className="mt-4 font-bold text-primary text-lg hover:underline cursor-pointer block">{selectedPatient.prenom} {selectedPatient.nom}</a>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className={'text-[11px] font-bold px-2 py-0.5 rounded-full ' + (STATUT_COLOR[selectedPatient.statut||''] || 'bg-surface-container-low text-on-surface-variant')}>
                        {(selectedPatient.statut||'').toUpperCase()}
                      </span>
                      <span className="text-on-surface-variant text-xs">•</span>
                      <span className="text-on-surface-variant text-xs">{selectedPatient.numeroDossier || 'ID: #' + selectedPatient.id}</span>
                    </div>
                  </div>

                  {selectedRdv && (
                    <div className="px-6 pt-5">
                      <div className={'rounded-xl p-4 border-l-4 ' + colorOf(selectedRdv)}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-sm">event</span>
                          <h5 className="text-xs font-bold uppercase tracking-wider">{t('cal_rendezVous')}</h5>
                        </div>
                        <p className="text-sm font-bold">{selectedRdv.motif}</p>
                        <p className="text-xs opacity-80 mt-1">{selectedRdv.date} · {selectedRdv.heureDebut?.substring(0,5)} - {selectedRdv.heureFin?.substring(0,5)}</p>
                        <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60">{selectedRdv.type}</span>
                      </div>
                    </div>
                  )}

                  <div className="px-6 py-5 space-y-5">
                    <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-primary text-lg">medical_information</span>
                        <h5 className="text-xs font-bold text-primary uppercase tracking-wider">{t('cal_resumeMedical')}</h5>
                      </div>
                      <div className="space-y-2">
                        {[
                          { label: t('cal_diagnostic'),    value: selectedPatient.diagnostic || '-' },
                          { label: t('cal_dateAdmission'), value: selectedPatient.dateAdmission || '-' },
                          { label: t('cal_sexe'),          value: selectedPatient.sexe==='M'?t('cal_homme'): selectedPatient.sexe==='F'?t('cal_femme'): '-' },
                        ].map(item => (
                          <div key={item.label} className="flex justify-between">
                            <span className="text-xs text-on-surface-variant">{item.label}</span>
                            <span className="text-xs font-semibold text-primary">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button className="w-full btn-primary flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      {t('cal_nouveauCompteRendu')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 py-16 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl mb-3">person_search</span>
                  <p className="text-sm">{t('cal_cliquezRdv')}</p>
                  <p className="text-xs mt-1">{t('cal_pourVoirProfil')}</p>
                </div>
              )}
            </aside>
          )}
        </div>
      </div>

      <button
        className={'fixed bottom-8 z-30 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all ' + (drawerOpen?'right-[416px]':'right-8')}
        onClick={() => setDrawerOpen(true)}>
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>
    </div>
  )
}