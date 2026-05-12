import sql from '@/lib/db';

// ─── GET : tous les ordres de fabrication ───────────────────
export async function GET() {
  try {
    const rows = await sql`
      SELECT
        of.id,
        of.commande_id   AS commande_ref,
        of.produit_id,
        of.quantite,
        of.statut,
        of.date_debut,
        of.date_fin,
        of.notes,
        of.created_at,
        p.nom            AS produit_nom,
        p.unite          AS produit_unite
      FROM ordres_fabrication of
      JOIN produits p ON p.id = of.produit_id
      ORDER BY of.created_at DESC
    `;
    return Response.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST : créer un ordre de fabrication manuellement ──────
export async function POST(req) {
  try {
    const { produit_id, quantite, commande_id } = await req.json();

    if (!produit_id || !quantite) {
      return Response.json({ error: 'produit_id et quantite sont requis' }, { status: 400 });
    }

    // Vérifier les matières premières disponibles
    const composition = await sql`
      SELECT pm.matiere_id, pm.quantite_necessaire, mp.titre, mp.stock_actuel
      FROM produit_matieres pm
      JOIN matieres_premieres mp ON mp.id = pm.matiere_id
      WHERE pm.produit_id = ${produit_id}
    `;

    for (const item of composition) {
      const besoin = item.quantite_necessaire * quantite;
      if (Number(item.stock_actuel) < besoin) {
        return Response.json({
          error: `Stock insuffisant pour "${item.titre}" : ${item.stock_actuel} disponible, ${besoin} nécessaire`
        }, { status: 400 });
      }
    }

    // Créer l'ordre
    const [ordre] = await sql`
      INSERT INTO ordres_fabrication (produit_id, commande_id, quantite, statut)
      VALUES (${produit_id}, ${commande_id || null}, ${quantite}, 'planifie')
      RETURNING *
    `;

    return Response.json(ordre, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}