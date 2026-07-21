'use server'

import { revalidatePath } from 'next/cache'
import { getAccueilPatient } from '@/lib/accueilApi'
import {
  findPatientByNumeroDossier,
  createPatient,
  createRendezVous,
} from '@/lib/api'
import { updateDemandeStatut } from '@/lib/prescriptionApi'

export interface PlanifierInput {
  prescriptionId: string
  demandeId: string
  patientId: string // ex. CHU-2026-00001 (référence Accueil)
  diagnostic?: string
  renseignements?: string
  typeKine?: string
  date: string
  heureDebut: string
  heureFin: string
  type: string
  motif: string
}

export interface PlanifierResult {
  ok: boolean
  message: string
  patientLocalId?: number
  rendezVousId?: number
}

// Orchestration : prescription kiné → patient local → rendez-vous local.
export async function planifierRendezVous(
  input: PlanifierInput,
): Promise<PlanifierResult> {
  try {
    // 1. Réutiliser le patient local s'il existe déjà (par numéro de dossier),
    //    sinon résoudre son identité via le service Accueil et le créer.
    let patient = await findPatientByNumeroDossier(input.patientId)

    if (!patient) {
      const acc = await getAccueilPatient(input.patientId)
      patient = await createPatient({
        numeroDossier: input.patientId,
        nom: acc.nom,
        prenom: acc.prenom || 'Non renseigne',
        sexe: acc.sexe === 'FEMALE' ? 'F' : 'M',
        dateNaissance: acc.dateNaissance,
        adresse: acc.adresse,
        telephone: acc.telephone,
        diagnostic: input.diagnostic || input.typeKine || '',
        antecedents: input.renseignements || '',
        statut: 'actif',
        dateAdmission: new Date().toISOString().slice(0, 10),
      })
    }

    // 2. Créer le rendez-vous local rattaché au patient.
    const rdv = await createRendezVous({
      date: input.date,
      heureDebut: input.heureDebut,
      heureFin: input.heureFin,
      type: input.type,
      motif: input.motif || input.typeKine || 'Séance de kinésithérapie',
      statut: 'planifie',
      patientId: patient.id,
    })

    // 3. Best-effort : informer le service prescription que la demande est planifiée.
    try {
      await updateDemandeStatut(
        input.prescriptionId,
        input.demandeId,
        'PLANIFIEE',
      )
    } catch {
      // non bloquant : le RDV local est déjà créé
    }

    // Rafraîchir les pages concernées.
    revalidatePath('/demandes-kine')
    revalidatePath('/patients')
    revalidatePath('/calendrier')

    return {
      ok: true,
      message: `Rendez-vous planifié pour ${patient.prenom} ${patient.nom}.`,
      patientLocalId: patient.id,
      rendezVousId: rdv.id,
    }
  } catch (e: any) {
    return {
      ok: false,
      message: e?.message ?? 'Erreur lors de la planification du rendez-vous.',
    }
  }
}
