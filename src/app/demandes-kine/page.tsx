import { getDemandesKine } from '../../lib/prescriptionApi';
import DemandeCard from './DemandeCard';

export const dynamic = 'force-dynamic';

export default async function DemandesKinePage() {
  let demandes: any[] = [];
  let erreur: string | null = null;

  try {
    demandes = await getDemandesKine();
  } catch (e: any) {
    erreur = e?.message ?? 'Erreur inconnue';
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Demandes de kinésithérapie</h1>
      <p style={{ color: '#555' }}>
        Planifiez un rendez-vous pour chaque demande reçue : le patient et le
        rendez-vous seront créés automatiquement.
      </p>

      {erreur ? (
        <p style={{ color: 'crimson' }}>
          Impossible de charger les demandes : {erreur}
        </p>
      ) : demandes.length === 0 ? (
        <p>Aucune demande pour le moment.</p>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          {demandes.map((demande: any) => (
            <DemandeCard key={demande.id} demande={demande} />
          ))}
        </div>
      )}
    </div>
  );
}
