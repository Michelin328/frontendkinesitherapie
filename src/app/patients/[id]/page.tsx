'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'

const API = process.env.NEXT_PUBLIC_API_URL

interface Patient {
  id: number; numeroDossier: string; nom: string; prenom: string
  dateNaissance: string; sexe: string; adresse: string; telephone: string
  diagnostic: string; statut: string; dateAdmission: string
  dateDerniereVisite: string; antecedents: string
}
interface SeanceHistorique {
  date: string; heureDebut: string; heureFin: string
  traitement: string; evolution: string; conseil: string
}

function getHeureActuelle() {
  const now = new Date()
  return String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0')
}

function getNow() {
  const now = new Date()
  const date = now.getDate() + ' ' + now.toLocaleDateString('fr-FR',{month:'long'}) + ' ' + now.getFullYear()
  const heure = String(now.getHours()).padStart(2,'0') + 'h' + String(now.getMinutes()).padStart(2,'0')
  return { date, heure }
}

const TYPES = ['consultation','soin']
const TYPE_COLOR: Record<string,string> = {
  consultation: 'bg-teal-100 text-teal-700 border-teal-300',
  soin:         'bg-blue-100 text-blue-700 border-blue-300',
}

function SectionSaisie({ label, icon, value, onChange, bgClass, borderClass, titleColor, locked=false }: {
  label: string; icon: string; value: string; onChange: (v:string)=>void
  bgClass: string; borderClass: string; titleColor: string
  locked?: boolean
}) {
  return (
    <div className={'rounded-xl shadow-sm border p-6 ' + bgClass + ' ' + borderClass}>
      <h3 className={'font-headline-md flex items-center gap-2 mb-4 ' + titleColor}>
        <span className="material-symbols-outlined">{icon}</span>
        {label}
        {locked && <span className="ml-auto text-xs bg-white/60 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-sm">lock</span>Valide</span>}
      </h3>
      <textarea value={value} onChange={e => !locked && onChange(e.target.value)} rows={3} disabled={locked}
        className={'w-full p-4 rounded-lg border text-sm resize-none outline-none ' + (locked ? 'bg-white/40 border-white/30 cursor-not-allowed' : 'bg-white/70 border-white/50 focus:border-white focus:ring-1 focus:ring-white/80')}
        placeholder={'Saisir ' + label.toLowerCase() + '...'} />
    </div>
  )
}

