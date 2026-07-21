'use client'

import { useState, useMemo } from 'react'
import AppShell from '@/components/layout/AppShell'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Kinesitherapeute } from '@/types'

const MOCK_KINES: Kinesitherapeute[] = [
  { id: 1, nom: 'Vance', prenom: 'Elena', specialite: 'Traumatologie sportive', telephone: '+261 34 98 765 43', email: 'elena.vance@chu.mg', numeroLicence: 'KINE-2020-045', statut: 'disponible', patients: Array(12) },
  { id: 2, nom: 'Rajaona', prenom: 'Hery', specialite: 'Rééducation fonctionnelle', telephone: '+261 34 55 44 333', email: 'hery.rajaona@chu.mg', numeroLicence: 'KINE-2019-032', statut: 'occupe', patients: Array(18) },
  { id: 3, nom: 'Rakotoarimanana', prenom: 'Miora', specialite: 'Pédiatrie', telephone: '+261 33 12 987 65', email: 'miora.rakoto@chu.mg', numeroLicence: 'KINE-2021-078', statut: 'disponible', patients: Array(8) },
  { id: 4, nom: 'Andrianjafy', prenom: 'Tovo', specialite: 'Gériatrie', telephone: '+261 34 77 666 55', email: 'tovo.andrianjafy@chu.mg', numeroLicence: 'KINE-2018-021', statut: 'absent', patients: Array(10) },
  { id: 5, nom: 'Rasolofoniaina', prenom: 'Fara', specialite: 'Neurologie', telephone: '+261 32 44 333 22', email: 'fara.rasolo@chu.mg', numeroLicence: 'KINE-2022-056', statut: 'occupe', patients: Array(15) },
]

const statutBadgeMap: Record<Kinesitherapeute['statut'], 'active' | 'pending' | 'warning'> = { disponible: 'active', occupe: 'pending', absent: 'warning' }
const statutLabelMap: Record<Kinesitherapeute['statut'], string> = { disponible: 'Disponible', occupe: 'Occupé(e)', absent: 'Absent(e)' }
const specialiteIcons: Record<string, string> = { 'Traumatologie sportive': 'sports_and_outdoors', 'Rééducation fonctionnelle': 'accessibility_new', 'Pédiatrie': 'child_care', 'Gériatrie': 'elderly', 'Neurologie': 'neurology' }

export default function KinesitherapeutesPage() {
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState<Kinesitherapeute['statut'] | 'tous'>('tous')
  const [selectedKine, setSelectedKine] = useState<Kinesitherapeute | null>(null)

  const filtered = useMemo(() => {
    let list = MOCK_KINES
    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter((k) => k.nom.toLowerCase().includes(s) || k.prenom.toLowerCase().includes(s) || k.specialite.toLowerCase().includes(s))
    }
    if (filterStatut !== 'tous') list = list.filter((k) => k.statut === filterStatut)
    return list
  }, [search, filterStatut])

  return (
    <AppShell searchPlaceholder="Rechercher un kinésithérapeute..." showSearch={false}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-on-surface font-manrope">Kinésithérapeutes</h2>
          <p className="text-sm text-on-surface-variant mt-1">{MOCK_KINES.length} praticiens enregistrés</p>
        </div>
        <button className="btn-primary"><span className="material-symbols-outlined text-lg">person_add</span>Nouveau praticien</button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-lg flex-1 max-w-md">
          <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
          <input type="text" placeholder="Rechercher par nom, spécialité..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent border-none focus:outline-none text-sm w-full text-on-surface placeholder:text-slate-400" />
        </div>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value as Kinesitherapeute['statut'] | 'tous')} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="tous">Tous les statuts</option>
          <option value="disponible">Disponible</option>
          <option value="occupe">Occupé(e)</option>
          <option value="absent">Absent(e)</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((kine) => (
          <div key={kine.id} className="card p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedKine(selectedKine?.id === kine.id ? null : kine)}>
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${kine.statut === 'disponible' ? 'bg-emerald-50 text-emerald-600' : kine.statut === 'occupe' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                <span className="text-xl font-bold font-manrope">{kine.prenom[0]}{kine.nom[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-on-surface truncate">{kine.prenom} {kine.nom}</h3>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${kine.statut === 'disponible' ? 'bg-emerald-500' : kine.statut === 'occupe' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                </div>
                <p className="text-xs text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-sm">{specialiteIcons[kine.specialite] || 'stethoscope'}</span>{kine.specialite}</p>
                <div className="flex items-center gap-3 mt-2">
                  <StatusBadge variant={statutBadgeMap[kine.statut]} label={statutLabelMap[kine.statut]} showDot />
                  <span className="text-xs text-on-surface-variant">{kine.patients?.length || 0} patients</span>
                </div>
              </div>
            </div>
            {selectedKine?.id === kine.id && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-xs"><span className="material-symbols-outlined text-slate-400 text-sm">call</span><span className="text-on-surface">{kine.telephone}</span></div>
                <div className="flex items-center gap-2 text-xs"><span className="material-symbols-outlined text-slate-400 text-sm">mail</span><span className="text-on-surface">{kine.email}</span></div>
                <div className="flex items-center gap-2 text-xs"><span className="material-symbols-outlined text-slate-400 text-sm">badge</span><span className="text-on-surface">Licence : {kine.numeroLicence}</span></div>
                <div className="flex gap-2 mt-3">
                  <button className="btn-outline text-xs py-1 px-3">Modifier</button>
                  <button className="btn-secondary text-xs py-1 px-3">Voir planning</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="py-12 text-center text-on-surface-variant"><span className="material-symbols-outlined text-4xl mb-2">person_off</span><p>Aucun kinésithérapeute trouvé</p></div>
      )}
    </AppShell>
  )
}
