import sql from '@/lib/db';
import { onNouvelleLivraison } from '@/lib/tracker';

// ─── GET ─────────────────────────────────────────────────────
export async function GET() {
  try {
    const rows = await sql`
      SELECT
        l.*,
        c.total           AS commande_total,
        c.statut          AS commande_statut,
        c.adresse_livraison,
        CASE
          WHEN cl.type_client = 'entreprise' THEN cl.titre
          ELSE CONCAT(cl.prenom, ' ', cl.nom)
        END               AS client_nom,
        cl.telephone      AS client_telephone,
        cl.email          AS client_email,
        u.nom             AS livreur_nom,
        bl.numero_bon     AS numero_bon_livraison,
        bl.id             AS bon_livraison_id
      FROM livraisons l
      JOIN commandes  c  ON c.id  = l.commande_id
      JOIN clients    cl ON cl.id = c.client_id
      LEFT JOIN utilisateurs  u  ON u.id  = l.livreur_id
      LEFT JOIN bons_livraison bl ON bl.livraison_id = l.id
      ORDER BY l.created_at DESC
    `;
    return Response.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const { commande_id, livreur_id, adresse, notes, date_livraison_prevue } = await request.json();
    if (!commande_id) return Response.json({ error: 'commande_id est requis' }, { status: 400 });

    // Récupérer infos commande + client + livreur
    const [commande] = await sql`
      SELECT
        c.id, c.statut, c.client_id,
        CASE
          WHEN cl.type_client = 'entreprise' THEN cl.titre
          ELSE CONCAT(cl.prenom, ' ', cl.nom)
        END AS client_nom,
        u_client.id AS client_user_id
      FROM commandes c
      JOIN clients cl ON cl.id = c.client_id
      LEFT JOIN utilisateurs u_client ON u_client.id = cl.utilisateur_id
      WHERE c.id = ${commande_id}
    `;
    if (!commande) return Response.json({ error: 'Commande introuvable' }, { status: 404 });

    let livreurNom: string | undefined;
    if (livreur_id) {
      const [livreur] = await sql`SELECT nom FROM utilisateurs WHERE id = ${livreur_id}`;
      livreurNom = livreur?.nom;
    }

    // Créer la livraison
    const [livraison] = await sql`
      INSERT INTO livraisons (commande_id, livreur_id, adresse, statut)
      VALUES (${commande_id}, ${livreur_id || null}, ${adresse || ''}, 'en_attente')
      RETURNING *
    `;

    // Bon de livraison auto
    const annee  = new Date().getFullYear();
    const numero = String(livraison.id).padStart(4, '0');
    const numBon = `BL-${annee}-${numero}`;

    const [bon] = await sql`
      INSERT INTO bons_livraison (livraison_id, commande_id, numero_bon, date_emission, date_livraison_prevue, notes)
      VALUES (${livraison.id}, ${commande_id}, ${numBon}, CURRENT_DATE, ${date_livraison_prevue || null}, ${notes || null})
      RETURNING *
    `;

    // Mettre à jour statut commande
    if (!['pret_livraison', 'livree'].includes(commande.statut)) {
      await sql`UPDATE commandes SET statut = 'pret_livraison', updated_at = NOW() WHERE id = ${commande_id}`;
    }

    // Tracker avec tous les IDs
    await onNouvelleLivraison(
      livraison.id,
      Number(commande_id),
      livreur_id ? Number(livreur_id) : undefined,
      livreurNom,
      commande.client_nom,
      commande.client_user_id ? Number(commande.client_user_id) : undefined,
    );

    return Response.json({ id: livraison.id, numero_bon_livraison: numBon, bon_livraison_id: bon.id }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}