export default function PatientProfilePage({ params }: { params: { id: string } }) {
  const [patient, setPatient]         = useState<Patient | null>(null)
  const [loading, setLoading]         = useState(true)
  const [valide, setValide]           = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const searchParams = useSearchParams()
  const from = searchParams.get('from')

  const [heureDebut, setHeureDebut]     = useState('')
  const [heureFin, setHeureFin]         = useState('')
  const [typeRdv, setTypeRdv]           = useState('')
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [religion, setReligion]         = useState('')
  const [showHistorique, setShowHistorique] = useState(false)
  const [modeAdmission, setModeAdmission]   = useState('')
  const [autoRefere, setAutoRefere]         = useState('')
  const [referePar, setReferePar]           = useState('')
  const [objectif, setObjectif]             = useState('')
  const [antecedents, setAntecedents]       = useState('')
  const [historieMaladie, setHistorieMaladie]   = useState('')
  const [bilanFonctionnel, setBilanFonctionnel] = useState('')
  const [bilanIncapacite, setBilanIncapacite]   = useState('')
  const [diagnosticKine, setDiagnosticKine]     = useState('')
  const [traitement, setTraitement]             = useState('')
  const [evolution, setEvolution]               = useState('')
  const [conseil, setConseil]                   = useState('')
  const [seancesHistorique, setSeancesHistorique] = useState<SeanceHistorique[]>([])
  const [showRdvModal, setShowRdvModal]         = useState(false)
  const [rdvDate, setRdvDate]                   = useState('')
  const [rdvHeureDeb, setRdvHeureDeb]           = useState('')
  const [rdvType, setRdvType]                   = useState('')
  const [rdvConfirme, setRdvConfirme]           = useState(false)

  // Chargement initial : patient (API) + brouillon local + historique + religion
  useEffect(() => {
    fetch(API + '/patients/' + params.id)
      .then(r => r.json())
      .then(data => {
        if (data?.id) {
          setPatient(data)
          const savedDraft = localStorage.getItem('brouillon_patient_' + params.id)
          let draftAntecedents = null
          if (savedDraft) { try { draftAntecedents = JSON.parse(savedDraft).antecedents } catch {} }
          setAntecedents(draftAntecedents || data.antecedents || '')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))

    const savedReligion = localStorage.getItem('religion_patient_' + params.id)
    if (savedReligion) setReligion(savedReligion)

    const savedHistorique = localStorage.getItem('historique_patient_' + params.id)
    if (savedHistorique) {
      try { setSeancesHistorique(JSON.parse(savedHistorique)) } catch {}
    }

    const savedDraft = localStorage.getItem('brouillon_patient_' + params.id)
    if (savedDraft) {
      try {
        const d = JSON.parse(savedDraft)
        if (d.heureDebut) { setHeureDebut(d.heureDebut) } else { setHeureDebut(getHeureActuelle()) }
        if (d.heureFin) setHeureFin(d.heureFin)
        if (d.typeRdv) setTypeRdv(d.typeRdv)
        if (d.objectif) setObjectif(d.objectif)
        if (d.historieMaladie) setHistorieMaladie(d.historieMaladie)
        if (d.bilanFonctionnel) setBilanFonctionnel(d.bilanFonctionnel)
        if (d.bilanIncapacite) setBilanIncapacite(d.bilanIncapacite)
        if (d.diagnosticKine) setDiagnosticKine(d.diagnosticKine)
        if (d.traitement) setTraitement(d.traitement)
        if (d.evolution) setEvolution(d.evolution)
        if (d.conseil) setConseil(d.conseil)
      } catch {}
    } else {
      setHeureDebut(getHeureActuelle())
    }
  }, [params.id])

  // Sauvegarde automatique de toutes les cartes a chaque modification
  useEffect(() => {
    const draft = {
      heureDebut, heureFin, typeRdv, objectif, antecedents,
      historieMaladie, bilanFonctionnel, bilanIncapacite, diagnosticKine,
      traitement, evolution, conseil
    }
    localStorage.setItem('brouillon_patient_' + params.id, JSON.stringify(draft))
  }, [heureDebut, heureFin, typeRdv, objectif, antecedents, historieMaladie, bilanFonctionnel, bilanIncapacite, diagnosticKine, traitement, evolution, conseil, params.id])

  function handleReligionChange(v: string) {
    setReligion(v)
    localStorage.setItem('religion_patient_' + params.id, v)
  }

  async function planifierRdv() {
    if (!rdvDate || !rdvHeureDeb || !patient) return
    const [h, m] = rdvHeureDeb.split(':').map(Number)
    const heureFinCalc = String((h + 1) % 24).padStart(2, '0') + ':' + String(m).padStart(2, '0')
    try {
      await fetch(API + '/rendezvous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: rdvDate,
          heureDebut: rdvHeureDeb,
          heureFin: heureFinCalc,
          type: rdvType || 'soin',
          motif: patient.diagnostic || rdvType || 'Seance de kinesitherapie',
          statut: 'planifie',
          patientId: patient.id,
        }),
      })
      setRdvConfirme(true)
      setShowRdvModal(false)
      setTimeout(() => setRdvConfirme(false), 4000)
    } catch {
      // en cas d'echec, la modale reste ouverte pour reessayer
    }
  }

  function confirmerValidation() {
    const { date } = getNow()
    const heureFinFinale = getHeureActuelle()
    setHeureFin(heureFinFinale)
    const nouvelleSeance: SeanceHistorique = { date, heureDebut, heureFin: heureFinFinale, traitement, evolution, conseil }
    const nouvelHistorique = [nouvelleSeance, ...seancesHistorique]
    setSeancesHistorique(nouvelHistorique)
    localStorage.setItem('historique_patient_' + params.id, JSON.stringify(nouvelHistorique))
    setValide(true)
    setShowConfirm(false)

    const dateVisite = new Date().toISOString().slice(0, 10)
    fetch(API + '/patients/' + params.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateDerniereVisite: dateVisite + ' ' + heureFinFinale }),
    }).then(() => {
      setPatient(prev => prev ? { ...prev, dateDerniereVisite: dateVisite + ' ' + heureFinFinale } : prev)
    }).catch(() => {})
    // Marquer le rendez-vous du jour comme effectue (pour les rapports)
    fetch(API + '/rendezvous')
      .then(r => r.json())
      .then((all: any[]) => {
        const rdvDuJour = Array.isArray(all)
          ? all.find(r => String(r.patientId) === String(params.id) && r.date === dateVisite && r.statut === 'planifie')
          : null
        if (rdvDuJour) {
          fetch(API + '/rendezvous/' + rdvDuJour.id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statut: 'effectue' }),
          }).catch(() => {})
        }
      })
      .catch(() => {})

    // Enregistrement durable de la seance validee (visible dans Archives)
    fetch(API + '/seances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: Number(params.id),
        date,
        heureDebut,
        heureFin: heureFinFinale,
        traitement,
        evolution,
        conseil,
        kine: 'Dr. Elena Vance',
      }),
    }).catch(() => {})
  }

  if (loading) return (
    <AppShell searchPlaceholder="Rechercher..." showSearch={false}>
      <div className="py-24 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl animate-spin">progress_activity</span>
        <p className="mt-4">Chargement du profil...</p>
      </div>
    </AppShell>
  )

  if (!patient) return (
    <AppShell searchPlaceholder="Rechercher..." showSearch={false}>
      <div className="py-24 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl">person_off</span>
        <p className="mt-4">Patient introuvable</p>
        <Link href="/patients" className="mt-4 inline-block text-primary hover:underline">Retour a la liste</Link>
      </div>
    </AppShell>
  )

  const initials = (patient.prenom?.[0] || '') + (patient.nom?.[0] || '')
  const nomComplet = patient.prenom + ' ' + patient.nom

  return (
    <AppShell searchPlaceholder="Rechercher un patient..." showSearch={false}>
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant mb-6">
        <Link href="/patients" className="hover:text-primary">Fil du travail</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-on-surface font-semibold">{nomComplet}</span>
      </nav>

      {valide && (
        <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
          <span className="material-symbols-outlined text-emerald-500 text-2xl">check_circle</span>
          <div>
            <p className="font-bold text-emerald-700">Dossier valide et enregistre dans l'historique !</p>
          </div>
        </div>
      )}

      <section className="relative bg-gradient-to-r from-teal-600 to-teal-400 rounded-2xl shadow-lg p-6 mb-6 text-white">
        <button onClick={() => setShowHistorique(true)}
          className="absolute -top-3 right-6 flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm px-4 py-2 rounded-full shadow-lg border-2 border-white transition-all">
          <span className="material-symbols-outlined text-base">history</span>
          Historique
          {seancesHistorique.length > 0 && (
            <span className="bg-emerald-800 text-emerald-200 text-[10px] px-1.5 py-0.5 rounded-full">{seancesHistorique.length}</span>
          )}
        </button>

        <div className="flex items-start gap-8">
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 rounded-xl bg-white/20 flex items-center justify-center border-2 border-white/40">
              <span className="text-4xl font-bold text-white font-manrope">{initials}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-white font-manrope">{nomComplet}</h2>
                <p className="text-teal-100 font-medium mt-1">{patient.sexe === 'M' ? 'Homme' : 'Femme'}</p>
              </div>
              <span className={'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ' + (patient.statut==='actif'?'bg-emerald-400 text-white':patient.statut==='archive'?'bg-red-400 text-white':patient.statut==='en_attente'?'bg-amber-400 text-white':'bg-white/30 text-white')}>{patient.statut}</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5 border-t border-white/20 pt-4">
              <div>
                <p className="text-xs font-semibold text-teal-100 uppercase tracking-widest">Date de naissance</p>
                <p className="text-sm font-bold text-white mt-1">{patient.dateNaissance || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-teal-100 uppercase tracking-widest">Religion</p>
                {!valide ? (
                  <input type="text" value={religion} onChange={e => handleReligionChange(e.target.value)} 
                    className="mt-1 w-full bg-white/20 border border-white/30 rounded-lg px-2 py-1 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white" />
                ) : <p className="text-sm font-bold text-white mt-1">{religion || '—'}</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-teal-100 uppercase tracking-widest">Telephone</p>
                <p className="text-sm font-bold text-white mt-1">{patient.telephone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-teal-100 uppercase tracking-widest">Admission</p>
                <p className="text-sm font-bold text-white mt-1">{patient.dateAdmission || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-6">

        <div className="rounded-xl shadow-sm border bg-teal-50 border-teal-200 p-6">
          <h3 className="font-headline-md text-teal-800 flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-teal-600">today</span>
            Seance du jour
            {valide && <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-sm">lock</span>Valide</span>}
          </h3>
          <div>
            <label className="text-xs font-bold text-teal-600 uppercase tracking-widest block mb-2">Type de seance</label>
            {!valide ? (
              <div className="relative inline-block">
                <button onClick={() => setShowTypeMenu(v => !v)}
                  className={'flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-all ' + (typeRdv ? TYPE_COLOR[typeRdv] : 'border-teal-200 text-teal-400 bg-white')}>
                  <span className="material-symbols-outlined text-sm">category</span>
                  {typeRdv ? typeRdv.charAt(0).toUpperCase() + typeRdv.slice(1) : 'Choisir un type'}
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </button>
                {showTypeMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden">
                    {TYPES.map(type => (
                      <button key={type} onClick={() => { setTypeRdv(type); setShowTypeMenu(false) }}
                        className={'w-full text-left px-5 py-2.5 text-sm font-semibold capitalize transition-colors hover:opacity-80 ' + TYPE_COLOR[type]}>
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              typeRdv ? <span className={'text-sm font-bold px-4 py-2 rounded-xl border-2 inline-block capitalize ' + TYPE_COLOR[typeRdv]}>{typeRdv}</span> : <span className="text-sm text-teal-400 italic">Non defini</span>
            )}
          </div>
        </div>

        <div className="rounded-xl shadow-sm border bg-yellow-50 border-yellow-200 p-6">
          <h3 className="font-headline-md text-yellow-800 flex items-center gap-2 mb-5"><span className="material-symbols-outlined text-yellow-600">flag</span>Objectif presempteur</h3>
          <textarea value={objectif} onChange={e => !valide && setObjectif(e.target.value)} rows={3} disabled={valide} className={'w-full p-3 rounded-lg border text-sm resize-none outline-none ' + (valide ? 'bg-yellow-100/50 border-yellow-200 cursor-not-allowed' : 'bg-white border-yellow-200 focus:border-yellow-400')} placeholder="Decrire objectif therapeutique presempteur..." />
        </div>

        <div className="rounded-xl shadow-sm border bg-purple-50 border-purple-200 p-6">
          <h3 className="font-headline-md text-purple-800 flex items-center gap-2 mb-5"><span className="material-symbols-outlined text-purple-600">fact_check</span>Bilan kinesitherapique</h3>
          <div className="space-y-4">
            <div><label className="text-xs font-bold text-purple-600 uppercase tracking-widest block mb-1">Antecedents</label><textarea value={antecedents} onChange={e => !valide && setAntecedents(e.target.value)} rows={3} disabled={valide} className={'w-full p-3 rounded-lg border text-sm resize-none outline-none ' + (valide ? 'bg-purple-100/50 border-purple-200 cursor-not-allowed' : 'bg-white border-purple-200 focus:border-purple-400')} placeholder="Antecedents medicaux, chirurgicaux, familiaux..." /></div>
            <div><label className="text-xs font-bold text-purple-600 uppercase tracking-widest block mb-1">Histoire de la maladie</label><textarea value={historieMaladie} onChange={e => !valide && setHistorieMaladie(e.target.value)} rows={3} disabled={valide} className={'w-full p-3 rounded-lg border text-sm resize-none outline-none ' + (valide ? 'bg-purple-100/50 border-purple-200 cursor-not-allowed' : 'bg-white border-purple-200 focus:border-purple-400')} placeholder="Decrire evolution de la maladie depuis le debut..." /></div>
            <div><label className="text-xs font-bold text-purple-600 uppercase tracking-widest block mb-1">Bilan fonctionnel</label><textarea value={bilanFonctionnel} onChange={e => !valide && setBilanFonctionnel(e.target.value)} rows={3} disabled={valide} className={'w-full p-3 rounded-lg border text-sm resize-none outline-none ' + (valide ? 'bg-purple-100/50 border-purple-200 cursor-not-allowed' : 'bg-white border-purple-200 focus:border-purple-400')} placeholder="Evaluation des capacites fonctionnelles du patient..." /></div>
            <div><label className="text-xs font-bold text-purple-600 uppercase tracking-widest block mb-1">Bilan incapacite</label><textarea value={bilanIncapacite} onChange={e => !valide && setBilanIncapacite(e.target.value)} rows={3} disabled={valide} className={'w-full p-3 rounded-lg border text-sm resize-none outline-none ' + (valide ? 'bg-purple-100/50 border-purple-200 cursor-not-allowed' : 'bg-white border-purple-200 focus:border-purple-400')} placeholder="Evaluation des incapacites et limitations..." /></div>
          </div>
        </div>

        <div className="rounded-xl shadow-sm border bg-blue-50 border-blue-200 p-6">
          <h3 className="font-headline-md text-blue-800 flex items-center gap-2 mb-5"><span className="material-symbols-outlined text-blue-600">diagnosis</span>Diagnostic kinesitherapique</h3>
          <textarea value={diagnosticKine} onChange={e => !valide && setDiagnosticKine(e.target.value)} rows={3} disabled={valide} className={'w-full p-3 rounded-lg border text-sm resize-none outline-none ' + (valide ? 'bg-blue-100/50 border-blue-200 cursor-not-allowed' : 'bg-white border-blue-200 focus:border-blue-400')} placeholder="Diagnostic etabli par le kinesitherapeute..." />
        </div>

        <SectionSaisie label="Traitement" icon="vaccines"
          value={traitement} onChange={setTraitement}
          bgClass="bg-green-50" borderClass="border-green-200" titleColor="text-green-800" locked={valide} />

        <SectionSaisie label="Evolution et suivi" icon="trending_up"
          value={evolution} onChange={setEvolution}
          bgClass="bg-emerald-50" borderClass="border-emerald-200" titleColor="text-emerald-800" locked={valide} />

        <SectionSaisie label="Conseil" icon="lightbulb"
          value={conseil} onChange={setConseil}
          bgClass="bg-amber-50" borderClass="border-amber-200" titleColor="text-amber-800" locked={valide} />

        <div className="rounded-xl shadow-sm border bg-teal-50 border-teal-200 p-6">
          <h3 className="font-headline-md text-teal-800 flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-teal-600">schedule</span>
            Fin de seance
            {valide && <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-sm">lock</span>Valide</span>}
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {!valide ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-on-surface-variant text-center">Une fois valide, le dossier sera verrouille et ajoute a l'historique.</p>
              <button onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-500 text-white font-bold text-base shadow-lg hover:bg-emerald-600 transition-all">
                <span className="material-symbols-outlined">check_circle</span>
                Valider le dossier
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6 flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-4xl">verified</span>
              <p className="font-bold text-emerald-700">Dossier valide</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h4 className="font-title-sm text-on-surface mb-4">Actions rapides</h4>
            <div className="space-y-3">
              <button onClick={() => setShowRdvModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-white font-semibold text-sm hover:opacity-90 transition-all">
                <span className="material-symbols-outlined text-lg">event_available</span>
                Nouveau rendez-vous
              </button>
              {rdvConfirme && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                  <p className="text-xs font-semibold text-emerald-700">RDV planifie le {new Date(rdvDate + 'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})} a {rdvHeureDeb}</p>
                </div>
              )}
              {from === 'archives' ? (
                <Link href="/archives" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 text-on-surface font-semibold text-sm hover:bg-slate-50 transition-all"><span className="material-symbols-outlined text-lg">arrow_back</span>Retour aux archives</Link>
              ) : from === 'calendrier' ? (
                <Link href="/calendrier" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 text-on-surface font-semibold text-sm hover:bg-slate-50 transition-all"><span className="material-symbols-outlined text-lg">arrow_back</span>Retour au calendrier</Link>
              ) : from === 'dashboard' ? (
                <Link href="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 text-on-surface font-semibold text-sm hover:bg-slate-50 transition-all"><span className="material-symbols-outlined text-lg">arrow_back</span>Retour au tableau de bord</Link>
              ) : (
                <Link href="/patients" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 text-on-surface font-semibold text-sm hover:bg-slate-50 transition-all"><span className="material-symbols-outlined text-lg">arrow_back</span>Retour a la liste</Link>
              )}
            </div>
          </div>
        </div>

      </div>

      {showRdvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">event_available</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">Planifier un rendez-vous</h3>
                <p className="text-xs text-on-surface-variant">{nomComplet}</p>
              </div>
              <button onClick={() => setShowRdvModal(false)} className="ml-auto text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Date du rendez-vous</label>
                <input type="date" value={rdvDate} onChange={e => setRdvDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Heure</label>
                <input type="time" value={rdvHeureDeb} onChange={e => setRdvHeureDeb(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Type de seance</label>
                <div className="flex gap-2">
                  {['consultation','soin'].map(type => (
                    <button key={type} onClick={() => setRdvType(type)}
                      className={'flex-1 py-2 rounded-lg border-2 text-sm font-semibold capitalize transition-all ' + (rdvType===type ? TYPE_COLOR[type] : 'border-slate-200 text-slate-400 bg-slate-50 hover:bg-slate-100')}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowRdvModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low">
                Annuler
              </button>
              <button onClick={planifierRdv} disabled={!rdvDate || !rdvHeureDeb}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:opacity-90 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">check</span>
                Planifier
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-emerald-500 text-3xl">check_circle</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Confirmer la validation</h3>
            <p className="text-sm text-on-surface-variant mb-6">Une fois valide, le dossier sera verrouille et ajoute a l'historique. Cette action est irreversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low">
                Annuler
              </button>
              <button onClick={confirmerValidation}
                className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 shadow-sm">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistorique && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500">history</span>
                Historique des seances
              </h3>
              <button onClick={() => setShowHistorique(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {seancesHistorique.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic">Aucune seance enregistree pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {seancesHistorique.map((s, i) => (
                  <div key={i} className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">event</span>{s.date} — {(s.heureDebut || '?').replace(':','h')}-{(s.heureFin || '?').replace(':','h')}
                    </p>
                    <div className="space-y-2">
                      {s.traitement && (<div><p className="text-[11px] font-semibold text-emerald-600">Traitement</p><p className="text-sm text-on-surface">{s.traitement}</p></div>)}
                      {s.evolution && (<div><p className="text-[11px] font-semibold text-emerald-600">Evolution et suivi</p><p className="text-sm text-on-surface">{s.evolution}</p></div>)}
                      {s.conseil && (<div><p className="text-[11px] font-semibold text-emerald-600">Conseil</p><p className="text-sm text-on-surface">{s.conseil}</p></div>)}
                      {!s.traitement && !s.evolution && !s.conseil && (<p className="text-sm text-on-surface-variant italic">Aucun contenu saisi</p>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </AppShell>
  )
}
