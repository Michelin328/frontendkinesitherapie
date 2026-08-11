'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { libelleService } from '@/lib/serviceLabels'
import { planifierRendezVous } from '@/app/demandes-kine/actions'

interface DemandePrescription {
  id: string
  patientId: string
  urgence: string
  diagnostic?: string
  renseignements?: string
  alertes?: string
  objectifs?: string
  remarques?: string
  nomMedecinPrescripteur?: string
  serviceIdSource?: string
  statut: string
  createdAt: string
  patientNom?: string | null
  patientPrenom?: string | null
  patientDateNaissance?: string | null
  patientSexe?: string | null
}

type FiltreUrgence = 'TOUS' | 'TRES_URGENT' | 'URGENT' | 'NORMAL'

function rangUrgence(u: string) {
  if (u === 'TRES_URGENT') return 0
  if (u === 'URGENT') return 1
  return 2
}

function styleUrgence(u: string) {
  if (u === 'TRES_URGENT') return { badge: 'bg-red-100 text-red-700', bord: 'border-l-red-500' }
  if (u === 'URGENT') return { badge: 'bg-orange-100 text-orange-700', bord: 'border-l-orange-400' }
  return { badge: 'bg-teal-100 text-teal-700', bord: 'border-l-teal-400' }
}

function formatDate(iso?: string | null) {
  if (!iso) return 'Non renseignée'
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return iso
  }
}

function labelSexe(sexe?: string | null) {
  if (sexe === 'M' || sexe === 'MALE') return 'Homme'
  if (sexe === 'F' || sexe === 'FEMALE') return 'Femme'
  return 'Non renseigné'
}

const TYPES_RDV = ['consultation', 'soin', 'bilan', 'exercice']

