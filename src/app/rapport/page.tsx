'use client'

import { useState, useMemo, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useLanguage } from '@/context/LanguageContext'

const API = process.env.NEXT_PUBLIC_API_URL

interface Patient {
  id: number; nom: string; prenom: string; diagnostic?: string;
  numeroDossier?: string; statut?: string; sexe?: string;
}

interface RendezVous {
  id: number; date: string; heureDebut: string; heureFin: string;
  motif: string; type: string; statut: string; notes?: string;
  patient?: Patient; patientId: number;
}

type Periode = 'jour' | 'semaine' | 'mois' | 'annee'

interface Seance {
  id: number; patientId: number; date: string;
}

function estRdvRate(rdv: RendezVous, seances: Seance[]): boolean {
  if (!rdv.date) return false
  const now = new Date()
  const seuil = new Date(rdv.date + 'T21:00:00')
  if (now < seuil) return false
  return !seances.some(s => s.patientId === rdv.patientId && s.date === rdv.date)
}

function toKey(d: Date) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
}

function startOfWeek(d: Date) {
  const r = new Date(d); const day = r.getDay(); const diff = day===0?-6:1-day;
  r.setDate(r.getDate()+diff); r.setHours(0,0,0,0); return r;
}

const MOIS_LABEL = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']

function BarChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.count))
  const compact = data.length > 15
  return (
    <div className="flex items-end gap-1 h-40 overflow-x-auto pb-1">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: compact ? '10px' : '26px' }}>
          <span className="text-[9px] text-on-surface-variant">{d.count > 0 ? d.count : ''}</span>
          <div
            className="w-full bg-primary/80 rounded-t transition-all"
            style={{ height: `${(d.count / max) * 110}px`, minHeight: d.count > 0 ? '3px' : '0px' }}
            title={`${d.label} : ${d.count}`}
          />
          {!compact && (
            <span className="text-[9px] text-on-surface-variant whitespace-nowrap">{d.label}</span>
          )}
        </div>
      ))}
    </div>
  )
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const radius = 55
  const cx = 65, cy = 65
  const circumference = 2 * Math.PI * radius
  let cumulative = 0

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg viewBox="0 0 130 130" className="w-32 h-32 flex-shrink-0">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="18" />
        {total > 0 && data.map((d, i) => {
          const fraction = d.value / total
          const dash = fraction * circumference
          const gap = circumference - dash
          const rotation = (cumulative / total) * 360
          cumulative += d.value
          if (d.value === 0) return null
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={radius} fill="none"
              stroke={d.color} strokeWidth="18"
              strokeDasharray={`${dash} ${gap}`}
              transform={`rotate(${rotation - 90} ${cx} ${cy})`}
            />
          )
        })}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="fill-on-surface text-lg font-bold">
          {total}
        </text>
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-on-surface-variant">{d.label}</span>
            <span className="font-bold text-on-surface">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LineChart({ data }: { data: { label: string; rdv: number; seance: number }[] }) {
  const max = Math.max(1, ...data.map(d => Math.max(d.rdv, d.seance)))
  const w = 600, h = 160, padding = 24
  const step = data.length > 1 ? (w - padding * 2) / (data.length - 1) : 0
  const toY = (v: number) => h - padding - (v / max) * (h - padding * 2)
  const pointsRdv = data.map((d, i) => `${padding + i * step},${toY(d.rdv)}`).join(' ')
  const pointsSeance = data.map((d, i) => `${padding + i * step},${toY(d.seance)}`).join(' ')
  return (
    <div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minWidth: data.length > 20 ? data.length * 14 : undefined }}>
          <polyline points={pointsRdv} fill="none" stroke="#0d9488" strokeWidth="2" />
          <polyline points={pointsSeance} fill="none" stroke="#f59e0b" strokeWidth="2" />
          {data.map((d, i) => (
            <circle key={'r' + i} cx={padding + i * step} cy={toY(d.rdv)} r="2.5" fill="#0d9488" />
          ))}
          {data.map((d, i) => (
            <circle key={'s' + i} cx={padding + i * step} cy={toY(d.seance)} r="2.5" fill="#f59e0b" />
          ))}
        </svg>
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" /> Rendez-vous</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Séances effectuées</span>
      </div>
    </div>
  )
}

function interpreterHistogramme(data: { label: string; count: number }[]) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return "Aucun rendez-vous enregistré sur cette période."
  const pic = data.reduce((a, b) => (b.count > a.count ? b : a), data[0])
  return `Sur ${total} rendez-vous au total, le pic d'activité se situe sur "${pic.label}" avec ${pic.count} rendez-vous.`
}

