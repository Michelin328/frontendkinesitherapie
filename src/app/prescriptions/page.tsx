'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
  if (u === 'TRES_URGENT')
    return { badge: 'bg-red-100 text-red-700', bord: 'border-l-red-500', entete: 'bg-red-50', accent: 'text-red-700' }
  if (u === 'URGENT')
    return { badge: 'bg-orange-100 text-orange-700', bord: 'border-l-orange-400', entete: 'bg-orange-50', accent: 'text-orange-700' }
  return { badge: 'bg-teal-100 text-teal-700', bord: 'border-l-teal-400', entete: 'bg-teal-50', accent: 'text-teal-700' }
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

function ajouterMinutes(heure: string, minutes: number) {
  const [h, m] = heure.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m + minutes, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

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

const OPTIONS_DELAI: { valeur: ChoixDelai; label: string }[] = [
  { valeur: '10', label: 'Après 10 min' },
  { valeur: '20', label: 'Après 20 min' },
  { valeur: '30', label: 'Après 30 min' },
  { valeur: 'perso', label: 'Personnaliser' },
]

function PrescriptionsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [demandes, setDemandes] = useState<DemandePrescription[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [recherche, setRecherche] = useState('')
  const [filtreUrgence, setFiltreUrgence] = useState<FiltreUrgence>('TOUS')
  const [planifiees, setPlanifiees] = useState<Set<string>>(new Set())
  const [patientIdFiltre, setPatientIdFiltre] = useState<string | null>(null)

  const [demandeActive, setDemandeActive] = useState<DemandePrescription | null>(null)
  const [choix, setChoix] = useState<ChoixDelai | null>(null)
  const [dateP, setDateP] = useState('')
  const [heureP, setHeureP] = useState('09:00')
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

  useEffect(() => {
    if (chargement) return
    try {
      const cles = Object.keys(localStorage).filter((k) => k.startsWith('demandeSecours_'))
      const aAjouter: DemandePrescription[] = []
      cles.forEach((cle) => {
        const pid = cle.replace('demandeSecours_', '')
        const dejaPresent = demandes.some((d) => d.patientId === pid)
        if (!dejaPresent) {
          const brut = localStorage.getItem(cle)
          if (brut) {
            const n = JSON.parse(brut)
            aAjouter.push({
              id: n.demandeId || n.prescriptionId || pid,
              patientId: n.patientId,
              urgence: n.urgence || 'NORMAL',
              diagnostic: n.diagnostic,
              renseignements: n.renseignements,
              alertes: n.alertes,
              objectifs: n.objectifs,
              remarques: n.remarques,
              nomMedecinPrescripteur: n.nomMedecinPrescripteur,
              statut: 'CREEE',
              createdAt: n.createdAt || new Date().toISOString(),
              patientNom: n.patientNom,
              patientPrenom: n.patientPrenom,
              patientDateNaissance: n.patientDateNaissance ?? null,
            })
          }
        }
      })
      if (aAjouter.length > 0) {
        setDemandes((prev) => [...prev, ...aAjouter])
      }
    } catch {}
  }, [chargement])

  useEffect(() => {
    const pid = searchParams.get('patientId')
    setPatientIdFiltre(pid)
    if (pid && !chargement) {
      const dejaPresent = demandes.some((d) => d.patientId === pid)
      if (!dejaPresent) {
        try {
          const brut = localStorage.getItem('demandeSecours_' + pid)
          if (brut) {
            const n = JSON.parse(brut)
            const demandeSecours: DemandePrescription = {
              id: n.demandeId || n.prescriptionId || pid,
              patientId: n.patientId,
              urgence: n.urgence || 'NORMAL',
              diagnostic: n.diagnostic,
              renseignements: n.renseignements,
              alertes: n.alertes,
              objectifs: n.objectifs,
              remarques: n.remarques,
              nomMedecinPrescripteur: n.nomMedecinPrescripteur,
              statut: 'CREEE',
              createdAt: n.createdAt || new Date().toISOString(),
              patientNom: n.patientNom,
              patientPrenom: n.patientPrenom,
              patientDateNaissance: n.patientDateNaissance ?? null,
            }
            setDemandes((prev) => [...prev, demandeSecours])
          }
        } catch {}
      }
    }
  }, [searchParams, demandes, chargement])

  function effacerFiltrePatient() {
    setPatientIdFiltre(null)
    router.replace('/prescriptions')
  }

  const patientFiltreNom = useMemo(() => {
    if (!patientIdFiltre) return null
    const d = demandes.find((x) => x.patientId === patientIdFiltre)
    return d?.patientPrenom && d?.patientNom ? `${d.patientPrenom} ${d.patientNom}` : null
  }, [patientIdFiltre, demandes])

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

    const trie = [...liste].sort((a, b) => {
      const diff = rangUrgence(a.urgence) - rangUrgence(b.urgence)
      if (diff !== 0) return diff
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    if (patientIdFiltre) {
      const idx = trie.findIndex((d) => d.patientId === patientIdFiltre)
      if (idx > 0) {
        const [cible] = trie.splice(idx, 1)
        trie.unshift(cible)
      }
    }
    return trie
  }, [demandes, filtreUrgence, recherche, planifiees, patientIdFiltre])

  function ouvrirModale(d: DemandePrescription) {
    setDemandeActive(d)
    setChoix(null)
    setFeedback(null)
    const auj = new Date()
    setDateP(auj.toISOString().slice(0, 10))
    setHeureP('09:00')
  }

  function fermerModale() {
    if (busy) return
    setDemandeActive(null)
    setChoix(null)
  }

  async function confirmerPlanification() {
    if (!demandeActive || !choix) return
    setBusy(true)
    setFeedback(null)
    const creneau =
      choix === 'perso'
        ? { date: dateP, heureDebut: heureP, heureFin: ajouterMinutes(heureP, 30) }
        : creneauDansMinutes(Number(choix))

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
      date: creneau.date,
      heureDebut: creneau.heureDebut,
      heureFin: creneau.heureFin,
      type: 'soin',
      motif: demandeActive.diagnostic || demandeActive.renseignements || 'Séance de kinésithérapie',
    })
    setBusy(false)
    setFeedback(res)
    if (res.ok) {
      setPlanifiees((prev) => new Set(prev).add(demandeActive.id))
      setTimeout(() => {
        setDemandeActive(null)
        setChoix(null)
      }, 700)
    }
  }

  const FILTRES: { valeur: FiltreUrgence; label: string }[] = [
    { valeur: 'TOUS', label: 'Tous' },
    { valeur: 'TRES_URGENT', label: 'Très urgent' },
    { valeur: 'URGENT', label: 'Urgent' },
    { valeur: 'NORMAL', label: 'Normal' },
  ]

  const sActive = demandeActive ? styleUrgence(demandeActive.urgence) : null
  const nomActif =
    demandeActive?.patientPrenom && demandeActive?.patientNom
      ? `${demandeActive.patientPrenom} ${demandeActive.patientNom}`
      : 'Patient non identifié'

  return (
    <AppShell showSearch={false}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-on-surface font-manrope">Prescriptions</h2>
          <p className="text-sm text-on-surface-variant mt-1">{filtrees.length} demande(s) en attente</p>
        </div>
      </div>



      {!patientIdFiltre && (
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
      )}

      {chargement ? (
        <div className="py-12 text-center text-on-surface-variant">Chargement des prescriptions…</div>
      ) : erreur ? (
        <div className="py-12 text-center text-red-600">Impossible de charger les prescriptions : {erreur}</div>
      ) : filtrees.length === 0 ? (
        <div className="py-12 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
          <p>{patientIdFiltre ? "Aucune prescription en attente pour ce patient." : 'Aucune prescription en attente pour le moment.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrees.map((d) => {
            const s = styleUrgence(d.urgence)
            const nomComplet =
              d.patientPrenom && d.patientNom ? `${d.patientPrenom} ${d.patientNom}` : 'Patient non identifié'

            return (
              <div key={d.id} className={'bg-green-50/90 rounded-xl border border-green-500/60 shadow-sm border-l-4 p-4 ' + s.bord}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-0">
                  <div className="min-w-0 md:w-48 md:flex-shrink-0">
                    <p className="font-semibold text-on-surface">{nomComplet}</p>
                    <p className="text-xs text-on-surface-variant">
                      {formatDate(d.patientDateNaissance)} — {labelSexe(d.patientSexe)}
                    </p>
                  </div>

                  <div className="md:flex-shrink-0">
                    <span className={'text-[11px] font-bold px-2.5 py-1 rounded-full ' + s.badge}>
                      {d.urgence.toLowerCase()}
                    </span>
                  </div>

                  <div className="min-w-0 md:w-64 md:flex-shrink-0">
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide">Diagnostic :</p>
                    <p className="text-sm text-gray-500 truncate">
                      {d.diagnostic || 'Non renseigné'}
                      {d.renseignements ? ` — ${d.renseignements}` : ''}
                    </p>
                  </div>

                  <div className="md:flex-shrink-0">
                    <button
                      onClick={() => ouvrirModale(d)}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">event_available</span>
                      Planifier
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {demandeActive && sActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-green-500/60">
            <div className={'px-6 pt-5 pb-4 ' + sActive.entete}>
              <h3 className="text-lg font-bold text-on-surface">Planifier le rendez-vous</h3>
              <p className={'text-sm font-semibold mt-1 ' + sActive.accent}>{nomActif}</p>
            </div>

            <div className="p-6 pt-4">
              <div className="space-y-2 mb-4">
                {OPTIONS_DELAI.map((opt) => (
                  <button
                    key={opt.valeur}
                    onClick={() => setChoix(opt.valeur)}
                    className={
                      'w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors flex items-center gap-2 ' +
                      (choix === opt.valeur
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface text-on-surface border-outline-variant hover:bg-surface-container-low')
                    }
                  >
                    <span className="material-symbols-outlined text-base">
                      {opt.valeur === 'perso' ? 'tune' : 'schedule'}
                    </span>
                    {opt.label}
                  </button>
                ))}
              </div>

              {choix === 'perso' && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Date</label>
                    <input
                      type="date"
                      value={dateP}
                      onChange={(e) => setDateP(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Heure</label>
                    <input
                      type="time"
                      value={heureP}
                      onChange={(e) => setHeureP(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              )}

              {feedback && (
                <p className={'text-sm font-semibold mb-3 ' + (feedback.ok ? 'text-green-600' : 'text-red-600')}>
                  {feedback.message}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={fermerModale}
                  disabled={busy}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmerPlanification}
                  disabled={!choix || busy}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:opacity-90 shadow-sm disabled:opacity-50"
                >
                  {busy ? 'Planification…' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default function PrescriptionsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24 text-on-surface-variant">Chargement...</div>}>
      <PrescriptionsContent />
    </Suspense>
  )
}
