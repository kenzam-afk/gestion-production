import sql from '@/lib/db';
import { onDemandeApproConfirmee, onDemandeApproExpediee } from '@/lib/tracker';

// ─── PUT /api/fournisseur/demande/[id] ────────────────────────
export async function PUT(req, { params }) {
  try {
    const { id }     = await params;
    const { statut } = await req.json();

    // Récupérer infos avant update
    const [demande] = await sql`
      SELECT
        da.matiere_id,
        da.quantite,
        mp.titre AS matiere_titre,
        f.nom    AS fournisseur_nom
      FROM demandes_appro da
      JOIN matieres_premieres mp ON mp.id = da.matiere_id
      JOIN fournisseurs        f  ON f.id  = da.fournisseur_id
      WHERE da.id = ${id}
    `;

    const [updated] = await sql`
      UPDATE demandes_appro
      SET statut = ${statut}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated) return Response.json({ error: 'Demande introuvable' }, { status: 404 });

    // Tracker selon le statut
    if (demande) {
      if (statut === 'confirmee') {
        await onDemandeApproConfirmee(Number(id), demande.matiere_titre, demande.fournisseur_nom);
      }
      if (statut === 'expediee') {
        await onDemandeApproExpediee(Number(id), demande.matiere_titre, demande.fournisseur_nom);

        // Alerte admin
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
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}