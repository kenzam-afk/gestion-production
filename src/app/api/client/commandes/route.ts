import sql from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const utilisateur_id   = searchParams.get('utilisateur_id');

    if (!utilisateur_id) {
      return Response.json({ error: 'utilisateur_id requis' }, { status: 400 });
    }

    const [client] = await sql`
      SELECT id FROM clients WHERE utilisateur_id = ${parseInt(utilisateur_id)}
    `;

    if (!client) {
      return Response.json({ error: 'Client introuvable' }, { status: 404 });
    }

    const commandes = await sql`
      SELECT
        c.*,
        u.nom          AS livreur_nom,
        u.email        AS livreur_email,
        l.id           AS livraison_id,
        l.statut       AS livraison_statut,
        l.date_livraison AS date_livraison_reelle,
        l.adresse      AS adresse_livraison_livreur,
        bc.numero_bon  AS numero_bon_commande,
        bl.numero_bon  AS numero_bon_livraison
      FROM commandes c
      LEFT JOIN livraisons l   ON l.commande_id = c.id
      LEFT JOIN utilisateurs u ON u.id = l.livreur_id
      LEFT JOIN bons_commande bc ON bc.commande_id = c.id
      LEFT JOIN bons_livraison bl ON bl.commande_id = c.id
      WHERE c.client_id = ${client.id}
      ORDER BY c.created_at DESC
    `;

    const commandes_detaillees = await Promise.all(
      commandes.map(async (cmd: any) => {
        const lignes = await sql`
          SELECT
            cp.quantite, cp.prix_unitaire,
            (cp.quantite * cp.prix_unitaire) AS sous_total,
            p.nom AS produit_nom, p.description AS produit_description, p.unite
          FROM commande_produits cp
          JOIN produits p ON p.id = cp.produit_id
          WHERE cp.commande_id = ${cmd.id}
        `;
        return { ...cmd, lignes };
      })
    );

    return Response.json({
      client_id: client.id,
      commandes: commandes_detaillees,
      total_commandes: commandes_detaillees.length,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}