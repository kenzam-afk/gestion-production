import sql from '@/lib/db';

// ─── GET /api/fournisseur/demande ────────────────────────────
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const utilisateur_id   = searchParams.get('utilisateur_id');

    if (!utilisateur_id) {
      return Response.json({ error: 'utilisateur_id requis' }, { status: 400 });
    }

    // Trouver le fournisseur lié à cet utilisateur
    const [fournisseur] = await sql`
      SELECT id FROM fournisseurs WHERE utilisateur_id = ${utilisateur_id}
    `;

    if (!fournisseur) {
      return Response.json({ error: 'Fournisseur introuvable pour cet utilisateur' }, { status: 404 });
    }

    const demandes = await sql`
      SELECT
        da.*,
        mp.titre AS matiere_titre,
        mp.unite AS matiere_unite,
        f.nom    AS fournisseur_nom
      FROM demandes_appro da
      JOIN matieres_premieres mp ON mp.id = da.matiere_id
      JOIN fournisseurs        f  ON f.id  = da.fournisseur_id
      WHERE da.fournisseur_id = ${fournisseur.id}
      ORDER BY da.created_at DESC
    `;

    return Response.json(demandes);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ─── PUT /api/fournisseur/demande ────────────────────────────
// Non utilisé ici, le PUT est sur [id]/route.ts
export async function PUT(req) {
  return Response.json({ error: 'Utilisez /api/fournisseur/demande/[id]' }, { status: 400 });
}