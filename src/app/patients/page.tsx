'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useLanguage } from '@/context/LanguageContext'

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

function estExterne(p: Patient) {
  return (p.numeroDossier || '').startsWith('CHU-')
}

export default function PatientsPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [detailsPatient, setDetailsPatient] = useState<Patient | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [rdvs, setRdvs] = useState<RendezVous[]>([])
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
  }, [])

  // Rendez-vous actif (non annulé) le plus proche pour un patient donné.
  function rdvDuPatient(patientId: number): RendezVous | undefined {
    return rdvs
      .filter(r => r.patientId === patientId)
      .sort((a, b) =>
        (a.date + (a.heureDebut || '')).localeCompare(b.date + (b.heureDebut || '')),
      )[0]
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

      {/* BARRE DE RECHERCHE */}
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

      {/* TABLEAU */}
      <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-visible">
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low/50">
                <th className="table-header bg-slate-50">{t('pat_colPatient')}</th>
                <th className="table-header bg-amber-50">Diagnostic</th>
                <th className="table-header text-center">Type</th>
                <th className="table-header text-center bg-sky-50">Détails</th>
                <th className="table-header bg-violet-50">Dernière visite</th>
                <th className="table-header text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const rdv = rdvDuPatient(p.id)
                return (
                  <tr key={p.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="table-cell bg-slate-100">
                      <div>
                        <p className="font-semibold text-on-surface">{p.prenom} {p.nom}</p>
                        <p className="text-xs text-on-surface-variant">
                          {p.dateNaissance} {p.sexe ? '- ' + (p.sexe === 'M' ? t('cal_homme') : t('cal_femme')) : ''}
                        </p>
                      </div>
                    </td>
                    <td className="table-cell bg-amber-100">
                      <p className="text-sm text-on-surface max-w-[220px] truncate">{p.diagnostic || '-'}</p>
                    </td>
                    <td className="table-cell text-center">
                      <span className={'text-[11px] font-bold px-2.5 py-1 rounded-full ' + (estExterne(p) ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700')}>
                        {estExterne(p) ? 'Externe' : 'Interne'}
                      </span>
                    </td>
                    <td className="table-cell text-center bg-sky-100">
                      <button onClick={() => setDetailsPatient(p)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
                        Détails
                        <span className="material-symbols-outlined text-sm">visibility</span>
                      </button>
                    </td>
                    <td className="table-cell text-xs bg-violet-100">
                      <span className="text-on-surface-variant">
                        {p.dateDerniereVisite || '-'}
                      </span>
                    </td>
                    <td className="table-cell text-center relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Action
                        <span className="material-symbols-outlined text-sm">expand_more</span>
                      </button>

                      {menuOpen === p.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-4 z-50 mt-1 w-52 bg-surface rounded-lg border border-outline-variant shadow-xl overflow-hidden text-left">
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
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
              <p className="mb-4">{t('pat_aucunTrouve')}</p>
              <button onClick={() => setSearch('')}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90">
                {t('pat_voirTousPatients')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODALE DÉCALER LE RENDEZ-VOUS */}
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
      {/* MODALE DETAILS PRESCRIPTION */}
      {detailsPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">description</span>
                Détails de la prescription
              </h3>
              <button onClick={() => setDetailsPatient(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Urgence</p>
                <p className="text-sm text-on-surface">{detailsPatient.urgence || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Alertes</p>
                <p className="text-sm text-on-surface">{detailsPatient.alertes || 'Aucune'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Renseignements</p>
                <p className="text-sm text-on-surface">{detailsPatient.antecedents || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Diagnostic</p>
                <p className="text-sm text-on-surface">{detailsPatient.diagnostic || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Objectifs</p>
                <p className="text-sm text-on-surface">{detailsPatient.objectifs || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Remarques</p>
                <p className="text-sm text-on-surface">{detailsPatient.remarques || 'Aucune'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Médecin prescripteur</p>
                <p className="text-sm text-on-surface">{detailsPatient.nomMedecinPrescripteur || 'Non renseigné'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
