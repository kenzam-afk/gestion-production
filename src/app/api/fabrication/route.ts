import sql from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const rows = await sql`
      SELECT
        ord.*,
        p.nom        AS produit_nom,
        p.id         AS produit_id,
        p.unite      AS produit_unite,
        c.id         AS commande_ref,
        c.statut     AS commande_statut
      FROM ordres_fabrication ord
      JOIN produits  p ON p.id = ord.produit_id
      LEFT JOIN commandes c ON c.id = ord.commande_id
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
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST — Créer un ordre de fabrication préventif (sans commande)
export async function POST(req: NextRequest) {
  try {
    const { produit_id, quantite, notes } = await req.json();

    if (!produit_id || !quantite) {
      return Response.json({ error: 'produit_id et quantite sont requis' }, { status: 400 });
    }

    // Vérifier que le produit existe
    const [produit] = await sql`SELECT id, nom FROM produits WHERE id = ${produit_id}`;
    if (!produit) return Response.json({ error: 'Produit introuvable' }, { status: 404 });

    // Créer l'ordre de fabrication préventif (commande_id = NULL)
    const [ordre] = await sql`
      INSERT INTO ordres_fabrication (produit_id, commande_id, quantite, statut)
      VALUES (${produit_id}, NULL, ${quantite}, 'planifie')
      RETURNING *
    `;

    // Créer une alerte info
    await sql`
      INSERT INTO alertes (type, niveau, titre, message, entite_type, entite_id)
      VALUES (
        'production', 'info',
        ${'Ordre de fabrication préventif — ' + produit.nom},
        ${'Quantité à produire : ' + quantite + ' unités (production préventive)'},
        'ordre_fabrication', ${ordre.id}
      )
    `;

    return Response.json({ success: true, ordre_id: ordre.id, produit_nom: produit.nom, quantite }, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}