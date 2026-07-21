// Client API pour le backend Kinésithérapie (NestJS)
// Base : NEXT_PUBLIC_API_URL (ex. http://localhost:3700/api)

import type { Patient, PaginatedResponse, Rendezvous } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3700/api'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Erreur API ${res.status} sur ${path}`)
  }
  return res.json() as Promise<T>
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Erreur API ${res.status} sur POST ${path}`)
  }
  return res.json() as Promise<T>
}

// Le backend renvoie un tableau simple ; on filtre et pagine côté client
// pour respecter le contrat PaginatedResponse attendu par les hooks.
export async function getPatients(
  page = 1,
  limit = 20,
  search?: string,
): Promise<PaginatedResponse<Patient>> {
  const all = await apiFetch<Patient[]>('/patients')

  const s = search?.trim().toLowerCase()
  const filtered = s
    ? all.filter((p) =>
        `${p.prenom} ${p.nom}`.toLowerCase().includes(s) ||
        p.numeroDossier?.toLowerCase().includes(s) ||
        p.diagnostic?.toLowerCase().includes(s),
      )
    : all

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const start = (page - 1) * limit
  const data = filtered.slice(start, start + limit)

  return { data, total, page, limit, totalPages }
}

export async function getPatientById(id: number): Promise<Patient> {
  return apiFetch<Patient>(`/patients/${id}`)
}

// ---- Création / recherche de patients ----

export async function getAllPatients(): Promise<Patient[]> {
  return apiFetch<Patient[]>('/patients')
}

// Recherche un patient local par son numéro de dossier (= patientId Accueil)
export async function findPatientByNumeroDossier(
  numeroDossier: string,
): Promise<Patient | null> {
  const all = await getAllPatients()
  return all.find((p) => p.numeroDossier === numeroDossier) ?? null
}

// Payload de création : suit le format du backend (peut différer du modèle
// frontend @/types), d'où un typage souple.
export async function createPatient(
  data: Record<string, unknown>,
): Promise<Patient> {
  return apiPost<Patient>('/patients', data)
}

// ---- Rendez-vous ----

export async function getRendezVous(): Promise<Rendezvous[]> {
  return apiFetch<Rendezvous[]>('/rendezvous')
}

export async function createRendezVous(
  data: Record<string, unknown>,
): Promise<Rendezvous> {
  return apiPost<Rendezvous>('/rendezvous', data)
}
