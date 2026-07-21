'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'

const API = process.env.NEXT_PUBLIC_API_URL

interface Patient {
  id: number; numeroDossier: string; nom: string; prenom: string
  dateNaissance: string; sexe: string; adresse: string; telephone: string
  diagnostic: string; statut: string; dateAdmission: string
  dateDerniereVisite: string; antecedents: string
}
interface HistoriqueEntry { date: string; heure: string; texte: string }

const MOCK_PATIENTS: Record<number, Patient> = {
  1:   { id: 1,   numeroDossier: 'P-2024-001', nom: 'Rakoto', prenom: 'Jean', dateNaissance: '1985-03-12', sexe: 'M', adresse: 'Fianarantsoa', telephone: '+261 34 00 000 01', diagnostic: 'Rupture LCA genou droit', statut: 'actif', dateAdmission: '2024-04-12', dateDerniereVisite: '2024-06-08', antecedents: 'Aucun antecedent' },
  2:   { id: 2,   numeroDossier: 'P-2024-002', nom: 'Rabe', prenom: 'Marie', dateNaissance: '1992-07-23', sexe: 'F', adresse: 'Fianarantsoa', telephone: '+261 34 00 000 02', diagnostic: 'Tendinite calcifiante epaule droite', statut: 'actif', dateAdmission: '2024-04-18', dateDerniereVisite: '2024-06-05', antecedents: 'Aucun antecedent' },
  3:   { id: 3,   numeroDossier: 'P-2024-003', nom: 'Andria', prenom: 'Paul', dateNaissance: '1978-11-08', sexe: 'M', adresse: 'Fianarantsoa', telephone: '+261 34 00 000 03', diagnostic: 'Entorse cheville gauche grade 2', statut: 'actif', dateAdmission: '2024-04-22', dateDerniereVisite: '2024-06-09', antecedents: 'Aucun antecedent' },
  4:   { id: 4,   numeroDossier: 'P-2024-004', nom: 'Rasoa', prenom: 'Lala', dateNaissance: '1965-05-30', sexe: 'F', adresse: 'Fianarantsoa', telephone: '+261 34 00 000 04', diagnostic: 'Arthrose lombaire chronique', statut: 'actif', dateAdmission: '2024-05-02', dateDerniereVisite: '', antecedents: 'Aucun antecedent' },
  5:   { id: 5,   numeroDossier: 'P-2024-005', nom: 'Rakotonirina', prenom: 'Zo', dateNaissance: '2001-09-15', sexe: 'F', adresse: 'Fianarantsoa', telephone: '+261 34 00 000 05', diagnostic: 'Scoliose thoracique', statut: 'inactif', dateAdmission: '2024-03-10', dateDerniereVisite: '2024-05-28', antecedents: 'Aucun antecedent' },
  6:   { id: 6,   numeroDossier: 'P-2024-006', nom: 'Randriamihaingo', prenom: 'Tiana', dateNaissance: '1988-02-20', sexe: 'F', adresse: 'Fianarantsoa', telephone: '+261 34 00 000 06', diagnostic: 'Paralysie faciale peripherique droite', statut: 'en_attente', dateAdmission: '2024-06-08', dateDerniereVisite: '', antecedents: 'Aucun antecedent' },
  101: { id: 101, numeroDossier: 'P-2024-101', nom: 'Jenkins', prenom: 'Sarah', dateNaissance: '1990-05-14', sexe: 'F', adresse: 'Fianarantsoa', telephone: '+261 34 00 001 01', diagnostic: 'Suivi Post-operatoire Genou', statut: 'actif', dateAdmission: '2024-03-01', dateDerniereVisite: '2024-06-10', antecedents: 'Operation genou droit mars 2024' },
  102: { id: 102, numeroDossier: 'P-2024-102', nom: 'Chen', prenom: 'Michael', dateNaissance: '1983-11-22', sexe: 'M', adresse: 'Fianarantsoa', telephone: '+261 34 00 001 02', diagnostic: 'Consultation Initial Dos', statut: 'en_attente', dateAdmission: '2024-06-09', dateDerniereVisite: '', antecedents: 'Douleurs lombaires chroniques' },
  103: { id: 103, numeroDossier: 'P-2024-103', nom: 'Rodriguez', prenom: 'Elena', dateNaissance: '1981-03-08', sexe: 'F', adresse: 'Fianarantsoa', telephone: '+261 34 00 001 03', diagnostic: 'Reeducation Epaule', statut: 'actif', dateAdmission: '2024-04-15', dateDerniereVisite: '2024-06-12', antecedents: 'Rupture partielle coiffe des rotateurs' },
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

function SectionHistorique({ label, icon, value, onChange, historique, onEnregistrer, bgClass, borderClass, titleColor, histoBg, histoBorder, histoTimeColor, locked=false }: {
  label: string; icon: string; value: string; onChange: (v:string)=>void
  historique: HistoriqueEntry[]; onEnregistrer: ()=>void
  bgClass: string; borderClass: string; titleColor: string
  histoBg: string; histoBorder: string; histoTimeColor: string
  locked?: boolean
}) {
  return (
    <div className={'rounded-xl shadow-sm border p-6 ' + bgClass + ' ' + borderClass}>
      <h3 className={'font-headline-md flex items-center gap-2 mb-4 ' + titleColor}>
        <span className="material-symbols-outlined">{icon}</span>
        {label}
        {locked && <span className="ml-auto text-xs bg-white/60 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-sm">lock</span>Valide</span>}
      </h3>
      {!locked && (
        <div className="relative mb-3">
          <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
            className="w-full p-4 rounded-lg bg-white/70 border border-white/50 focus:border-white focus:ring-1 focus:ring-white/80 text-sm resize-none outline-none pb-12"
            placeholder={'Saisir ' + label.toLowerCase() + '...'} />
          <div className="absolute bottom-3 right-3">
            <button onClick={onEnregistrer} className="bg-white/80 text-slate-700 px-4 py-1.5 rounded-lg text-sm font-semibold shadow hover:bg-white transition">
              Enregistrer
            </button>
          </div>
        </div>
      )}
      {historique.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60">Historique</p>
          {historique.map((h, i) => (
            <div key={i} className={'rounded-lg p-3 border ' + histoBg + ' ' + histoBorder}>
              <p className={'text-[10px] font-semibold mb-1 ' + histoTimeColor}>{h.date} — {h.heure}</p>
              <p className="text-sm text-slate-700">{h.texte}</p>
            </div>
          ))}
        </div>
      )}
      {historique.length === 0 && locked && <p className="text-sm opacity-50 italic">Aucune entree enregistree</p>}
    </div>
  )
}

