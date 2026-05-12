import sql from '@/lib/db';

// ─── GET : détail livraison + bon ────────────────────────────
export async function GET(req, { params }) {
  try {
    const { id } = params;

    const [livraison] = await sql`
      SELECT
        l.*,
        c.total           AS commande_total,
        c.adresse_livraison,
        CASE
          WHEN cl.type_client = 'entreprise' THEN cl.titre
          ELSE CONCAT(cl.prenom, ' ', cl.nom)
        END               AS client_nom,
        cl.telephone      AS client_telephone,
        cl.email          AS client_email,
        cl.adresse        AS client_adresse,
        u.nom             AS livreur_nom,
        bl.numero_bon     AS numero_bon_livraison,
        bl.id             AS bon_livraison_id,
        bl.date_livraison_prevue
      FROM livraisons l
      JOIN commandes   c  ON c.id  = l.commande_id
      JOIN clients     cl ON cl.id = c.client_id
      LEFT JOIN utilisateurs   u  ON u.id  = l.livreur_id
      LEFT JOIN bons_livraison bl ON bl.livraison_id = l.id
      WHERE l.id = ${id}
    `;

    if (!livraison) {
      return Response.json({ error: 'Livraison introuvable' }, { status: 404 });
    }

    // Lignes produits de la commande
    const lignes = await sql`
      SELECT
        cp.quantite, cp.prix_unitaire,
        p.nom AS produit_nom, p.unite
      FROM commande_produits cp
      JOIN produits p ON p.id = cp.produit_id
      WHERE cp.commande_id = ${livraison.commande_id}
    `;

    return Response.json({ ...livraison, lignes });

  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// ─── PUT : changer statut livraison ─────────────────────────
export async function PUT(req, { params }) {
  try {
    const { id }     = params;
    const { statut } = await req.json();

    const [livraison] = await sql`
      UPDATE livraisons
      SET
        statut         = ${statut},
        date_livraison = CASE WHEN ${statut} = 'livree' THEN CURRENT_DATE ELSE date_livraison END
      WHERE id = ${id}
      RETURNING *
    `;

    if (!livraison) {
      return Response.json({ error: 'Livraison introuvable' }, { status: 404 });
    }

    // Si livrée → mettre la commande en "livree"
    if (statut === 'livree') {
      await sql`
        UPDATE commandes
        SET statut = 'livree', updated_at = NOW()
        WHERE id = ${livraison.commande_id}
      `;
    }

    return Response.json(livraison);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// ─── DELETE ──────────────────────────────────────────────────
export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    await sql`DELETE FROM livraisons WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}