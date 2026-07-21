'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { planifierRendezVous } from '../demandes-kine/actions'

const API = process.env.NEXT_PUBLIC_API_URL

// Notification servie par le backend kiné (/api/notifications)
interface Demande {
  id: number
  prescriptionId: string
  demandeId: string
  patientId: string
  typeKine: string
  urgence: string
  diagnostic: string
  renseignements: string
  lue: boolean
  statut: string
  createdAt: string
}

type OptionPlanif = 'maintenant' | '10min' | '20min' | '30min' | 'personnalise'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function PreinscriptionPage() {
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [demandeActive, setDemandeActive] = useState<Demande | null>(null)
  const [option, setOption] = useState<OptionPlanif>('maintenant')
  const [dateChoisie, setDateChoisie] = useState('')
  const [heureChoisie, setHeureChoisie] = useState('')
  const [planifiees, setPlanifiees] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)

  function chargerDemandes() {
    fetch(`${API}/notifications`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDemandes(data)
        else setError('Aucune donnee recue')
        setLoading(false)
      })
      .catch(() => {
        setError('Impossible de charger les demandes')
        setLoading(false)
      })
  }

  useEffect(() => {
    chargerDemandes()
  }, [])

  const enAttente = demandes.filter((d) => d.statut === "CREEE" && !planifiees.has(d.id))

  function ouvrirPlanification(d: Demande) {
    setDemandeActive(d)
    setOption('maintenant')
    setFeedback(null)
    const maintenant = new Date()
    setDateChoisie(maintenant.toISOString().slice(0, 10))
    setHeureChoisie(maintenant.toTimeString().slice(0, 5))
  }

  function fermerModale() {
    setDemandeActive(null)
  }

  function calculerDateRdv(): Date {
    const maintenant = new Date()
    if (option === '10min') return new Date(maintenant.getTime() + 10 * 60000)
    if (option === '20min') return new Date(maintenant.getTime() + 20 * 60000)
    if (option === '30min') return new Date(maintenant.getTime() + 30 * 60000)
    if (option === 'personnalise') return new Date(dateChoisie + 'T' + heureChoisie)
    return maintenant
  }

  async function confirmerPlanification() {
    if (!demandeActive) return
    const dateRdv = calculerDateRdv()
    const date = `${dateRdv.getFullYear()}-${pad(dateRdv.getMonth() + 1)}-${pad(dateRdv.getDate())}`
    const heureDebut = `${pad(dateRdv.getHours())}:${pad(dateRdv.getMinutes())}`
    const heureFin = `${pad((dateRdv.getHours() + 1) % 24)}:${pad(dateRdv.getMinutes())}`

    setBusy(true)
    setFeedback(null)
    const res = await planifierRendezVous({
      prescriptionId: demandeActive.prescriptionId,
      demandeId: demandeActive.demandeId,
      patientId: demandeActive.patientId,
      diagnostic: demandeActive.diagnostic,
      renseignements: demandeActive.renseignements,
      typeKine: demandeActive.typeKine,
      date,
      heureDebut,
      heureFin,
      type: 'soin',
      motif: demandeActive.diagnostic || demandeActive.typeKine || 'Séance de kinésithérapie',
    })
    setBusy(false)
    setFeedback(res)

    if (res.ok) {
      // Marque la notification comme lue côté backend + localement.
      fetch(`${API}/notifications/${demandeActive.id}/lire`, { method: 'PATCH' }).catch(() => {})
      setPlanifiees((prev) => new Set(prev).add(demandeActive.id))
      setDemandeActive(null)
    }
  }

  const OPTIONS: { valeur: OptionPlanif; label: string }[] = [
    { valeur: 'maintenant', label: 'Maintenant' },
    { valeur: '10min', label: 'Apres 10 min' },
    { valeur: '20min', label: 'Apres 20 min' },
    { valeur: '30min', label: 'Apres 30 min' },
    { valeur: 'personnalise', label: 'Personnalise' },
  ]

  const urgenceClass = (u: string) =>
    u === 'TRES_URGENT'
      ? 'bg-red-100 text-red-700'
      : u === 'URGENT'
        ? 'bg-orange-100 text-orange-700'
        : 'bg-blue-50 text-blue-700'

  return (
    <AppShell showSearch={false}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-on-surface font-manrope">Preinscription</h2>
          <p className="text-sm text-on-surface-variant mt-1">{enAttente.length} demande(s) en attente</p>
        </div>
      </div>

      {feedback && (
        <p className={'mb-4 text-sm font-semibold ' + (feedback.ok ? 'text-green-600' : 'text-red-600')}>
          {feedback.message}
        </p>
      )}

      <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-on-surface-variant">Chargement des demandes...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-500">{error}</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/50">
                  <th className="table-header">Patient</th>
                  <th className="table-header">Type de kine</th>
                  <th className="table-header">Urgence</th>
                  <th className="table-header">Diagnostic</th>
                  <th className="table-header text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {enAttente.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="table-cell font-semibold">{d.patientId}</td>
                    <td className="table-cell">{d.typeKine}</td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${urgenceClass(d.urgence)}`}>
                        {d.urgence}
                      </span>
                    </td>
                    <td className="table-cell max-w-[250px] truncate">{d.diagnostic}</td>
                    <td className="table-cell text-center">
                      <button onClick={() => ouvrirPlanification(d)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 transition-colors">
                        <span className="material-symbols-outlined text-sm">event_available</span>
                        Planifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && !error && enAttente.length === 0 && (
            <div className="py-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
              <p>Aucune demande en attente</p>
            </div>
          )}
        </div>
      </div>

      {/* MODALE DE PLANIFICATION */}
      {demandeActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary">event_available</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">Planifier le rendez-vous</h3>
                <p className="text-xs text-on-surface-variant">{demandeActive.patientId} — {demandeActive.typeKine}</p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {OPTIONS.map((opt) => (
                <button key={opt.valeur} onClick={() => setOption(opt.valeur)}
                  className={'w-full text-left px-4 py-3 rounded-lg border text-sm font-semibold transition-colors flex items-center justify-between ' +
                    (option === opt.valeur
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-outline-variant text-on-surface hover:bg-surface-container-low')}>
                  {opt.label}
                  {option === opt.valeur && <span className="material-symbols-outlined text-lg">check_circle</span>}
                </button>
              ))}
            </div>

            {option === 'personnalise' && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Date</label>
                  <input type="date" value={dateChoisie} onChange={(e) => setDateChoisie(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Heure</label>
                  <input type="time" value={heureChoisie} onChange={(e) => setHeureChoisie(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={fermerModale} disabled={busy}
                className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low disabled:opacity-50">
                Annuler
              </button>
              <button onClick={confirmerPlanification} disabled={busy}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:opacity-90 shadow-sm disabled:opacity-50">
                {busy ? 'Planification…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
