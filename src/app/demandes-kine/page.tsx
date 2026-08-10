'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import DemandeCard from './DemandeCard'

export default function DemandesKinePage() {
  const [demandes, setDemandes] = useState<any[]>([])
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
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
  }, [])

  return (
    <AppShell>
      <div style={{ padding: '2rem' }}>
        <h1>Demandes de kinésithérapie</h1>
        <p style={{ color: '#555' }}>
          Planifiez un rendez-vous pour chaque demande reçue : le patient et le rendez-vous seront créés automatiquement.
        </p>
        {chargement ? (
          <p>Chargement...</p>
        ) : erreur ? (
          <p style={{ color: 'crimson' }}>
            Impossible de charger les demandes : {erreur}
          </p>
        ) : demandes.length === 0 ? (
          <p>Aucune demande pour le moment.</p>
        ) : (
          <div style={{ marginTop: '1rem' }}>
            {demandes.map((demande: any) => (
              <DemandeCard key={demande.id} demande={demande} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
