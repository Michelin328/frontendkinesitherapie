const fs = require('fs');
const path = 'D:/chu_kine/projet_frontend/src/app/calendrier/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const mockBlock = `
const MOCK_PATIENTS: Record<number, Patient> = {
  1:   { id: 1,   nom: 'Rakoto', prenom: 'Jean', dateNaissance: '1985-03-12', sexe: 'M', diagnostic: 'Rupture LCA genou droit - post-operatoire', statut: 'actif', numeroDossier: 'P-2024-001', dateAdmission: '2024-04-12' },
  2:   { id: 2,   nom: 'Rabe', prenom: 'Marie', dateNaissance: '1992-07-23', sexe: 'F', diagnostic: 'Tendinite calcifiante epaule droite', statut: 'actif', numeroDossier: 'P-2024-002', dateAdmission: '2024-04-18' },
  3:   { id: 3,   nom: 'Andria', prenom: 'Paul', dateNaissance: '1978-11-08', sexe: 'M', diagnostic: 'Entorse cheville gauche grade 2', statut: 'actif', numeroDossier: 'P-2024-003', dateAdmission: '2024-04-22' },
  4:   { id: 4,   nom: 'Rasoa', prenom: 'Lala', dateNaissance: '1965-05-30', sexe: 'F', diagnostic: 'Arthrose lombaire chronique', statut: 'en_attente', numeroDossier: 'P-2024-004', dateAdmission: '2024-05-02' },
  5:   { id: 5,   nom: 'Rakotonirina', prenom: 'Zo', dateNaissance: '2001-09-15', sexe: 'F', diagnostic: 'Scoliose thoracique - suivi', statut: 'inactif', numeroDossier: 'P-2024-005', dateAdmission: '2024-03-10' },
  6:   { id: 6,   nom: 'Randriamihaingo', prenom: 'Tiana', dateNaissance: '1988-02-20', sexe: 'F', diagnostic: 'Paralysie faciale peripherique droite', statut: 'en_attente', numeroDossier: 'P-2024-006', dateAdmission: '2024-06-08' },
  101: { id: 101, nom: 'Jenkins', prenom: 'Sarah', dateNaissance: '1990-05-14', sexe: 'F', diagnostic: 'Suivi Post-operatoire Genou', statut: 'actif', numeroDossier: 'P-2024-101', dateAdmission: '2024-03-01' },
  102: { id: 102, nom: 'Chen', prenom: 'Michael', dateNaissance: '1983-11-22', sexe: 'M', diagnostic: 'Consultation Initial Dos', statut: 'en_attente', numeroDossier: 'P-2024-102', dateAdmission: '2024-06-09' },
  103: { id: 103, nom: 'Rodriguez', prenom: 'Elena', dateNaissance: '1981-03-08', sexe: 'F', diagnostic: 'Reeducation Epaule', statut: 'actif', numeroDossier: 'P-2024-103', dateAdmission: '2024-04-15' },
}

const todayD = new Date()
const dOff = (offset: number) => {
  const dt = new Date(todayD)
  dt.setDate(dt.getDate() + offset)
  return dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0')
}

const MOCK_RDV: RendezVous[] = [
  { id: 1, date: dOff(0), heureDebut: '08:00', heureFin: '09:00', motif: 'Douleur genou post-operatoire', type: 'consultation', statut: 'effectue', patientId: 101, patient: MOCK_PATIENTS[101] },
  { id: 2, date: dOff(0), heureDebut: '09:30', heureFin: '10:30', motif: 'Bilan initial dos', type: 'bilan', statut: 'effectue', patientId: 102, patient: MOCK_PATIENTS[102] },
  { id: 3, date: dOff(0), heureDebut: '14:00', heureFin: '15:00', motif: 'Reeducation epaule droite', type: 'soin', statut: 'planifie', patientId: 103, patient: MOCK_PATIENTS[103] },
  { id: 4, date: dOff(1), heureDebut: '08:30', heureFin: '09:30', motif: 'Rupture LCA suivi', type: 'exercice', statut: 'planifie', patientId: 1, patient: MOCK_PATIENTS[1] },
  { id: 5, date: dOff(1), heureDebut: '10:00', heureFin: '11:00', motif: 'Tendinite epaule', type: 'soin', statut: 'planifie', patientId: 2, patient: MOCK_PATIENTS[2] },
  { id: 6, date: dOff(2), heureDebut: '09:00', heureFin: '10:00', motif: 'Entorse cheville bilan', type: 'bilan', statut: 'planifie', patientId: 3, patient: MOCK_PATIENTS[3] },
  { id: 7, date: dOff(-1), heureDebut: '14:30', heureFin: '15:30', motif: 'Arthrose lombaire seance', type: 'soin', statut: 'effectue', patientId: 4, patient: MOCK_PATIENTS[4] },
  { id: 8, date: dOff(-2), heureDebut: '08:00', heureFin: '09:00', motif: 'Scoliose controle', type: 'consultation', statut: 'effectue', patientId: 5, patient: MOCK_PATIENTS[5] },
  { id: 9, date: dOff(3), heureDebut: '11:00', heureFin: '12:00', motif: 'Paralysie faciale bilan', type: 'bilan', statut: 'planifie', patientId: 6, patient: MOCK_PATIENTS[6] },
  { id: 10, date: dOff(-3), heureDebut: '09:00', heureFin: '10:00', motif: 'Exercices renforcement genou', type: 'exercice', statut: 'effectue', patientId: 101, patient: MOCK_PATIENTS[101] },
]
`;

// Insert mock block after interfaces
content = content.replace(
  "const STATUT_COLOR: Record<string, string> = {",
  mockBlock + "\nconst STATUT_COLOR: Record<string, string> = {"
);

// Replace fetch in useEffect
content = content.replace(
  `  useEffect(() => {
    fetch(API + '/rendezvous')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRdvs(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])`,
  `  useEffect(() => {
    setRdvs(MOCK_RDV)
    setLoading(false)
  }, [])`
);

// Replace selectRdv fetch with mock lookup
content = content.replace(
  `  async function selectRdv(rdv: RendezVous) {
    setSelectedRdv(rdv)
    setDrawerOpen(true)
    setPatientLoading(true)
    try {
      const res = await fetch(API + '/patients/' + rdv.patientId)
      const data = await res.json()
      setSelectedPatient(data)
    } catch {
      setSelectedPatient(rdv.patient || null)
    } finally {
      setPatientLoading(false)
    }
  }`,
  `  function selectRdv(rdv: RendezVous) {
    setSelectedRdv(rdv)
    setDrawerOpen(true)
    setPatientLoading(true)
    setTimeout(() => {
      setSelectedPatient(MOCK_PATIENTS[rdv.patientId] || rdv.patient || null)
      setPatientLoading(false)
    }, 200)
  }`
);

fs.writeFileSync(path, content, 'utf8');
console.log('calendrier/page.tsx mis a jour avec mock data !');
