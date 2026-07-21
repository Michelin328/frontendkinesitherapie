// ============================================================
// Types partagés — CHU Andrainjato Kinésithérapie
// ============================================================

export interface Patient {
  id: number
  numeroDossier: string
  nom: string
  prenom: string
  dateNaissance: string
  sexe: 'M' | 'F'
  telephone: string
  email: string
  adresse: string
  groupeSanguin?: string
  antecedentsMedicaux?: string
  diagnostic: string
  statut: PatientStatut
  progression: number
  dateAdmission: string
  dateDerniereVisite?: string
  kinesitherapeuteId?: number
  kinesitherapeute?: Kinesitherapeute
}

export type PatientStatut = 'actif' | 'inactif' | 'archive' | 'en_attente'

export interface Kinesitherapeute {
  id: number
  nom: string
  prenom: string
  specialite: string
  telephone: string
  email: string
  numeroLicence: string
  statut: 'disponible' | 'occupe' | 'absent'
  patients?: Patient[]
}

export interface Rendezvous {
  id: number
  date: string
  heureDebut: string
  heureFin: string
  type: RendezvousType
  motif: string
  statut: RendezvousStatut
  notes?: string
  patientId: number
  patient?: Patient
  kinesitherapeuteId: number
  kinesitherapeute?: Kinesitherapeute
}

export type RendezvousType =
  | 'consultation_initiale'
  | 'suivi'
  | 'post_op'
  | 'massage_sportif'
  | 'reeducation'
  | 'bilan'

export type RendezvousStatut = 'confirme' | 'en_attente' | 'annule' | 'termine'

export interface Archive {
  id: number
  dateArchivage: string
  motif: string
  resumeMedical: string
  exercicesRealises: string
  progressionFinale: number
  patientId: number
  patient?: Patient
}

export interface Exercice {
  id: number
  nom: string
  description: string
  series: number
  repetitions: number
  dureeMinutes: number
  difficulte: 'facile' | 'moyen' | 'difficile'
  patientId: number
}

export interface DashboardStats {
  totalPatients: number
  patientsActifs: number
  rendezvousAujourdhui: number
  rendezvousSemaine: number
  progressionMoyenne: number
  archivesMois: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
