import { NextResponse } from 'next/server';
import { getDemandesKine } from '@/lib/prescriptionApi';

export async function GET() {
  try {
    const demandes = await getDemandesKine();
    return NextResponse.json(demandes);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Impossible de récupérer les demandes' }, { status: 500 });
  }
}
