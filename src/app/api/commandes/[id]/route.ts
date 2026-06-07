import sql from '@/lib/db';
import { onStatutCommande, onNouvelleLivraison } from '@/lib/tracker';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
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
    if (!commande) return Response.json({ error: 'Commande introuvable' }, { status: 404 });

    const lignes = await sql`
      SELECT cp.*, p.nom AS produit_nom, p.description AS produit_description, p.unite
      FROM commande_produits cp
      JOIN produits p ON p.id = cp.produit_id
      WHERE cp.commande_id = ${id}
    `;
    const [bon_commande]  = await sql`SELECT * FROM bons_commande WHERE commande_id = ${id}`;
    const [bon_livraison] = await sql`
      SELECT bl.* FROM bons_livraison bl
      JOIN livraisons l ON l.id = bl.livraison_id
      WHERE bl.commande_id = ${id}
    `;

    return Response.json({ ...commande, lignes, bon_commande: bon_commande || null, bon_livraison: bon_livraison || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { statut, livreur_id } = body;

    const statutsValides = ['en_attente', 'confirmee', 'en_fabrication', 'pret_livraison', 'livree', 'annulee'];
    if (!statutsValides.includes(statut)) {
      return Response.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const [avant] = await sql`
      SELECT
        c.statut,
        cl.nom, cl.prenom, cl.titre, cl.type_client,
        cl.adresse AS client_adresse,
        u_client.id AS client_user_id,
        l.id AS livraison_id,
        l.livreur_id
      FROM commandes c
      LEFT JOIN clients      cl       ON cl.id       = c.client_id
      LEFT JOIN utilisateurs u_client ON u_client.id = cl.utilisateur_id
      LEFT JOIN livraisons   l        ON l.commande_id = c.id
      WHERE c.id = ${id}
      LIMIT 1
    `;

    // ── Vérification matières premières avant fabrication ────
    if (statut === 'en_fabrication') {
      const lignes = await sql`SELECT * FROM commande_produits WHERE commande_id = ${id}`;
      const matieres_manquantes = [];

      for (const ligne of lignes) {
        const matieres = await sql`
          SELECT
            pm.quantite_necessaire,
            mp.titre,
            mp.stock_actuel,
            mp.unite,
            (pm.quantite_necessaire * ${ligne.quantite}) AS quantite_requise
          FROM produit_matieres pm
          JOIN matieres_premieres mp ON mp.id = pm.matiere_id
          WHERE pm.produit_id = ${ligne.produit_id}
        `;
        for (const m of matieres) {
          if (Number(m.stock_actuel) < Number(m.quantite_requise)) {
            matieres_manquantes.push({
              matiere:          m.titre,
              stock_actuel:     m.stock_actuel,
              quantite_requise: m.quantite_requise,
              manque:           Number(m.quantite_requise) - Number(m.stock_actuel),
              unite:            m.unite,
            });
          }
        }
      }

      if (matieres_manquantes.length > 0) {
        return Response.json({
          error: `Matières premières insuffisantes pour lancer la fabrication`,
          matieres_manquantes,
          code: 'MATIERES_INSUFFISANTES',
        }, { status: 400 });
      }
    }

    const [commande] = await sql`
      UPDATE commandes SET statut = ${statut}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    if (!commande) return Response.json({ error: 'Commande introuvable' }, { status: 404 });

    // ── Créer ordres de fabrication ──────────────────────────
    if (statut === 'en_fabrication') {
      const lignes = await sql`SELECT * FROM commande_produits WHERE commande_id = ${id}`;
      for (const ligne of lignes) {
        const existing = await sql`SELECT id FROM ordres_fabrication WHERE commande_id = ${id} AND produit_id = ${ligne.produit_id}`;
        if (existing.length === 0) {
          await sql`INSERT INTO ordres_fabrication (commande_id, produit_id, quantite, statut) VALUES (${id}, ${ligne.produit_id}, ${ligne.quantite}, 'planifie')`;
        }
      }
    }

    // ── Créer livraison automatiquement quand prête ──────────
    if (statut === 'pret_livraison' && !avant?.livraison_id) {
      const adresse = avant?.client_adresse || '';

      const [livraison] = await sql`
        INSERT INTO livraisons (commande_id, livreur_id, adresse, statut)
        VALUES (${id}, ${livreur_id || null}, ${adresse}, 'en_attente')
        RETURNING *
      `;

      const annee  = new Date().getFullYear();
      const numero = String(livraison.id).padStart(4, '0');
      const numBon = `BL-${annee}-${numero}`;

      await sql`
        INSERT INTO bons_livraison (livraison_id, commande_id, numero_bon, date_emission)
        VALUES (${livraison.id}, ${id}, ${numBon}, CURRENT_DATE)
      `;

      const clientNomLiv = avant?.type_client === 'entreprise'
        ? avant?.titre
        : `${avant?.prenom || ''} ${avant?.nom || ''}`.trim();

      await onNouvelleLivraison(
        livraison.id,
        Number(id),
        livreur_id ? Number(livreur_id) : undefined,
        undefined,
        clientNomLiv || undefined,
        avant?.client_user_id ? Number(avant.client_user_id) : undefined,
      );
    }

    // ── Modifier livreur si livraison existe déjà ────────────
    if (statut === 'pret_livraison' && avant?.livraison_id && livreur_id) {
      await sql`UPDATE livraisons SET livreur_id = ${livreur_id} WHERE id = ${avant.livraison_id}`;
    }

    // ── Remettre stock si annulée ────────────────────────────
    if (statut === 'annulee') {
      const lignes = await sql`SELECT * FROM commande_produits WHERE commande_id = ${id}`;
      for (const ligne of lignes) {
        await sql`UPDATE produits SET stock_disponible = stock_disponible + ${ligne.quantite} WHERE id = ${ligne.produit_id}`;
        await sql`INSERT INTO mouvements_stock (produit_id, type, quantite, raison, reference_id) VALUES (${ligne.produit_id}, 'entree', ${ligne.quantite}, 'annulation_commande', ${id})`;
      }
    }

    // ── Tracker statut commande ──────────────────────────────
    if (avant) {
      const clientNom = avant.type_client === 'entreprise'
        ? avant.titre
        : `${avant.prenom || ''} ${avant.nom || ''}`.trim();

      await onStatutCommande(
        Number(id),
        avant.statut,
        statut,
        clientNom || undefined,
        avant.client_user_id ? Number(avant.client_user_id) : undefined,
        avant.livreur_id ? Number(avant.livreur_id) : undefined,
      );
    }

    return Response.json(commande);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM commandes WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}