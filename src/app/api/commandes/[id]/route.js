import sql from '@/lib/db';

// ─── GET : détail d'une commande avec ses produits ──────────
export async function GET(req, { params }) {
  try {
    const { id } = params;

    const [commande] = await sql`
      SELECT
        c.*,
        cl.nom       AS client_nom,
        cl.prenom    AS client_prenom,
        cl.email     AS client_email,
        cl.telephone AS client_telephone,
        cl.adresse   AS client_adresse,
        cl.type_client,
        cl.titre     AS client_titre
      FROM commandes c
      LEFT JOIN clients cl ON cl.id = c.client_id
      WHERE c.id = ${id}
    `;

    if (!commande) {
      return Response.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    // Lignes de commande
    const lignes = await sql`
      SELECT
        cp.*,
        p.nom         AS produit_nom,
        p.description AS produit_description,
        p.unite
      FROM commande_produits cp
      JOIN produits p ON p.id = cp.produit_id
      WHERE cp.commande_id = ${id}
    `;

    // Bon de commande associé
    const [bon_commande] = await sql`
      SELECT * FROM bons_commande WHERE commande_id = ${id}
    `;

    // Bon de livraison associé
    const [bon_livraison] = await sql`
      SELECT bl.* FROM bons_livraison bl
      JOIN livraisons l ON l.id = bl.livraison_id
      WHERE bl.commande_id = ${id}
    `;

    return Response.json({
      ...commande,
      lignes,
      bon_commande:  bon_commande  || null,
      bon_livraison: bon_livraison || null,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ─── PUT : changer le statut d'une commande ─────────────────
export async function PUT(req, { params }) {
  try {
    const { id }    = params;
    const { statut } = await req.json();

    const statutsValides = ['en_attente', 'confirmee', 'en_fabrication', 'pret_livraison', 'livree', 'annulee'];
    if (!statutsValides.includes(statut)) {
      return Response.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const [commande] = await sql`
      UPDATE commandes
      SET statut = ${statut}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!commande) {
      return Response.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    // Si on passe en fabrication → créer un ordre de fabrication
    if (statut === 'en_fabrication') {
      const lignes = await sql`
        SELECT * FROM commande_produits WHERE commande_id = ${id}
      `;
      for (const ligne of lignes) {
        // Vérifier si un ordre existe déjà
        const existing = await sql`
          SELECT id FROM ordres_fabrication
          WHERE commande_id = ${id} AND produit_id = ${ligne.produit_id}
        `;
        if (existing.length === 0) {
          await sql`
            INSERT INTO ordres_fabrication (commande_id, produit_id, quantite, statut)
            VALUES (${id}, ${ligne.produit_id}, ${ligne.quantite}, 'planifie')
          `;
        }
      }
    }

    // Si annulée → remettre le stock
    if (statut === 'annulee') {
      const lignes = await sql`
        SELECT * FROM commande_produits WHERE commande_id = ${id}
      `;
      for (const ligne of lignes) {
        await sql`
          UPDATE produits
          SET stock_disponible = stock_disponible + ${ligne.quantite}
          WHERE id = ${ligne.produit_id}
        `;
        await sql`
          INSERT INTO mouvements_stock (produit_id, type, quantite, raison, reference_id)
          VALUES (${ligne.produit_id}, 'entree', ${ligne.quantite}, 'annulation_commande', ${id})
        `;
      }
    }

    return Response.json(commande);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ─── DELETE : supprimer une commande ────────────────────────
export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    await sql`DELETE FROM commandes WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}