export default function PatientProfilePage({ params }: { params: { id: string } }) {
  const [patient, setPatient]         = useState<Patient | null>(null)
  const [loading, setLoading]         = useState(true)
  const [valide, setValide]           = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const from = searchParams.get('from')

  const [heureDebut, setHeureDebut]     = useState('')
  const [heureFin, setHeureFin]         = useState('')
  const [typeRdv, setTypeRdv]           = useState('')
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [religion, setReligion]         = useState('')
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
  const [historiqueTraitement, setHistoriqueTraitement] = useState<HistoriqueEntry[]>([])
  const [evolution, setEvolution]               = useState('')
  const [historiqueEvolution, setHistoriqueEvolution] = useState<HistoriqueEntry[]>([])
  const [conseil, setConseil]                   = useState('')
  const [historiqueConseil, setHistoriqueConseil] = useState<HistoriqueEntry[]>([])
  const [showRdvModal, setShowRdvModal]         = useState(false)
  const [rdvDate, setRdvDate]                   = useState('')
  const [rdvHeureDeb, setRdvHeureDeb]           = useState('')
  const [rdvType, setRdvType]                   = useState('')
  const [rdvConfirme, setRdvConfirme]           = useState(false)

  useEffect(() => {
    const numId = parseInt(params.id)
    if (MOCK_PATIENTS[numId]) {
      setPatient(MOCK_PATIENTS[numId])
      setAntecedents(MOCK_PATIENTS[numId].antecedents || '')
      setLoading(false); return
    }
    fetch(API + '/patients/' + params.id)
      .then(r => r.json())
      .then(data => { if (data?.id) { setPatient(data); setAntecedents(data.antecedents || '') } setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  function enregistrer(texte: string, setTexte: (v:string)=>void, setHisto: React.Dispatch<React.SetStateAction<HistoriqueEntry[]>>) {
    if (!texte.trim()) return
    const { date, heure } = getNow()
    setHisto(prev => [{ date, heure, texte }, ...prev])
    setTexte('')
  }

  function planifierRdv() {
    if (!rdvDate || !rdvHeureDeb) return
    setRdvConfirme(true)
    setShowRdvModal(false)
    setTimeout(() => setRdvConfirme(false), 4000)
  }

  function confirmerValidation() {
    setValide(true); setShowConfirm(false)
    setTimeout(() => router.push('/rapport'), 1500)
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

      {/* Fil d ariane */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant mb-6">
        {from === 'archives' ? (<><Link href="/archives" className="hover:text-primary">Archives</Link><span className="material-symbols-outlined text-sm">chevron_right</span><span className="text-on-surface font-semibold">{nomComplet}</span></>) : from === 'calendrier' ? (<><Link href="/calendrier" className="hover:text-primary">Calendrier</Link><span className="material-symbols-outlined text-sm">chevron_right</span><span className="text-on-surface font-semibold">{nomComplet}</span></>) : from === 'dashboard' ? (<><Link href="/" className="hover:text-primary">Tableau de bord</Link><span className="material-symbols-outlined text-sm">chevron_right</span><span className="text-on-surface font-semibold">{nomComplet}</span></>) : (<><Link href="/patients" className="hover:text-primary">Patients</Link><span className="material-symbols-outlined text-sm">chevron_right</span><span className="text-on-surface font-semibold">{nomComplet}</span></>)}
      </nav>

      {valide && (
        <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
          <span className="material-symbols-outlined text-emerald-500 text-2xl">check_circle</span>
          <div>
            <p className="font-bold text-emerald-700">Dossier valide et transmis au rapport !</p>
            <p className="text-xs text-emerald-600">Redirection vers le rapport en cours...</p>
          </div>
        </div>
      )}

      {/* HEADER PATIENT */}
      <section className="bg-gradient-to-r from-teal-600 to-teal-400 rounded-2xl shadow-lg p-6 flex items-start gap-8 mb-6 text-white">
        <div className="relative flex-shrink-0">
          <div className="w-28 h-28 rounded-xl bg-white/20 flex items-center justify-center border-2 border-white/40">
            <span className="text-4xl font-bold text-white font-manrope">{initials}</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-white font-manrope">{nomComplet}</h2>
              <p className="text-teal-100 font-medium mt-1">ID: #{patient.numeroDossier || patient.id} - {patient.sexe === 'M' ? 'Homme' : 'Femme'}</p>
            </div>
            <span className={'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ' + (patient.statut==='actif'?'bg-emerald-400 text-white':patient.statut==='archive'?'bg-red-400 text-white':patient.statut==='en_attente'?'bg-amber-400 text-white':'bg-white/30 text-white')}>{patient.statut}</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5 border-t border-white/20 pt-5">
            <div>
              <p className="text-xs font-semibold text-teal-100 uppercase tracking-widest">Date de naissance</p>
              <p className="text-sm font-bold text-white mt-1">{patient.dateNaissance || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-teal-100 uppercase tracking-widest">Religion</p>
              {!valide ? (
                <input type="text" value={religion} onChange={e => setReligion(e.target.value)} placeholder="Ex: Catholique..."
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
      </section>

      {/* CONTENU PRINCIPAL - colonne unique */}
      <div className="space-y-6">

        {/* 1 - SEANCE DU JOUR - sans heure fin */}
        <div className="rounded-xl shadow-sm border bg-teal-50 border-teal-200 p-6">
          <h3 className="font-headline-md text-teal-800 flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-teal-600">today</span>
            Seance du jour
            {valide && <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-sm">lock</span>Valide</span>}
          </h3>
          <div className="mb-4">
            <label className="text-xs font-bold text-teal-600 uppercase tracking-widest block mb-1">Heure début</label>
            <input type="time" value={heureDebut} onChange={e => !valide && setHeureDebut(e.target.value)} disabled={valide}
              className={'w-full sm:w-48 px-3 py-2 rounded-lg border text-sm outline-none ' + (valide ? 'bg-teal-100/50 border-teal-200 cursor-not-allowed' : 'bg-white border-teal-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-300')} />
          </div>
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

        {/* 3 - OBJECTIF */}
        <div className="rounded-xl shadow-sm border bg-yellow-50 border-yellow-200 p-6">
          <h3 className="font-headline-md text-yellow-800 flex items-center gap-2 mb-5"><span className="material-symbols-outlined text-yellow-600">flag</span>Objectif presempteur</h3>
          <textarea value={objectif} onChange={e => !valide && setObjectif(e.target.value)} rows={3} disabled={valide} className={'w-full p-3 rounded-lg border text-sm resize-none outline-none ' + (valide ? 'bg-yellow-100/50 border-yellow-200 cursor-not-allowed' : 'bg-white border-yellow-200 focus:border-yellow-400')} placeholder="Decrire objectif therapeutique presempteur..." />
        </div>

        {/* 4 - BILAN KINE */}
        <div className="rounded-xl shadow-sm border bg-purple-50 border-purple-200 p-6">
          <h3 className="font-headline-md text-purple-800 flex items-center gap-2 mb-5"><span className="material-symbols-outlined text-purple-600">fact_check</span>Bilan kinesitherapique</h3>
          <div className="space-y-4">
            <div><label className="text-xs font-bold text-purple-600 uppercase tracking-widest block mb-1">Antecedents</label><textarea value={antecedents} onChange={e => !valide && setAntecedents(e.target.value)} rows={3} disabled={valide} className={'w-full p-3 rounded-lg border text-sm resize-none outline-none ' + (valide ? 'bg-purple-100/50 border-purple-200 cursor-not-allowed' : 'bg-white border-purple-200 focus:border-purple-400')} placeholder="Antecedents medicaux, chirurgicaux, familiaux..." /></div>
            <div><label className="text-xs font-bold text-purple-600 uppercase tracking-widest block mb-1">Histoire de la maladie</label><textarea value={historieMaladie} onChange={e => !valide && setHistorieMaladie(e.target.value)} rows={3} disabled={valide} className={'w-full p-3 rounded-lg border text-sm resize-none outline-none ' + (valide ? 'bg-purple-100/50 border-purple-200 cursor-not-allowed' : 'bg-white border-purple-200 focus:border-purple-400')} placeholder="Decrire evolution de la maladie depuis le debut..." /></div>
            <div><label className="text-xs font-bold text-purple-600 uppercase tracking-widest block mb-1">Bilan fonctionnel</label><textarea value={bilanFonctionnel} onChange={e => !valide && setBilanFonctionnel(e.target.value)} rows={3} disabled={valide} className={'w-full p-3 rounded-lg border text-sm resize-none outline-none ' + (valide ? 'bg-purple-100/50 border-purple-200 cursor-not-allowed' : 'bg-white border-purple-200 focus:border-purple-400')} placeholder="Evaluation des capacites fonctionnelles du patient..." /></div>
            <div><label className="text-xs font-bold text-purple-600 uppercase tracking-widest block mb-1">Bilan incapacite</label><textarea value={bilanIncapacite} onChange={e => !valide && setBilanIncapacite(e.target.value)} rows={3} disabled={valide} className={'w-full p-3 rounded-lg border text-sm resize-none outline-none ' + (valide ? 'bg-purple-100/50 border-purple-200 cursor-not-allowed' : 'bg-white border-purple-200 focus:border-purple-400')} placeholder="Evaluation des incapacites et limitations..." /></div>
          </div>
        </div>

        {/* 5 - DIAGNOSTIC KINE */}
        <div className="rounded-xl shadow-sm border bg-blue-50 border-blue-200 p-6">
          <h3 className="font-headline-md text-blue-800 flex items-center gap-2 mb-5"><span className="material-symbols-outlined text-blue-600">diagnosis</span>Diagnostic kinesitherapique</h3>
          <textarea value={diagnosticKine} onChange={e => !valide && setDiagnosticKine(e.target.value)} rows={3} disabled={valide} className={'w-full p-3 rounded-lg border text-sm resize-none outline-none ' + (valide ? 'bg-blue-100/50 border-blue-200 cursor-not-allowed' : 'bg-white border-blue-200 focus:border-blue-400')} placeholder="Diagnostic etabli par le kinesitherapeute..." />
        </div>

        {/* 6 - TRAITEMENT */}
        <SectionHistorique label="Traitement" icon="vaccines"
          value={traitement} onChange={setTraitement} historique={historiqueTraitement}
          onEnregistrer={() => enregistrer(traitement, setTraitement, setHistoriqueTraitement)}
          bgClass="bg-green-50" borderClass="border-green-200" titleColor="text-green-800"
          histoBg="bg-green-100" histoBorder="border-green-200" histoTimeColor="text-green-600" locked={valide} />

        {/* 7 - EVOLUTION */}
        <SectionHistorique label="Evolution et suivi" icon="trending_up"
          value={evolution} onChange={setEvolution} historique={historiqueEvolution}
          onEnregistrer={() => enregistrer(evolution, setEvolution, setHistoriqueEvolution)}
          bgClass="bg-emerald-50" borderClass="border-emerald-200" titleColor="text-emerald-800"
          histoBg="bg-emerald-100" histoBorder="border-emerald-200" histoTimeColor="text-emerald-600" locked={valide} />

        {/* 8 - CONSEIL */}
        <SectionHistorique label="Conseil" icon="lightbulb"
          value={conseil} onChange={setConseil} historique={historiqueConseil}
          onEnregistrer={() => enregistrer(conseil, setConseil, setHistoriqueConseil)}
          bgClass="bg-amber-50" borderClass="border-amber-200" titleColor="text-amber-800"
          histoBg="bg-amber-100" histoBorder="border-amber-200" histoTimeColor="text-amber-600" locked={valide} />
        {/* 9 - HEURE FIN - apres conseil */}
        <div className="rounded-xl shadow-sm border bg-teal-50 border-teal-200 p-6">
          <h3 className="font-headline-md text-teal-800 flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-teal-600">schedule</span>
            Fin de seance
            {valide && <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-sm">lock</span>Valide</span>}
          </h3>
          <div>
            <label className="text-xs font-bold text-teal-600 uppercase tracking-widest block mb-1">Heure fin</label>
            <input type="time" value={heureFin} onChange={e => !valide && setHeureFin(e.target.value)} disabled={valide}
              className={'w-full sm:w-48 px-3 py-2 rounded-lg border text-sm outline-none ' + (valide ? 'bg-teal-100/50 border-teal-200 cursor-not-allowed' : 'bg-white border-teal-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-300')} />
          </div>
        </div>

        {/* 10 - VALIDER + ACTIONS RAPIDES cote a cote */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* BOUTON VALIDER */}
          {!valide ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-on-surface-variant text-center">Une fois valide, le dossier sera transmis au rapport et ne pourra plus etre modifie.</p>
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

          {/* ACTIONS RAPIDES */}
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

      {/* MODAL NOUVEAU RDV */}
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

      {/* MODAL CONFIRMATION VALIDATION */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-emerald-500 text-3xl">check_circle</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Confirmer la validation</h3>
            <p className="text-sm text-on-surface-variant mb-6">Une fois valide, le dossier sera verrouille et transmis automatiquement au rapport. Cette action est irreversible.</p>
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

    </AppShell>
  )
}