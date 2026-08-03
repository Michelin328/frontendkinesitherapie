export interface UtilisateurConnecte {
  prenom: string
  nom: string
  displayName: string
  initiales: string
}

export function getUtilisateurConnecte(): UtilisateurConnecte {
  const defaut: UtilisateurConnecte = {
    prenom: '',
    nom: '',
    displayName: 'Utilisateur',
    initiales: 'U',
  }
  if (typeof window === 'undefined') return defaut

  try {
    const token = localStorage.getItem('authToken')
    if (!token) return defaut
    const payload = token.split('.')[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const data = JSON.parse(decoded)

    const prenom = (data.firstname || '').trim()
    const nom = (data.name || '').trim()
    const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s

    const displayName = [capitalize(prenom), capitalize(nom)].filter(Boolean).join(' ') || 'Utilisateur'
    const initiales = ((prenom[0] || '') + (nom[0] || '')).toUpperCase() || 'U'

    return { prenom: capitalize(prenom), nom: capitalize(nom), displayName, initiales }
  } catch {
    return defaut
  }
}
