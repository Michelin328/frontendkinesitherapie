import { NextResponse } from 'next/server';
import { getDemandesKine } from '@/lib/prescriptionApi';
import { getAccueilPatient } from '@/lib/accueilApi';

export async function GET() {
  try {
    const demandes = await getDemandesKine();

    const demandesEnrichies = await Promise.all(
      demandes.map(async (d: any) => {
        try {
          const patient = await getAccueilPatient(d.patientId);
          return { ...d, patientNom: patient.nom, patientPrenom: patient.prenom };
        } catch {
          return { ...d, patientNom: null, patientPrenom: null };
        }
      }),
    );

    return NextResponse.json(demandesEnrichies);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Impossible de récupérer les demandes' }, { status: 500 });
  }
}
