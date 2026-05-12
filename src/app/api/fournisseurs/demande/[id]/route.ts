import sql from '@/lib/db';

// ─── PUT /api/fournisseur/demandes/[id] ──────────────────────
// Changer statut : confirmee | expediee
export async function PUT(req, { params }) {
  try {
    const { id }     = params;
    const { statut } = await req.json();

    const [updated] = await sql`
      UPDATE demandes_appro
      SET statut = ${statut}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    // Traçabilité
    await sql`
      INSERT INTO tracabilite (entite_type, entite_id, action, nouvel_etat, details)
      VALUES ('demande_appro', ${id}, 'changement_statut', ${statut}, ${'Fournisseur: ' + statut})
    `;

    // Alerte admin si expédiée
    if (statut === 'expediee') {
      const [da] = await sql`
        SELECT da.*, mp.titre FROM demandes_appro da
        JOIN matieres_premieres mp ON mp.id = da.matiere_id
        WHERE da.id = ${id}
      `;
      await sql`
        INSERT INTO alertes (type, niveau, titre, message, entite_type, entite_id)
        VALUES ('appro', 'info',
          ${'Livraison en route — ' + da.titre},
          ${'Quantité expédiée : ' + da.quantite + ' — Réception attendue prochainement'},
          'demande_appro', ${id})
      `;
    }

    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}