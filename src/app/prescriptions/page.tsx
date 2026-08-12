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
type ChoixDelai = '10' | '20' | '30' | 'perso'

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

// Ajoute des minutes à une heure "HH:MM" et renvoie "HH:MM"
function ajouterMinutes(heure: string, minutes: number) {
  const [h, m] = heure.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m + minutes, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Calcule date/heureDebut/heureFin à partir de "maintenant + X minutes"
function creneauDansMinutes(minutes: number) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const debut = new Date(Date.now() + minutes * 60000)
  const fin = new Date(debut.getTime() + 30 * 60000)
  return {
    date: `${debut.getFullYear()}-${pad(debut.getMonth() + 1)}-${pad(debut.getDate())}`,
    heureDebut: `${pad(debut.getHours())}:${pad(debut.getMinutes())}`,
    heureFin: `${pad(fin.getHours())}:${pad(fin.getMinutes())}`,
  }
}

export default function PrescriptionsPage() {
  const [demandes, setDemandes] = useState<DemandePrescription[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [recherche, setRecherche] = useState('')
  const [filtreUrgence, setFiltreUrgence] = useState<FiltreUrgence>('TOUS')
  const [planifiees, setPlanifiees] = useState<Set<string>>(new Set())

  // Carte de planification (ouverte pour une seule demande à la fois)
  const [panneauOuvert, setPanneauOuvert] = useState<string | null>(null)
  const [choix, setChoix] = useState<ChoixDelai | null>(null)
  const [dateP, setDateP] = useState('')
  const [heureP, setHeureP] = useState('09:00')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [feedbackParId, setFeedbackParId] = useState<Record<string, { ok: boolean; message: string } | undefined>>({})

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

  function ouvrirPanneau(d: DemandePrescription) {
    setPanneauOuvert(d.id)
    setChoix(null)
    const auj = new Date()
    setDateP(auj.toISOString().slice(0, 10))
    setHeureP('09:00')
    setFeedbackParId((prev) => ({ ...prev, [d.id]: undefined }))
  }

  function fermerPanneau() {
    setPanneauOuvert(null)
    setChoix(null)
  }

  async function confirmerPlanification(d: DemandePrescription) {
    if (!choix) return
    setBusyId(d.id)
    const creneau =
      choix === 'perso'
        ? { date: dateP, heureDebut: heureP, heureFin: ajouterMinutes(heureP, 30) }
        : creneauDansMinutes(Number(choix))

    const res = await planifierRendezVous({
      prescriptionId: d.id,
      demandeId: d.id,
      patientId: d.patientId,
      diagnostic: d.diagnostic,
      renseignements: d.renseignements,
      urgence: d.urgence,
      alertes: d.alertes,
      objectifs: d.objectifs,
      remarques: d.remarques,
      nomMedecinPrescripteur: d.nomMedecinPrescripteur,
      date: creneau.date,
      heureDebut: creneau.heureDebut,
      heureFin: creneau.heureFin,
      type: 'soin',
      motif: d.diagnostic || d.renseignements || 'Séance de kinésithérapie',
    })
    setBusyId(null)
    if (res.ok) {
      setPlanifiees((prev) => new Set(prev).add(d.id))
      setPanneauOuvert(null)
      setChoix(null)
    } else {
      setFeedbackParId((prev) => ({ ...prev, [d.id]: res }))
    }
  }

  const FILTRES: { valeur: FiltreUrgence; label: string }[] = [
    { valeur: 'TOUS', label: 'Tous' },
    { valeur: 'TRES_URGENT', label: 'Très urgent' },
    { valeur: 'URGENT', label: 'Urgent' },
    { valeur: 'NORMAL', label: 'Normal' },
  ]

  const OPTIONS_DELAI: { valeur: ChoixDelai; label: string }[] = [
    { valeur: '10', label: 'Après 10 min' },
    { valeur: '20', label: 'Après 20 min' },
    { valeur: '30', label: 'Après 30 min' },
    { valeur: 'perso', label: 'Personnaliser' },
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

      {/* LISTE DE CARTES (sans en-tête de tableau) */}
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
            const nomComplet =
              d.patientPrenom && d.patientNom ? `${d.patientPrenom} ${d.patientNom}` : 'Patient non identifié'
            const enCours = busyId === d.id
            const fb = feedbackParId[d.id]
            const panneauActif = panneauOuvert === d.id

            return (
              <div key={d.id} className={'bg-surface rounded-xl border border-outline-variant shadow-sm border-l-4 p-4 ' + s.bord}>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
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
                    <p className="text-sm text-gray-500 truncate max-w-xl">
                      {d.diagnostic || 'Diagnostic non renseigné'}
                      {d.renseignements ? ` — ${d.renseignements}` : ''}
                    </p>
                  </div>

                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => (panneauActif ? fermerPanneau() : ouvrirPanneau(d))}
                      disabled={enCours}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base">event_available</span>
                      {enCours ? 'Planification…' : 'Planifier'}
                    </button>

                    {panneauActif && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={fermerPanneau} />
                        <div className="absolute right-0 z-50 mt-2 w-72 bg-surface rounded-xl border border-outline-variant shadow-2xl p-4 text-left">
                          <p className="text-sm font-bold text-on-surface mb-3">Planifier le rendez-vous</p>

                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {OPTIONS_DELAI.map((opt) => (
                              <button
                                key={opt.valeur}
                                onClick={() => setChoix(opt.valeur)}
                                className={
                                  'px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ' +
                                  (choix === opt.valeur
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-low')
                                }
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>

                          {choix === 'perso' && (
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div>
                                <label className="text-[11px] font-semibold text-on-surface-variant mb-1 block">Date</label>
                                <input
                                  type="date"
                                  value={dateP}
                                  onChange={(e) => setDateP(e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-outline-variant text-xs bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-on-surface-variant mb-1 block">Heure</label>
                                <input
                                  type="time"
                                  value={heureP}
                                  onChange={(e) => setHeureP(e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg border border-outline-variant text-xs bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                              </div>
                            </div>
                          )}

                          {fb && !fb.ok && <p className="text-[11px] text-red-600 mb-2">{fb.message}</p>}

                          <div className="flex gap-2">
                            <button
                              onClick={fermerPanneau}
                              disabled={enCours}
                              className="flex-1 px-3 py-2 rounded-lg border border-outline-variant text-on-surface text-xs font-semibold hover:bg-surface-container-low disabled:opacity-50"
                            >
                              Annuler
                            </button>
                            <button
                              onClick={() => confirmerPlanification(d)}
                              disabled={!choix || enCours}
                              className="flex-1 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                            >
                              {enCours ? 'Confirmation…' : 'Confirmer'}
                            </button>
                          </div>
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
    </AppShell>
  )
}
