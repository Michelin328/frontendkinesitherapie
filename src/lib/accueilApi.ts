// Client pour le backend Accueil (identité des patients)
// Base : ACCUEIL_API_URL (ex. https://acceuil-back-production.up.railway.app/accueil)
// ⚠️ URL non exposée au navigateur : à utiliser uniquement côté serveur.

export interface AccueilPatient {
  id: string
  nom: string
  prenom: string
  sexe: string // 'MALE' | 'FEMALE'
  dateNaissance: string
  cin?: string
  profession?: string
  adresse?: string
  telephone?: string
  contactUrgence?: string
  chuId?: string
}

export async function getAccueilPatient(id: string): Promise<AccueilPatient> {
  // Le service Accueil exige un Bearer JWT : on l'ajoute s'il est configuré.
  const token = process.env.ACCUEIL_API_TOKEN || process.env.PRESCRIPTION_API_TOKEN
  const res = await fetch(`${process.env.ACCUEIL_API_URL}/patients/${id}`, {
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(
        `Accueil : 401 — token JWT manquant/invalide (renseigner ACCUEIL_API_TOKEN)`,
      )
    }
    throw new Error(
      `Patient "${id}" introuvable côté Accueil (HTTP ${res.status})`,
    )
  }
  return res.json()
}
