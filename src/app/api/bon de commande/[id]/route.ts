import sql from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [bon] = await sql`
      SELECT
        bc.*,
        c.statut          AS commande_statut,
        c.total,
        c.created_at      AS commande_date,
        c.adresse_livraison,
        c.notes           AS commande_notes,
        CASE
          WHEN cl.type_client = 'entreprise' THEN cl.titre
          ELSE CONCAT(COALESCE(cl.prenom,''), ' ', COALESCE(cl.nom,''))
        END               AS client_nom,
        cl.email          AS client_email,
        cl.telephone      AS client_telephone,
        cl.adresse        AS client_adresse,
        cl.type_client,
        cl.nif,
        cl.nin
      FROM bons_commande bc
      JOIN commandes c  ON c.id  = bc.commande_id
      JOIN clients   cl ON cl.id = c.client_id
      WHERE bc.id = ${id}
    `;

    if (!bon) return Response.json({ error: 'Bon de commande introuvable' }, { status: 404 });

    const lignes = await sql`
      SELECT
        cp.quantite,
        cp.prix_unitaire,
        (cp.quantite * cp.prix_unitaire) AS sous_total,
        p.nom         AS produit_nom,
        p.description AS produit_description,
        p.unite
      FROM commande_produits cp
      JOIN produits p ON p.id = cp.produit_id
      WHERE cp.commande_id = ${bon.commande_id}
    `;

    return Response.json({ ...bon, lignes });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}