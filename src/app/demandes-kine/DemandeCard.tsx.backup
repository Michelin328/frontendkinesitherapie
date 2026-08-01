'use client'

import { useState } from 'react'
import { planifierRendezVous } from './actions'

const TYPES = ['consultation', 'soin', 'bilan', 'exercice']

export default function DemandeCard({ demande }: { demande: any }) {
  const premiereDemc = Array.isArray(demande.demandes)
    ? demande.demandes[0]
    : null
  const typesKine = Array.isArray(demande.demandes)
    ? demande.demandes.map((d: any) => d.autreKine || d.typeKine).join(', ')
    : ''

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  )

  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [heureDebut, setHeureDebut] = useState('09:00')
  const [heureFin, setHeureFin] = useState('10:00')
  const [type, setType] = useState('soin')
  const [motif, setMotif] = useState(
    demande.diagnostic || demande.renseignements || typesKine || '',
  )

  async function confirmer() {
    setBusy(true)
    setResult(null)
    const res = await planifierRendezVous({
      prescriptionId: demande.id,
      demandeId: premiereDemc?.id ?? demande.id,
      patientId: demande.patientId,
      diagnostic: demande.diagnostic,
      renseignements: demande.renseignements,
      typeKine: premiereDemc?.typeKine,
      date,
      heureDebut,
      heureFin,
      type,
      motif,
    })
    setResult(res)
    setBusy(false)
    if (res.ok) setOpen(false)
  }

  return (
    <div
      style={{
        border: '1px solid #ccc',
        borderRadius: 8,
        padding: '1rem',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div>
          <strong>Patient :</strong> {demande.patientId}
          {'  '}| <strong>Type(s) :</strong> {typesKine || '—'}
          {'  '}| <strong>Urgence :</strong> {demande.urgence}
          <br />
          <span style={{ color: '#555' }}>
            {demande.diagnostic}
            {demande.renseignements ? ` — ${demande.renseignements}` : ''}
          </span>
        </div>
        {!open && (
          <button
            onClick={() => {
              setOpen(true)
              setResult(null)
            }}
            style={{
              padding: '0.5rem 1rem',
              background: '#0d9488',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Planifier RDV
          </button>
        )}
      </div>

      {open && (
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'flex-end',
          }}
        >
          <label>
            Date
            <br />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            Début
            <br />
            <input
              type="time"
              value={heureDebut}
              onChange={(e) => setHeureDebut(e.target.value)}
            />
          </label>
          <label>
            Fin
            <br />
            <input
              type="time"
              value={heureFin}
              onChange={(e) => setHeureFin(e.target.value)}
            />
          </label>
          <label>
            Type
            <br />
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </select>
          </label>
          <label style={{ flex: 1, minWidth: 180 }}>
            Motif
            <br />
            <input
              type="text"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              style={{ width: '100%' }}
            />
          </label>
          <button
            onClick={confirmer}
            disabled={busy}
            style={{
              padding: '0.5rem 1rem',
              background: busy ? '#94a3b8' : '#0d9488',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            {busy ? 'Planification…' : 'Confirmer'}
          </button>
          <button
            onClick={() => setOpen(false)}
            disabled={busy}
            style={{
              padding: '0.5rem 1rem',
              background: '#e2e8f0',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
        </div>
      )}

      {result && (
        <p style={{ color: result.ok ? 'green' : 'crimson', marginTop: '0.5rem' }}>
          {result.message}
        </p>
      )}
    </div>
  )
}
