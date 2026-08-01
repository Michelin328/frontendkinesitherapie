'use client'

import { useState, useMemo } from 'react'
import AppShell from '@/components/layout/AppShell'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

const MOCK_ARCHIVES = [
  { id: 7, numeroDossier: 'P-2024-007', nom: 'Rakotondrabe', prenom: 'Hery', dateNaissance: '1970-12-01', sexe: 'M', diagnostic: 'Hernie discale L4-L5', statut: 'archive', dateAdmission: '2024-01-15', dateDerniereVisite: '2024-03-20', antecedents: 'Douleurs lombaires depuis 2020' },
  { id: 8, numeroDossier: 'P-2024-008', nom: 'Andriantsoa', prenom: 'Noro', dateNaissance: '1995-04-18', sexe: 'F', diagnostic: 'Tendinopathie achilleenne', statut: 'archive', dateAdmission: '2024-02-10', dateDerniereVisite: '2024-04-05', antecedents: 'Sport intensif, coureur marathon' },
]

interface Patient {
  id: number; nom: string; prenom: string; diagnostic: string
  numeroDossier: string; dateNaissance: string; sexe: string
  statut: string; dateAdmission: string; dateDerniereVisite: string; antecedents: string
}

export default function ArchivesPage() {
  const { t } = useLanguage()
  const [archives, setArchives]       = useState<Patient[]>(MOCK_ARCHIVES)
  const [loading, setLoading]         = useState(false)
  const [search, setSearch]           = useState('')
  const [confirmId, setConfirmId]     = useState<number | null>(null)
  const [reactivating, setReactivating] = useState<number | null>(null)

  async function reactiver(id: number) {
    setReactivating(id)
    setArchives(prev => prev.filter(p => p.id !== id))
    setReactivating(null)
    setConfirmId(null)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return archives
    const s = search.toLowerCase()
    return archives.filter(p =>
      p.nom?.toLowerCase().includes(s) ||
      p.prenom?.toLowerCase().includes(s) ||
      p.diagnostic?.toLowerCase().includes(s) ||
      p.numeroDossier?.toLowerCase().includes(s)
    )
  }, [search, archives])

  return (
    <AppShell searchPlaceholder={t('arc_rechercherPlaceholder')} showSearch={false}>

      {/* TITRE + RECHERCHE */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-on-surface font-manrope">{t('arc_titre')}</h2>
        <p className="text-sm text-on-surface-variant mt-1 mb-4">{archives.length} {t('arc_dossiersArchives')}</p>
        <div className="flex items-center gap-3 bg-surface border border-outline-variant px-4 py-2 rounded-lg max-w-md">
          <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
          <input type="text" placeholder={t('arc_rechercherPlaceholder')}
            value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm w-full text-on-surface placeholder:text-on-surface-variant" />
          {search && (
            <button onClick={() => setSearch('')} className="text-on-surface-variant hover:text-red-500 transition-colors">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm">{t('arc_chargement')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filtered.map((p) => (
              <div key={p.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row gap-4">

                  <div className="flex-shrink-0 sm:w-56">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center">
                        <span className="text-on-surface-variant font-bold text-sm">{p.prenom?.[0]}{p.nom?.[0]}</span>
                      </div>
                      <div>
                        <Link href={'/patients/' + p.id + '?from=archives'}
                          className="font-semibold text-on-surface text-sm hover:text-primary transition-colors">
                          {p.prenom} {p.nom}
                        </Link>
                        <p className="text-[10px] text-on-surface-variant">{p.numeroDossier}</p>
                      </div>
                    </div>
                    <p className="text-xs text-on-surface-variant">{p.diagnostic || '-'}</p>
                  </div>

                  <div className="flex-1 border-l border-outline-variant pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-xs text-on-surface-variant uppercase tracking-wider">
                        {t('arc_archiveAdmission')} {p.dateAdmission || '-'}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed mb-2">
                      {p.antecedents || t('arc_aucunAntecedent')}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] bg-surface-container-low text-on-surface-variant px-2 py-1 rounded uppercase tracking-wider">
                        {p.sexe === 'M' ? t('cal_homme') : p.sexe === 'F' ? t('cal_femme') : '-'}
                      </span>
                      <span className="text-[10px] bg-surface-container-low text-on-surface-variant px-2 py-1 rounded uppercase tracking-wider">
                        {p.dateNaissance || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button onClick={() => setConfirmId(p.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200">
                      <span className="material-symbols-outlined text-sm">person_check</span>
                      {t('arc_btnReactiver')}
                    </button>
                    <Link href={'/patients/' + p.id + '?from=archives'}
                      className="p-2 rounded-lg hover:bg-surface-container-low transition-colors" title={t('arc_voirProfil')}>
                      <span className="material-symbols-outlined text-on-surface-variant text-lg">visibility</span>
                    </Link>
                  </div>

                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
              <p>{search ? t('arc_aucunResultat') : t('arc_aucunArchive')}</p>
              {search && (
                <button onClick={() => setSearch('')}
                  className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90">
                  {t('arc_voirTousArchives')}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {confirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-emerald-500 text-3xl">person_check</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">{t('arc_modalTitre')}</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              {t('arc_modalDescAvant')} <strong>Actif</strong> {t('arc_modalDescApres')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low">
                {t('arc_annuler')}
              </button>
              <button onClick={() => reactiver(confirmId)}
                disabled={reactivating === confirmId}
                className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 shadow-sm disabled:opacity-60">
                {reactivating === confirmId ? t('arc_enCours') : t('arc_confirmer')}
              </button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  )
}