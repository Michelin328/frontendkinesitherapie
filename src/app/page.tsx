'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { useLanguage } from '@/context/LanguageContext'

const API = process.env.NEXT_PUBLIC_API_URL

interface Patient {
  id: number
  nom: string
  prenom: string
  numeroDossier?: string
}

interface RendezVous {
  id: number
  date: string
  heureDebut: string
  heureFin: string
  motif: string
  type: string
  statut: string
  patientId: number
  patient?: Patient
}

interface DemandeKine {
  id: string
  urgence: string
  createdAt: string
  patientId: string
}

function localDay(d = new Date()) {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  )
}

function estExterne(rdv: RendezVous) {
  return (rdv.patient?.numeroDossier || '').startsWith('CHU-')
}

export default function DashboardPage() {
  const { t } = useLanguage()

  const [rdvs, setRdvs] = useState<RendezVous[]>([])
  const [demandes, setDemandes] = useState<DemandeKine[]>([])

  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetch(`${API}/rendezvous`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: RendezVous[]) => setRdvs(Array.isArray(d) ? d : []))
      .catch(() => setRdvs([]))

    fetch('/api/demandes-kine', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: DemandeKine[]) => setDemandes(Array.isArray(d) ? d : []))
      .catch(() => setDemandes([]))
  }, [])

  const stats = useMemo(() => {
    const today = localDay()
    const rdvAujourdhui = rdvs.filter((r) => r.date === today)

    function urgenceDuRdv(rdv: RendezVous) {
      const numeroDossier = rdv.patient?.numeroDossier
      const demande = demandes.find((d) => d.patientId === numeroDossier)
      return demande?.urgence || 'NORMAL'
    }

    return {
      rdvAujourdhui: rdvAujourdhui.length,
      tresUrgent: rdvAujourdhui.filter((r) => urgenceDuRdv(r) === 'TRES_URGENT').length,
      urgent: rdvAujourdhui.filter((r) => urgenceDuRdv(r) === 'URGENT').length,
      normal: rdvAujourdhui.filter((r) => urgenceDuRdv(r) === 'NORMAL').length,
      interne: rdvAujourdhui.filter((r) => !estExterne(r)).length,
      externe: rdvAujourdhui.filter((r) => estExterne(r)).length,
      liste: rdvAujourdhui.sort((a, b) =>
        (a.heureDebut || '').localeCompare(b.heureDebut || ''),
      ),
    }
  }, [rdvs, demandes])

  return (
    <AppShell searchPlaceholder="Rechercher un patient, un dossier..." showSearch>
      {/* EN-TETE */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight">
            {t('dash_bonjour')}
          </h2>
          <p className="font-body-lg text-on-surface-variant mt-1">
            {t('dash_apercu')}
          </p>
        </div>

        {/* DATE DU JOUR + HORLOGE (carte coloree) */}
        <div className="text-right shrink-0 bg-sky-50 border border-sky-200 rounded-xl px-5 py-3">
          <p className="text-sm text-sky-700 font-medium capitalize">
            {now
              ? now.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : ' '}
          </p>
          <p className="text-2xl font-bold text-sky-700 font-manrope tabular-nums tracking-wide">
            {now
              ? now.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : ' '}
          </p>
        </div>
      </div>

      {/* CARTES STATISTIQUES AUTOMATIQUES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Patients (3 niveaux) */}
        <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-black">Répartitions de patients</p>
            <span className="text-lg font-extrabold text-black tabular-nums">
              {stats.tresUrgent + stats.urgent + stats.normal}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs font-semibold text-red-600">Très urgent</p>
            <span className="text-sm font-bold text-red-600 tabular-nums">{stats.tresUrgent}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs font-semibold text-orange-500">Urgent</p>
            <span className="text-sm font-bold text-orange-500 tabular-nums">{stats.urgent}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs font-semibold text-blue-600">Normal</p>
            <span className="text-sm font-bold text-blue-600 tabular-nums">{stats.normal}</span>
          </div>
        </div>

        {/* Consultation interne */}
        <div className="bg-teal-50 rounded-xl border border-teal-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-teal-700">
              Consultation interne
            </p>
            <span className="material-symbols-outlined text-teal-600">
              home_health
            </span>
          </div>
          <p className="text-4xl font-extrabold text-teal-700 mt-2 tabular-nums">
            {stats.interne}
          </p>
        </div>

        {/* Consultation externe */}
        <div className="bg-indigo-50 rounded-xl border border-indigo-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-indigo-700">
              Consultation externe
            </p>
            <span className="material-symbols-outlined text-indigo-600">
              e911_emergency
            </span>
          </div>
          <p className="text-4xl font-extrabold text-indigo-700 mt-2 tabular-nums">
            {stats.externe}
          </p>
        </div>
      </div>

      {/* RDV DU JOUR (données réelles) */}
      <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
          <div className="flex items-center gap-2">
            <h4 className="font-title-sm text-on-surface">{t('dash_rdvDuJour')}</h4>
            <span className="bg-primary text-white text-xs font-bold rounded-full px-2.5 py-0.5">
              {stats.rdvAujourdhui}
            </span>
          </div>
          <Link
            href="/calendrier"
            className="text-primary font-semibold text-sm hover:underline"
          >
            {t('dash_voirTout')}
          </Link>
        </div>
        {stats.liste.length === 0 ? (
          <div className="px-6 py-8 text-center text-on-surface-variant text-sm">
            Aucun rendez-vous aujourd&apos;hui.
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {stats.liste.map((rdv) => (
              <Link
                key={rdv.id}
                href={'/patients/' + rdv.patientId + '?from=dashboard'}
                className="px-6 py-5 flex items-center gap-4 hover:bg-surface-container-low transition-colors"
              >
                <div className="text-center min-w-[60px]">
                  <p className="text-xs font-bold tracking-widest uppercase text-primary">
                    {(rdv.heureDebut || '').slice(0, 5)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm bg-teal-100 text-teal-700">
                  {(rdv.patient?.prenom?.[0] || '') +
                    (rdv.patient?.nom?.[0] || '')}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-on-surface">
                    {rdv.patient
                      ? `${rdv.patient.prenom} ${rdv.patient.nom}`
                      : `Patient #${rdv.patientId}`}
                  </p>
                  <p className="text-sm text-on-surface-variant">{rdv.motif}</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-lg flex-shrink-0">
                  chevron_right
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
