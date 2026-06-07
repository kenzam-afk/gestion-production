import sql from '@/lib/db';
import { NextRequest } from 'next/server';
import { onDemandeApproConfirmee, onDemandeApproExpediee } from '@/lib/tracker';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id }     = await params;
    const { statut } = await req.json();

    const [demande] = await sql`
      SELECT da.matiere_id, da.quantite,
        mp.titre AS matiere_titre, f.nom AS fournisseur_nom
      FROM demandes_appro da
      JOIN matieres_premieres mp ON mp.id = da.matiere_id
      JOIN fournisseurs        f  ON f.id  = da.fournisseur_id
      WHERE da.id = ${id}
    `;

    const [updated] = await sql`
      UPDATE demandes_appro SET statut = ${statut}, updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `;

    if (!updated) return Response.json({ error: 'Demande introuvable' }, { status: 404 });

    if (demande) {
      if (statut === 'confirmee') {
        await onDemandeApproConfirmee(Number(id), demande.matiere_titre, demande.fournisseur_nom);
      }
      if (statut === 'expediee') {
        await onDemandeApproExpediee(Number(id), demande.matiere_titre, demande.fournisseur_nom);
        await sql`
          INSERT INTO alertes (type, niveau, titre, message, entite_type, entite_id)
          VALUES ('appro', 'info',
            ${`Livraison en route — ${demande.matiere_titre}`},
            ${`Quantité expédiée : ${demande.quantite} — Réception attendue prochainement`},
            'demande_appro', ${id})
        `;
      }
    }

    return Response.json(updated);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}