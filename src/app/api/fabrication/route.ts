import sql from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`
      SELECT
        ord.*,
        p.nom        AS produit_nom,
        p.id         AS produit_id,
        c.id         AS commande_ref,
        c.statut     AS commande_statut
      FROM ordres_fabrication ord
      JOIN produits  p ON p.id = ord.produit_id
      JOIN commandes c ON c.id = ord.commande_id
      ORDER BY ord.created_at DESC
    `;

    const ordresAvecMatieres = await Promise.all(
      rows.map(async (ordre: any) => {
        const matieres = await sql`
          SELECT
            pm.quantite_necessaire,
            (pm.quantite_necessaire * ${ordre.quantite}) AS quantite_requise,
            mp.id       AS matiere_id,
            mp.titre,
            mp.unite,
            mp.stock_actuel,
            mp.stock_minimum,
            CASE
              WHEN mp.stock_actuel >= (pm.quantite_necessaire * ${ordre.quantite})
              THEN true ELSE false
            END AS stock_suffisant
          FROM produit_matieres pm
          JOIN matieres_premieres mp ON mp.id = pm.matiere_id
          WHERE pm.produit_id = ${ordre.produit_id}
        `;
        return { ...ordre, matieres };
      })
    );

    return Response.json(ordresAvecMatieres);
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}