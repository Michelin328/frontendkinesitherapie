'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useLanguage } from '@/context/LanguageContext'
import { getSeances, type Seance } from '@/lib/api'

interface Patient {
  id: number; numeroDossier: string; nom: string; prenom: string
  dateNaissance: string; sexe: string; diagnostic: string
  statut: string; dateAdmission: string; dateDerniereVisite: string
  urgence?: string; alertes?: string; objectifs?: string
  remarques?: string; nomMedecinPrescripteur?: string; antecedents?: string
}

interface RendezVous {
  id: number; date: string; heureDebut: string; heureFin: string
  motif: string; type: string; statut: string; patientId: number
}

const API = process.env.NEXT_PUBLIC_API_URL

// Utilisateur connecté — provisoire (pas encore d'auth backend).
// Pour la démo : ouvrir la console navigateur et lancer
// localStorage.setItem('nomUtilisateurConnecte', 'Dr Votre Nom')
function nomUtilisateurConnecte() {
  if (typeof window === 'undefined') return 'Kinésithérapeute'
  return localStorage.getItem('nomUtilisateurConnecte') || 'Kinésithérapeute'
}

export default function PatientsPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [detailsPatient, setDetailsPatient] = useState<Patient | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [rdvs, setRdvs] = useState<RendezVous[]>([])
  const [seances, setSeances] = useState<Seance[]>([])
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [decalerRdv, setDecalerRdv] = useState<RendezVous | null>(null)
  const [dDate, setDDate] = useState('')
  const [dHeure, setDHeure] = useState('')

  useEffect(() => {
    fetch(`${API}/patients`, { cache: 'no-store' })
      .then(r => r.json())
      .then((data: Patient[]) => setPatients(Array.isArray(data) ? data : []))
      .catch(() => setPatients([]))

    fetch(`${API}/rendezvous`, { cache: 'no-store' })
      .then(r => r.json())
      .then((data: RendezVous[]) => setRdvs(Array.isArray(data) ? data : []))
      .catch(() => setRdvs([]))

    getSeances()
      .then((data) => setSeances(Array.isArray(data) ? data : []))
      .catch(() => setSeances([]))
  }, [])

  function rdvDuPatient(patientId: number): RendezVous | undefined {
    return rdvs
      .filter(r => r.patientId === patientId)
      .sort((a, b) =>
        (a.date + (a.heureDebut || '')).localeCompare(b.date + (b.heureDebut || '')),
      )[0]
  }

  function derniereSeanceDuPatient(patientId: number): Seance | undefined {
    return seances
      .filter(s => s.patientId === patientId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0]
  }

  const filtered = useMemo(() => {
    let list = patients.filter(p => p.statut !== 'archive')
    const s = search.trim().toLowerCase()
    if (s) list = list.filter(p =>
      (p.prenom + ' ' + p.nom).toLowerCase().includes(s) ||
      p.diagnostic?.toLowerCase().includes(s)
    )
    return list
  }, [search, patients])

  async function majRdv(rdvId: number, body: Partial<RendezVous>) {
    setRdvs(prev => prev.map(r => (r.id === rdvId ? { ...r, ...body } : r)))
    setMenuOpen(null)
    try {
      await fetch(`${API}/rendezvous/${rdvId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch {
      // échec réseau : l'état local reste, on pourra recharger
    }
  }

  function commencer(rdv: RendezVous) {
    majRdv(rdv.id, { statut: 'en_cours' })
    router.push('/patients/' + rdv.patientId)
  }
  function ouvrirDecaler(rdv: RendezVous) {
    setDecalerRdv(rdv)
    setMenuOpen(null)
    setDDate(rdv.date || new Date().toISOString().slice(0, 10))
    setDHeure((rdv.heureDebut || '09:00').slice(0, 5))
  }
  async function confirmerDecaler() {
    if (!decalerRdv) return
    const [h, m] = dHeure.split(':').map(Number)
    const fin = `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    await majRdv(decalerRdv.id, { date: dDate, heureDebut: dHeure, heureFin: fin, statut: 'planifie' })
    setDecalerRdv(null)
  }

  const nbActifs = filtered.length

  return (
    <AppShell searchPlaceholder={t('pat_rechercherPlaceholder')} showSearch={false}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-on-surface font-manrope">{t('pat_titre')}</h2>
          <p className="text-sm text-on-surface-variant mt-1">{nbActifs} {t('pat_enregistres')}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-3 bg-surface border border-outline-variant px-4 py-2 rounded-lg flex-1 max-w-md">
          <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
          <input type="text" placeholder={t('pat_rechercherPlaceholder')} value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm w-full text-on-surface placeholder:text-on-surface-variant" />
          {search && (
            <button onClick={() => setSearch('')} className="text-on-surface-variant hover:text-red-500 transition-colors flex-shrink-0">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-on-surface-variant bg-surface rounded-xl border border-outline-variant">
          <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
          <p className="mb-4">{t('pat_aucunTrouve')}</p>
          <button onClick={() => setSearch('')}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90">
            {t('pat_voirTousPatients')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const rdv = rdvDuPatient(p.id)
            return (
              <div key={p.id}
                className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0 bg-emerald-500 shadow-sm">
                    {p.prenom?.[0]}{p.nom?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-emerald-800 truncate">{p.prenom} {p.nom}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => setDetailsPatient(p)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">visibility</span>
                    Voir
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                      title="Action"
                    >
                      <span className="material-symbols-outlined text-lg">more_vert</span>
                    </button>

                    {menuOpen === p.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                        <div className="absolute right-0 z-50 mt-1 w-56 bg-surface rounded-lg border border-outline-variant shadow-xl overflow-hidden text-left">
                          {rdv ? (
                            <>
                              <button onClick={() => commencer(rdv)}
                                className="w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-emerald-600">play_circle</span>
                                Commencer
                              </button>
                              <button onClick={() => ouvrirDecaler(rdv)}
                                className="w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-amber-600">event_repeat</span>
                                Décaler le rendez-vous
                              </button>
                            </>
                          ) : (
                            <p className="px-4 py-3 text-xs text-on-surface-variant italic">Aucun rendez-vous actif</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {decalerRdv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600">event_repeat</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface">Décaler le rendez-vous</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Date</label>
                <input type="date" value={dDate} onChange={e => setDDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Heure</label>
                <input type="time" value={dHeure} onChange={e => setDHeure(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDecalerRdv(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low">
                Annuler
              </button>
              <button onClick={confirmerDecaler}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:opacity-90 shadow-sm">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsPatient && (() => {
        const derniereSeance = derniereSeanceDuPatient(detailsPatient.id)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-emerald-50 border-b border-emerald-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold bg-emerald-500 flex-shrink-0">
                    {detailsPatient.prenom?.[0]}{detailsPatient.nom?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-800">{detailsPatient.prenom} {detailsPatient.nom}</h3>
                    <p className="text-xs text-emerald-700/70">{detailsPatient.dateNaissance}</p>
                  </div>
                </div>
                <button onClick={() => setDetailsPatient(null)} className="text-emerald-700 hover:text-emerald-900">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6">
                <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ChampDetail label="Urgence" value={detailsPatient.urgence} />
                    <ChampDetail label="Alertes" value={detailsPatient.alertes} />
                    <ChampDetail label="Renseignements / Antécédents" value={detailsPatient.antecedents} />
                    <ChampDetail label="Diagnostic" value={detailsPatient.diagnostic} />
                    <ChampDetail label="Objectif prescripteur" value={detailsPatient.objectifs} />
                    <ChampDetail label="Dr prescripteur" value={detailsPatient.nomMedecinPrescripteur} />
                    <ChampDetail label="Bilan kinésithérapie" value={null} enAttente />
                    <ChampDetail label="Traitement" value={derniereSeance?.traitement} />
                    <ChampDetail label="Évolution / suivi" value={derniereSeance?.evolution} />
                    <ChampDetail label="Conseil" value={derniereSeance?.conseil} />
                    <ChampDetail label="Remarques" value={detailsPatient.remarques} full />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </AppShell>
  )
}

function ChampDetail({ label, value, enAttente, full }: { label: string; value?: string | null; enAttente?: boolean; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <p className="text-[10px] font-bold text-emerald-700/70 uppercase tracking-wider mb-0.5">{label}</p>
      {enAttente ? (
        <p className="text-xs text-amber-600 italic flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]">info</span>
          Champ à venir — non encore disponible dans le système
        </p>
      ) : (
        <p className="text-sm text-on-surface">{value || '—'}</p>
      )}
    </div>
  )
}
