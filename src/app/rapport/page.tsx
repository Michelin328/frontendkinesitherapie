'use client'

import { useState, useMemo, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useLanguage } from '@/context/LanguageContext'

const API = process.env.NEXT_PUBLIC_API_URL

interface Patient {
  id: number; nom: string; prenom: string; diagnostic?: string;
  numeroDossier?: string; statut?: string;
}

interface RendezVous {
  id: number; date: string; heureDebut: string; heureFin: string;
  motif: string; type: string; statut: string; notes?: string;
  patient?: Patient; patientId: number;
}

type Periode = 'jour' | 'semaine' | 'mois' | 'annee'

function toKey(d: Date) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
}

function startOfWeek(d: Date) {
  const r = new Date(d); const day = r.getDay(); const diff = day===0?-6:1-day;
  r.setDate(r.getDate()+diff); r.setHours(0,0,0,0); return r;
}

export default function RapportPage() {
  const { t } = useLanguage()
  const [rdvs, setRdvs] = useState<RendezVous[]>([])

  useEffect(() => {
    fetch(`${API}/rendezvous`, { cache: 'no-store' })
      .then(r => r.json())
      .then((data: RendezVous[]) => setRdvs(Array.isArray(data) ? data : []))
      .catch(() => setRdvs([]))
  }, [])
  const [periode, setPeriode] = useState<Periode>('mois')
  const [refDate, setRefDate] = useState(new Date())

  const { debut, fin, label } = useMemo(() => {
    const d = new Date(refDate); d.setHours(0,0,0,0);
    if (periode === 'jour') {
      return { debut: toKey(d), fin: toKey(d), label: d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) }
    }
    if (periode === 'semaine') {
      const s = startOfWeek(d);
      const e = new Date(s); e.setDate(e.getDate()+6);
      return { debut: toKey(s), fin: toKey(e), label: s.toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) + ' – ' + e.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}) }
    }
    if (periode === 'mois') {
      const s = new Date(d.getFullYear(), d.getMonth(), 1);
      const e = new Date(d.getFullYear(), d.getMonth()+1, 0);
      return { debut: toKey(s), fin: toKey(e), label: d.toLocaleDateString('fr-FR',{month:'long',year:'numeric'}) }
    }
    const s = new Date(d.getFullYear(), 0, 1);
    const e = new Date(d.getFullYear(), 11, 31);
    return { debut: toKey(s), fin: toKey(e), label: String(d.getFullYear()) }
  }, [periode, refDate])

  const filtered = useMemo(() =>
    rdvs.filter(r => r.date >= debut && r.date <= fin)
  , [rdvs, debut, fin])

  const stats = useMemo(() => {
    const total     = filtered.length
    const effectues = filtered.filter(r => r.statut === 'effectue' || r.statut === 'termine').length
    const annules   = filtered.filter(r => r.statut === 'annule').length
    const byType: Record<string,number> = {}
    filtered.forEach(r => { byType[r.type||'autre'] = (byType[r.type||'autre']||0)+1 })
    return { total, effectues, annules, byType }
  }, [filtered])

  function navigate(dir: number) {
    const d = new Date(refDate)
    if (periode==='jour')    d.setDate(d.getDate()+dir)
    if (periode==='semaine') d.setDate(d.getDate()+dir*7)
    if (periode==='mois')    d.setMonth(d.getMonth()+dir)
    if (periode==='annee')   d.setFullYear(d.getFullYear()+dir)
    setRefDate(d)
  }

  const TYPE_COLOR: Record<string,string> = {
    consultation: 'bg-teal-100 text-teal-700 border-teal-300',
    soin:         'bg-blue-100 text-blue-700 border-blue-300',
    autre:        'bg-slate-100 text-slate-600 border-slate-300',
  }

  const STATUT_STYLE: Record<string,string> = {
    effectue:  'bg-emerald-100 text-emerald-700',
    termine:   'bg-emerald-100 text-emerald-700',
    planifie:  'bg-amber-100 text-amber-700',
    annule:    'bg-red-100 text-red-500',
  }

  return (
    <AppShell searchPlaceholder="Rechercher..." showSearch={false}>

      {/* EN-TETE */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 print:mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">assessment</span>
            <h2 className="text-2xl font-bold text-on-surface font-manrope">Rapport d'activité</h2>
          </div>
          <p className="text-sm text-on-surface-variant">Consultation uniquement — lecture seule</p>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm shadow hover:opacity-90 transition print:hidden">
          <span className="material-symbols-outlined text-sm">print</span>
          Imprimer / PDF
        </button>
      </div>

      {/* FILTRES PERIODE */}
      <div className="flex flex-wrap items-center gap-3 mb-6 print:hidden">
        <div className="flex rounded-xl border border-outline-variant overflow-hidden text-sm">
          {(['jour','semaine','mois','annee'] as Periode[]).map(p => (
            <button key={p} onClick={() => setPeriode(p)}
              className={'px-4 py-2 font-semibold transition-colors capitalize ' + (periode===p?'bg-primary text-white':'text-on-surface-variant hover:bg-surface-container-low')}>
              {p==='jour'?'Jour':p==='semaine'?'Semaine':p==='mois'?'Mois':'Année'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg border border-outline-variant flex items-center justify-center hover:bg-surface-container-low transition">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <span className="text-sm font-semibold text-on-surface px-2 capitalize">{label}</span>
          <button onClick={() => navigate(1)} className="w-9 h-9 rounded-lg border border-outline-variant flex items-center justify-center hover:bg-surface-container-low transition">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
          <button onClick={() => setRefDate(new Date())} className="px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low transition">
            Aujourd'hui
          </button>
        </div>
      </div>

      {/* TITRE PERIODE impression */}
      <div className="hidden print:block mb-4">
        <p className="text-sm text-on-surface-variant">Période : <strong className="capitalize">{label}</strong></p>
        <p className="text-xs text-on-surface-variant">Généré le {new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}</p>
      </div>

      <div className="space-y-6">

        {/* CARTES STATISTIQUES */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: 'event_note',   label: 'Total RDV',   value: stats.total,      color: 'text-primary',     bg: 'bg-teal-50' },
            { icon: 'check_circle', label: 'Effectués',   value: stats.effectues,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: 'cancel',       label: 'Annulés',     value: stats.annules,    color: 'text-red-500',     bg: 'bg-red-50' },
          ].map(s => (
            <div key={s.label} className={'rounded-xl border border-outline-variant p-5 flex flex-col gap-2 ' + s.bg}>
              <div className="flex items-center gap-2">
                <span className={'material-symbols-outlined text-lg ' + s.color}>{s.icon}</span>
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{s.label}</span>
              </div>
              <p className={'text-3xl font-bold ' + s.color}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* REPARTITION PAR TYPE */}
        {Object.keys(stats.byType).length > 0 && (
          <div className="bg-surface rounded-xl border border-outline-variant p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">donut_small</span>
              <h3 className="font-semibold text-on-surface">Répartition par type</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.byType).map(([type, nb]) => (
                <div key={type} className={'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ' + (TYPE_COLOR[type]||TYPE_COLOR.autre)}>
                  <span className="capitalize">{type}</span>
                  <span className="bg-white/60 rounded-full px-2 py-0.5 text-xs font-bold">{nb}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TABLEAU DETAIL */}
        <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">table_view</span>
              <h3 className="font-semibold text-on-surface">Détail des rendez-vous</h3>
            </div>
            <span className="text-xs text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full">{filtered.length} entrée{filtered.length>1?'s':''}</span>
          </div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-3">event_busy</span>
              <p className="text-sm">Aucun rendez-vous sur cette période</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-container-low/80">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Heure</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Patient</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Motif</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filtered.sort((a,b) => a.date.localeCompare(b.date) || a.heureDebut.localeCompare(b.heureDebut)).map(r => (
                    <tr key={r.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-4 py-3 text-on-surface-variant">
                        {new Date(r.date + 'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-on-surface">
                        {r.heureDebut?.substring(0,5)} – {r.heureFin?.substring(0,5)}
                      </td>
                      <td className="px-4 py-3">
                        {r.patient ? (
                          <div>
                            <p className="font-semibold text-on-surface">{r.patient.prenom} {r.patient.nom}</p>
                            <p className="text-[10px] text-on-surface-variant">{r.patient.numeroDossier||'ID #'+r.patientId}</p>
                          </div>
                        ) : <span className="text-on-surface-variant">—</span>}
                      </td>
                      <td className="px-4 py-3 text-on-surface max-w-[180px] truncate">{r.motif||'—'}</td>
                      <td className="px-4 py-3">
                        <span className={'text-[11px] font-bold px-2.5 py-1 rounded-lg border capitalize ' + (TYPE_COLOR[r.type||'autre']||TYPE_COLOR.autre)}>
                          {r.type||'—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={'text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ' + (STATUT_STYLE[r.statut]||'bg-slate-100 text-slate-500')}>
                          {r.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}
