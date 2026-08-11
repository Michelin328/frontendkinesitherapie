// Correspondance entre le code "serviceIdSource" renvoyé par le microservice
// Prescription et le libellé lisible à afficher dans l'interface.
const LIBELLES: Record<string, string> = {
  accueil: 'Accueil',
  prescription: 'Prescription',
  laboratoire: 'Laboratoire',
  eeg: 'EEG',
  endoscopie: 'Endoscopie',
  stomato: 'Stomatologie',
  bloc: 'Anesthésie-Réanimation',
  consultation_externe: 'Consultation externe',
  imagerie: 'Imagerie',
  anapath: 'Anatomopathologie',
  banque_de_sang: 'Banque de sang',
  kinesitherapie: 'Kinésithérapie',
  pharmacie: 'Pharmacie',
  dialyse: 'Dialyse',
  polysomnographie: 'Polysomnographie',
  ecg: 'ECG',
}

export function libelleService(code?: string | null): string {
  if (!code) return 'Non renseigné'
  return LIBELLES[code.toLowerCase()] || code
}
