const fs = require('fs');
const content = `'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { useLanguage } from '@/context/LanguageContext'

const API = process.env.NEXT_PUBLIC_API_URL

interface Patient {
  id: number
  numeroDossier: string
  nom: string
  prenom: string
  dateNaissance: string
  sexe: string
  diagnostic: string
  statut: string
  dateAdmission: string
  dateDerniereVisite: string
}

const statutStyle: Record<string, string> = {
  actif: 'bg-emerald-50 text-emerald-700',
  inactif: 'bg-surface-container-low text-on-surface-variant',
  en_attente: 'bg-amber-50 text-amber-700',
  archive: 'bg-red-50 text-red-500',
}

export default function PatientsPage() {
  const { t } = useLanguage()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const statutLabel: Record<string, string> = {
    actif: t('pat_actif'),
    inactif: t('pat_inactif'),
    en_attente: t('pat_enAttente'),
    archive: t('pat_archive'),
  }

  useEffect(() => {
    fetch(`${API}/patients`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPatients(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = patients
    const s = search.trim().replace(/\s+/g, ' ').toLowerCase()
    if (s) {
      list = list.filter((p) => {
        const nomComplet = `${p.prenom} ${p.nom}`.toLowerCase()
        const nomInverse = `${p.nom} ${p.prenom}`.toLowerCase()
        return (
          nomComplet.includes(s) ||
          nomInverse.includes(s) ||
          p.nom?.toLowerCase().includes(s) ||
          p.prenom?.toLowerCase().includes(s) ||
          p.numeroDossier?.toLowerCase().includes(s) ||
          p.diagnostic?.toLowerCase().includes(s)
        )
      })
    }
    if (filterStatut !== 'tous') list = list.filter((p) => p.statut === filterStatut)
    return list
  }, [search, filterStatut, patients])

  async function archiver(id: number) {
    try {
      await fetch(`${API}/patients/${id}/archiver`, { method: 'PATCH' })
    } catch {}
    setPatients((prev) => prev.map((p) => p.id === id ? { ...p, statut: 'archive' } : p))
    setConfirmId(null)
  }

  return (
    <AppShell searchPlaceholder={t('pat_rechercherPlaceholder')} showSearch={false}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-on-surface font-manrope">{t('pat_titre')}</h2>
          <p className="text-sm text-on-surface-variant mt-1">{patients.length} {t('pat_enregistres')}</p>
        </div>
        <Link href="/patients/nouveau" className="btn-primary">
          <span className="material-symbols-outlined text-lg">person_add</span>
          {t('pat_nouveauPatient')}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-3 bg-surface border border-outline-variant px-4 py-2 rounded-lg flex-1 max-w-md">
          <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            placeholder={t('pat_rechercherPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm w-full text-on-surface placeholder:text-on-surface-variant"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-on-surface-variant hover:text-red-500 transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="px-4 py-2 rounded-lg border border-outline-variant bg-surface text-sm text-on-surface focus:outline-none"
        >
          <option value="tous">{t('pat_tousLesStatuts')}</option>
          <option value="actif">{t('pat_actif')}</option>
          <option value="inactif">{t('pat_inactif')}</option>
          <option value="en_attente">{t('pat_enAttente')}</option>
          <option value="archive">{t('pat_archive')}</option>
        </select>
        {(search || filterStatut !== 'tous') && (
          <button
            onClick={() => { setSearch(''); setFilterStatut('tous') }}
            className="px-4 py-2 rounded-lg border border-outline-variant bg-surface text-sm text-red-500 font-semibold hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">filter_alt_off</span>
            {t('pat_toutAfficher')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm">{t('pat_chargement')}</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/50">
                  <th className="table-header">{t('pat_colDossier')}</th>
                  <th className="table-header">{t('pat_colPatient')}</th>
                  <th className="table-header">{t('pat_colDiagnostic')}</th>
                  <th className="table-header">{t('pat_colStatut')}</th>
                  <th className="table-header">{t('pat_colDerniereVisite')}</th>
                  <th className="table-header text-center">{t('pat_colArchive')}</th>
                  <th className="table-header w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="table-cell">
                      <span className="text-xs font-mono text-primary font-semibold">{p.numeroDossier || '-'}</span>
                    </td>
                    <td className="table-cell">
                      <Link href={`/patients/${p.id}`} className="hover:underline">
                        <p className="font-semibold text-on-surface">{p.prenom} {p.nom}</p>
                        <p className="text-xs text-on-surface-variant">{p.dateNaissance} - {p.sexe === 'M' ? t('cal_homme') : t('cal_femme')}</p>
                      </Link>
                    </td>
                    <td className="table-cell">
                      <p className="text-sm text-on-surface max-w-[200px] truncate">{p.diagnostic || '-'}</p>
                    </td>
                    <td className="table-cell">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statutStyle[p.statut] || 'bg-surface-container-low text-on-surface-variant'}`}>
                        {statutLabel[p.statut] || p.statut}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-on-surface-variant">
                      {p.dateDerniereVisite || '-'}
                    </td>
                    <td className="table-cell text-center">
                      {p.statut !== 'archive' ? (
                        <button
                          onClick={() => setConfirmId(p.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors border border-amber-200"
                        >
                          <span className="material-symbols-outlined text-sm">inventory_2</span>
                          {t('pat_btnArchiver')}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant text-xs font-semibold">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          {t('pat_archive')}
                        </span>
                      )}
                    </td>
                    <td className="table-cell">
                      <Link href={`/patients/${p.id}`} className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors text-lg">
                        chevron_right
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                <p className="mb-4">{t('pat_aucunTrouve')}</p>
                <button
                  onClick={() => { setSearch(''); setFilterStatut('tous') }}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90"
                >
                  {t('pat_voirTousPatients')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-amber-500 text-3xl">inventory_2</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">{t('pat_modalTitre')}</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              {t('pat_modalDesc')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low">
                {t('pat_annuler')}
              </button>
              <button onClick={() => archiver(confirmId)} className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 shadow-sm">
                {t('pat_confirmer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
`;
fs.writeFileSync('D:/chu_kine/projet_frontend/src/app/patients/page.tsx', content, {encoding:'utf8'});
console.log('patients/page.tsx traduit avec succes !');
