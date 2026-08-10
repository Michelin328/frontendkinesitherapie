import { NextResponse } from 'next/server';
import { getDemandesKine } from '@/lib/prescriptionApi';
import { getAccueilPatient } from '@/lib/accueilApi';
import { getAuthInfo } from '@/lib/auth-server';

export async function GET() {
  try {
    const { chuId, serviceId } = await getAuthInfo();
    if (!chuId || !serviceId) {
      return NextResponse.json(
        { error: 'Session invalide : chuId ou serviceId manquant.' },
        { status: 401 },
      );
    }

    const demandes = await getDemandesKine(chuId, serviceId);
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
