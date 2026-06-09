
import sql from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const utilisateur_id = searchParams.get('utilisateur_id');

    const rows = await sql`
      SELECT
        c.*,
        cl.nom        AS client_nom,
        cl.prenom     AS client_prenom,
        cl.telephone  AS client_telephone,
        cl.adresse    AS client_adresse,
        cl.type_client,
        cl.titre      AS client_titre
      FROM commandes c
      LEFT JOIN clients cl ON cl.id = c.client_id
      ${utilisateur_id ? sql`WHERE cl.utilisateur_id = ${utilisateur_id}` : sql``}
      ORDER BY c.created_at DESC
    `;

    const commandesAvecLignes = await Promise.all(
      rows.map(async (cmd: any) => {
        const lignes = await sql`
          SELECT cp.quantite, cp.prix_unitaire,
            p.id AS produit_id, p.nom AS produit_nom, p.unite
          FROM commande_produits cp
          JOIN produits p ON p.id = cp.produit_id
          WHERE cp.commande_id = ${cmd.id}
        `;
        return { ...cmd, lignes };
      })
    );

    return Response.json(commandesAvecLignes);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { client_id, produits, adresse_livraison, notes } = body;

    if (!client_id || !produits || produits.length === 0) {
      return Response.json({ error: 'client_id et produits sont requis' }, { status: 400 });
    }

    // ✅ On vérifie juste que le produit existe — plus de blocage stock
    // C'est l'admin qui gère le manque au moment de la validation
    for (const ligne of produits) {
      const [produit] = await sql`SELECT id, nom FROM produits WHERE id = ${ligne.produit_id}`;
      if (!produit) return Response.json({ error: `Produit #${ligne.produit_id} introuvable` }, { status: 404 });
    }

    const total = produits.reduce((acc: number, p: any) => acc + (Number(p.prix_unitaire) * Number(p.quantite)), 0);

    const [commande] = await sql`
      INSERT INTO commandes (client_id, statut, total, adresse_livraison, notes)
      VALUES (${client_id}, 'en_attente', ${total}, ${adresse_livraison || null}, ${notes || null})
      RETURNING *
    `;

    for (const ligne of produits) {
      await sql`
        INSERT INTO commande_produits (commande_id, produit_id, quantite, prix_unitaire)
        VALUES (${commande.id}, ${ligne.produit_id}, ${ligne.quantite}, ${ligne.prix_unitaire})
      `;
    }

    const numBon = `BC-${new Date().getFullYear()}-${String(commande.id).padStart(4, '0')}`;
    const [bon] = await sql`
      INSERT INTO bons_commande (commande_id, numero_bon, date_emission, conditions_paiement)
      VALUES (${commande.id}, ${numBon}, CURRENT_DATE, '30 jours')
      RETURNING *
    `;

    // ✅ On n'enlève plus le stock ici — ce sera fait lors de la validation par l'admin
    // On enregistre juste le mouvement comme "réservation"
    for (const ligne of produits) {
      await sql`
        INSERT INTO mouvements_stock (produit_id, type, quantite, raison, reference_id)
        VALUES (${ligne.produit_id}, 'reservation', ${ligne.quantite}, 'commande_client', ${commande.id})
      `;
    }

    return Response.json({
      id: commande.id,
      total: commande.total,
      statut: commande.statut,
      numero_bon_commande: numBon,
      bon_commande_id: bon.id
    }, { status: 201 });

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}