function interpreterRepartition(data: { label: string; value: number }[]) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return "Aucune donnée disponible pour cette période."
  const parts = data.filter(d => d.value > 0).map(d => `${d.label} ${Math.round((d.value / total) * 100)}%`)
  return `Répartition : ${parts.join(', ')}.`
}

function interpreterCourbe(data: { rdv: number; seance: number }[]) {
  const totalRdv = data.reduce((s, d) => s + d.rdv, 0)
  const totalSeance = data.reduce((s, d) => s + d.seance, 0)
  if (totalRdv === 0 && totalSeance === 0) return "Aucune donnée disponible pour cette période."
  const taux = totalRdv > 0 ? Math.round((totalSeance / totalRdv) * 100) : 0
  return `${totalSeance} séance(s) effectuée(s) pour ${totalRdv} rendez-vous programmé(s), soit un taux de réalisation d'environ ${taux}%.`
}

export default function RapportPage() {
  const { t } = useLanguage()
  const [rdvs, setRdvs] = useState<RendezVous[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [seances, setSeances] = useState<Seance[]>([])

  useEffect(() => {
    fetch(`${API}/rendezvous`, { cache: 'no-store' })
      .then(r => r.json())
      .then((data: RendezVous[]) => setRdvs(Array.isArray(data) ? data : []))
      .catch(() => setRdvs([]))
  }, [])

  useEffect(() => {
    fetch(`${API}/patients`, { cache: 'no-store' })
      .then(r => r.json())
      .then((data: Patient[]) => setPatients(Array.isArray(data) ? data : []))
      .catch(() => setPatients([]))
  }, [])

  useEffect(() => {
    fetch(`${API}/seances`, { cache: 'no-store' })
      .then(r => r.json())
      .then((data: Seance[]) => setSeances(Array.isArray(data) ? data : []))
      .catch(() => setSeances([]))
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
    const total   = filtered.length
    const annules = filtered.filter(r => estRdvRate(r, seances)).length

    const seancesPeriode = seances.filter(s => s.date >= debut && s.date <= fin)
    const cles = new Set<string>()
    const patientsValides: number[] = []
    seancesPeriode.forEach(s => {
      const cle = s.patientId + '_' + s.date
      if (!cles.has(cle)) { cles.add(cle); patientsValides.push(s.patientId) }
    })

    const effectues = patientsValides.length
    let hommes = 0, femmes = 0
    patientsValides.forEach(id => {
      const p = patients.find(pp => pp.id === id)
      if (p?.sexe === 'M') hommes++
      else if (p?.sexe === 'F') femmes++
    })

    return { total, effectues, annules, hommes, femmes }
  }, [filtered, patients, seances, debut, fin])

  const donneesHistogramme = useMemo(() => {
    if (periode === 'annee') {
      const parMois = MOIS_LABEL.map(label => ({ label, count: 0 }))
      filtered.forEach(r => {
        const d = new Date(r.date)
        if (!isNaN(d.getTime())) parMois[d.getMonth()].count++
      })
      return parMois
    }
    if (periode === 'jour') {
      const parHeure = Array.from({ length: 24 }, (_, h) => ({ label: String(h).padStart(2,'0') + 'h', count: 0 }))
      filtered.forEach(r => {
        const h = parseInt((r.heureDebut || '0').split(':')[0], 10)
        if (!isNaN(h) && h >= 0 && h < 24) parHeure[h].count++
      })
      return parHeure
    }
    const startD = new Date(debut)
    const endD = new Date(fin)
    const jours: { label: string; count: number; dateKey: string }[] = []
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      jours.push({
        label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        count: 0,
        dateKey: toKey(d),
      })
    }
    filtered.forEach(r => {
      const item = jours.find(j => j.dateKey === r.date)
      if (item) item.count++
    })
    return jours
  }, [filtered, periode, debut, fin])

  const donneesCourbe = useMemo(() => {
    const seancesPeriode = seances.filter(s => s.date >= debut && s.date <= fin)
    if (periode === 'annee') {
      const parMoisRdv = MOIS_LABEL.map(() => 0)
      const parMoisSeance = MOIS_LABEL.map(() => 0)
      filtered.forEach(r => {
        const d = new Date(r.date)
        if (!isNaN(d.getTime())) parMoisRdv[d.getMonth()]++
      })
      seancesPeriode.forEach(s => {
        const d = new Date(s.date)
        if (!isNaN(d.getTime())) parMoisSeance[d.getMonth()]++
      })
      return MOIS_LABEL.map((label, i) => ({ label, rdv: parMoisRdv[i], seance: parMoisSeance[i] }))
    }
    if (periode === 'jour') {
      const parHeureRdv = Array.from({ length: 24 }, () => 0)
      filtered.forEach(r => {
        const h = parseInt((r.heureDebut || '0').split(':')[0], 10)
        if (!isNaN(h) && h >= 0 && h < 24) parHeureRdv[h]++
      })
      return Array.from({ length: 24 }, (_, h) => ({ label: String(h).padStart(2, '0') + 'h', rdv: parHeureRdv[h], seance: 0 }))
    }
    const startD = new Date(debut)
    const endD = new Date(fin)
    const jours: { label: string; rdv: number; seance: number; dateKey: string }[] = []
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      jours.push({ label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), rdv: 0, seance: 0, dateKey: toKey(d) })
    }
    filtered.forEach(r => {
      const item = jours.find(j => j.dateKey === r.date)
      if (item) item.rdv++
    })
    seancesPeriode.forEach(s => {
      const item = jours.find(j => j.dateKey === s.date)
      if (item) item.seance++
    })
    return jours
  }, [filtered, seances, periode, debut, fin])

  const donneesRepartitionRdv = useMemo(() => [
    { label: 'Effectués', value: stats.effectues, color: '#10b981' },
    { label: 'Annulés',   value: stats.annules,   color: '#ef4444' },
    { label: 'En attente', value: Math.max(0, stats.total - stats.effectues - stats.annules), color: '#f59e0b' },
  ], [stats])

  const donneesSexe = useMemo(() => [
    { label: 'Hommes', value: stats.hommes, color: '#3b82f6' },
    { label: 'Femmes', value: stats.femmes, color: '#ec4899' },
  ], [stats])

  function navigate(dir: number) {
    const d = new Date(refDate)
    if (periode==='jour')    d.setDate(d.getDate()+dir)
    if (periode==='semaine') d.setDate(d.getDate()+dir*7)
    if (periode==='mois')    d.setMonth(d.getMonth()+dir)
    if (periode==='annee')   d.setFullYear(d.getFullYear()+dir)
    setRefDate(d)
  }

  return (
    <AppShell searchPlaceholder="Rechercher..." showSearch={false}>

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

      <div className="hidden print:block mb-4">
        <p className="text-sm text-on-surface-variant">Période : <strong className="capitalize">{label}</strong></p>
        <p className="text-xs text-on-surface-variant">Généré le {new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}</p>
      </div>

      <div className="space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: 'event_note',   label: 'Total RDV',   value: stats.total,      color: 'text-primary',     bg: 'bg-teal-50' },
            { icon: 'check_circle', label: 'Effectués',   value: stats.effectues,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: 'cancel',       label: 'Annulés',     value: stats.annules,    color: 'text-red-500',     bg: 'bg-red-50' },
            { icon: 'man',          label: 'Hommes',      value: stats.hommes,     color: 'text-blue-600',    bg: 'bg-blue-50' },
            { icon: 'woman',        label: 'Femmes',      value: stats.femmes,     color: 'text-pink-600',    bg: 'bg-pink-50' },
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="rounded-xl border border-outline-variant p-5 bg-surface lg:col-span-2">
            <p className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">show_chart</span>
              Évolution rendez-vous / séances effectuées
            </p>
            {donneesCourbe.every(d => d.rdv === 0 && d.seance === 0) ? (
              <p className="text-sm text-on-surface-variant py-8 text-center">Aucune donnée pour cette période.</p>
            ) : (
              <>
                <LineChart data={donneesCourbe} />
                <p className="text-xs text-on-surface-variant mt-3 italic">{interpreterCourbe(donneesCourbe)}</p>
              </>
            )}
          </div>

          <div className="rounded-xl border border-outline-variant p-5 bg-surface">
            <p className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">donut_large</span>
              Répartition des rendez-vous
            </p>
            {stats.total === 0 ? (
              <p className="text-sm text-on-surface-variant py-8 text-center">Aucune donnée pour cette période.</p>
            ) : (
              <>
                <DonutChart data={donneesRepartitionRdv} />
                <p className="text-xs text-on-surface-variant mt-3 italic">{interpreterRepartition(donneesRepartitionRdv)}</p>
              </>
            )}
          </div>

          <div className="rounded-xl border border-outline-variant p-5 bg-surface lg:col-span-2">
            <p className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">wc</span>
              Répartition Hommes / Femmes (patients vus)
            </p>
            {(stats.hommes + stats.femmes) === 0 ? (
              <p className="text-sm text-on-surface-variant py-8 text-center">Aucune donnée pour cette période.</p>
            ) : (
              <>
                <DonutChart data={donneesSexe} />
                <p className="text-xs text-on-surface-variant mt-3 italic">{interpreterRepartition(donneesSexe)}</p>
              </>
            )}
          </div>
        </div>

      </div>
    </AppShell>
  )
}
