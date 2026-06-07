import sql from '@/lib/db';
import { onLivraisonTerminee, onStatutCommande } from '@/lib/tracker';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
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
    if (!livraison) return Response.json({ error: 'Livraison introuvable' }, { status: 404 });

    const lignes = await sql`
      SELECT cp.quantite, cp.prix_unitaire, p.nom AS produit_nom, p.unite
      FROM commande_produits cp
      JOIN produits p ON p.id = cp.produit_id
      WHERE cp.commande_id = ${livraison.commande_id}
    `;
    return Response.json({ ...livraison, lignes });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { statut, livreur_id, date_livraison, raison_echec } = body;

    console.log('PUT livraison', id, '→ body:', body);

    const [avant] = await sql`
      SELECT
        l.commande_id,
        l.livreur_id,
        CASE
          WHEN cl.type_client = 'entreprise' THEN cl.titre
          ELSE CONCAT(cl.prenom, ' ', cl.nom)
        END AS client_nom,
        u_client.id AS client_user_id
      FROM livraisons l
      JOIN commandes   c  ON c.id  = l.commande_id
      JOIN clients     cl ON cl.id = c.client_id
      LEFT JOIN utilisateurs u_client ON u_client.id = cl.utilisateur_id
      WHERE l.id = ${id}
    `;

    // Calculer le livreur_id final
    let livreurIdFinal: number | null = null;
    if (livreur_id !== undefined && livreur_id !== null && livreur_id !== '') {
      livreurIdFinal = Number(livreur_id);
    } else if (livreur_id === undefined) {
      // Pas envoyé dans le body → garder l'existant
      livreurIdFinal = avant?.livreur_id ?? null;
    } else {
      // livreur_id = null ou '' → désassigner
      livreurIdFinal = null;
    }

    console.log('livreurIdFinal:', livreurIdFinal);

    const [livraison] = await sql`
      UPDATE livraisons
      SET
        statut         = ${statut},
        livreur_id     = ${livreurIdFinal},
        date_livraison = CASE WHEN ${statut} = 'livree' THEN CURRENT_DATE ELSE date_livraison END,
        raison_echec   = ${raison_echec !== undefined ? raison_echec : null}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!livraison) return Response.json({ error: 'Livraison introuvable' }, { status: 404 });

    if (statut === 'livree' && avant) {
      await sql`
        UPDATE commandes SET statut = 'livree', updated_at = NOW()
        WHERE id = ${livraison.commande_id}
      `;
      await onLivraisonTerminee(
        Number(id),
        livraison.commande_id,
        avant.client_nom,
        avant.client_user_id ? Number(avant.client_user_id) : undefined,
      );
      await onStatutCommande(
        livraison.commande_id,
        'pret_livraison',
        'livree',
        avant.client_nom,
        avant.client_user_id ? Number(avant.client_user_id) : undefined,
        avant.livreur_id ? Number(avant.livreur_id) : undefined,
      );
    }

    return Response.json(livraison);
  } catch (error) {
    console.error('PUT livraison error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM livraisons WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}