export default function PrescriptionsPage() {
  const [demandes, setDemandes] = useState<DemandePrescription[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [recherche, setRecherche] = useState('')
  const [filtreUrgence, setFiltreUrgence] = useState<FiltreUrgence>('TOUS')
  const [planifiees, setPlanifiees] = useState<Set<string>>(new Set())

  const [demandeActive, setDemandeActive] = useState<DemandePrescription | null>(null)
  const [date, setDate] = useState('')
  const [heureDebut, setHeureDebut] = useState('09:00')
  const [heureFin, setHeureFin] = useState('10:00')
  const [typeRdv, setTypeRdv] = useState('soin')
  const [motif, setMotif] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)

  function chargerDemandes() {
    setChargement(true)
    fetch('/api/demandes-kine', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}))
          throw new Error(data.error || `Erreur HTTP ${r.status}`)
        }
        return r.json()
      })
      .then((data) => setDemandes(Array.isArray(data) ? data : []))
      .catch((e) => setErreur(e?.message ?? 'Erreur inconnue'))
      .finally(() => setChargement(false))
  }

  useEffect(() => {
    chargerDemandes()
  }, [])

  const filtrees = useMemo(() => {
    let liste = demandes.filter((d) => d.statut === 'CREEE' && !planifiees.has(d.id))
    if (filtreUrgence !== 'TOUS') {
      liste = liste.filter((d) => d.urgence === filtreUrgence)
    }
    const s = recherche.trim().toLowerCase()
    if (s) {
      liste = liste.filter((d) =>
        `${d.patientPrenom ?? ''} ${d.patientNom ?? ''}`.toLowerCase().includes(s) ||
        (d.diagnostic ?? '').toLowerCase().includes(s) ||
        libelleService(d.serviceIdSource).toLowerCase().includes(s),
      )
    }
    return [...liste].sort((a, b) => {
      const diff = rangUrgence(a.urgence) - rangUrgence(b.urgence)
      if (diff !== 0) return diff
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [demandes, filtreUrgence, recherche, planifiees])

  function ouvrirPlanification(d: DemandePrescription) {
    setDemandeActive(d)
    setFeedback(null)
    const auj = new Date()
    setDate(auj.toISOString().slice(0, 10))
    setHeureDebut('09:00')
    setHeureFin('10:00')
    setTypeRdv('soin')
    setMotif(d.diagnostic || d.renseignements || 'Séance de kinésithérapie')
  }

  function fermerModale() {
    if (busy) return
    setDemandeActive(null)
  }

  async function confirmerPlanification() {
    if (!demandeActive) return
    setBusy(true)
    setFeedback(null)
    const res = await planifierRendezVous({
      prescriptionId: demandeActive.id,
      demandeId: demandeActive.id,
      patientId: demandeActive.patientId,
      diagnostic: demandeActive.diagnostic,
      renseignements: demandeActive.renseignements,
      urgence: demandeActive.urgence,
      alertes: demandeActive.alertes,
      objectifs: demandeActive.objectifs,
      remarques: demandeActive.remarques,
      nomMedecinPrescripteur: demandeActive.nomMedecinPrescripteur,
      date,
      heureDebut,
      heureFin,
      type: typeRdv,
      motif,
    })
    setBusy(false)
    setFeedback(res)
    if (res.ok) {
      setPlanifiees((prev) => new Set(prev).add(demandeActive.id))
      setTimeout(() => setDemandeActive(null), 900)
    }
  }

  const FILTRES: { valeur: FiltreUrgence; label: string }[] = [
    { valeur: 'TOUS', label: 'Tous' },
    { valeur: 'TRES_URGENT', label: 'Très urgent' },
    { valeur: 'URGENT', label: 'Urgent' },
    { valeur: 'NORMAL', label: 'Normal' },
  ]

  return (
    <AppShell showSearch={false}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-on-surface font-manrope">Prescriptions</h2>
          <p className="text-sm text-on-surface-variant mt-1">{filtrees.length} demande(s) en attente</p>
        </div>
      </div>

      {/* BARRE DE RECHERCHE + FILTRES */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-3 bg-surface border border-outline-variant px-4 py-2 rounded-lg flex-1 max-w-md">
          <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            placeholder="Rechercher un patient, un diagnostic, un service…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm w-full text-on-surface placeholder:text-on-surface-variant"
          />
          {recherche && (
            <button onClick={() => setRecherche('')} className="text-on-surface-variant hover:text-red-500 transition-colors flex-shrink-0">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTRES.map((f) => (
            <button
              key={f.valeur}
              onClick={() => setFiltreUrgence(f.valeur)}
              className={
                'px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ' +
                (filtreUrgence === f.valeur
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-low')
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTE */}
      {chargement ? (
        <div className="py-12 text-center text-on-surface-variant">Chargement des prescriptions…</div>
      ) : erreur ? (
        <div className="py-12 text-center text-red-600">Impossible de charger les prescriptions : {erreur}</div>
      ) : filtrees.length === 0 ? (
        <div className="py-12 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
          <p>Aucune prescription en attente pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrees.map((d) => {
            const s = styleUrgence(d.urgence)
            const nomComplet = d.patientPrenom && d.patientNom ? `${d.patientPrenom} ${d.patientNom}` : 'Patient non identifié'
            return (
              <div key={d.id} className={'bg-surface rounded-xl border border-outline-variant shadow-sm border-l-4 p-4 ' + s.bord}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={'text-[11px] font-bold px-2.5 py-1 rounded-full ' + s.badge}>{d.urgence}</span>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">call_made</span>
                        {libelleService(d.serviceIdSource)}
                      </span>
                    </div>
                    <p className="font-semibold text-on-surface">{nomComplet}</p>
                    <p className="text-xs text-on-surface-variant mb-1">
                      {formatDate(d.patientDateNaissance)} — {labelSexe(d.patientSexe)}
                    </p>
                    <p className="text-sm text-on-surface-variant truncate max-w-xl">
                      {d.diagnostic || 'Diagnostic non renseigné'}
                      {d.renseignements ? ` — ${d.renseignements}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => ouvrirPlanification(d)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-colors flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-base">event_available</span>
                    Planifier RDV
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODALE PLANIFICATION */}
      {demandeActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary">event_available</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">Planifier le rendez-vous</h3>
                <p className="text-xs text-on-surface-variant">
                  {demandeActive.patientPrenom && demandeActive.patientNom
                    ? `${demandeActive.patientPrenom} ${demandeActive.patientNom}`
                    : 'Patient non identifié'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Type</label>
                <select value={typeRdv} onChange={(e) => setTypeRdv(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {TYPES_RDV.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Heure début</label>
                <input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Heure fin</label>
                <input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Motif</label>
                <input type="text" value={motif} onChange={(e) => setMotif(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>

            {feedback && (
              <p className={'mt-3 text-sm font-semibold ' + (feedback.ok ? 'text-green-600' : 'text-red-600')}>
                {feedback.message}
              </p>
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
