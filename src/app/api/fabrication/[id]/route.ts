import sql from '@/lib/db';
import { NextRequest } from 'next/server';
import { onFabricationDemarree, onFabricationTerminee } from '@/lib/tracker';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { statut } = await req.json();

    const [ordre] = await sql`
      SELECT
        o.quantite,
        o.statut AS statut_actuel,
        p.nom AS produit_nom
      FROM ordres_fabrication o
      JOIN produits p ON p.id = o.produit_id
      WHERE o.id = ${id}
    `;

    const [updated] = await sql`
      UPDATE ordres_fabrication
      SET
        statut     = ${statut},
        date_debut = CASE WHEN ${statut} = 'en_cours' AND date_debut IS NULL THEN CURRENT_DATE ELSE date_debut END,
        date_fin   = CASE WHEN ${statut} = 'termine'  THEN CURRENT_DATE ELSE date_fin END
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated) return Response.json({ error: 'Ordre introuvable' }, { status: 404 });

    if (ordre) {
      if (statut === 'en_cours') await onFabricationDemarree(Number(id), ordre.produit_nom, ordre.quantite);
      if (statut === 'termine')  await onFabricationTerminee(Number(id), ordre.produit_nom, ordre.quantite);
    }

    return Response.json(updated);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}