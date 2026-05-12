import sql from '@/lib/db';

// ─── PUT /api/fabrication/[id] ───────────────────────────────
export async function PUT(req, { params }) {
  try {
    const { id }     = params;
    const { statut } = await req.json();

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
    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}