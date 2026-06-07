import sql from '@/lib/db';

// ─── GET : liste toutes les commandes avec lignes ────────────
export async function GET() {
  try {
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
      ORDER BY c.created_at DESC
    `;

    const commandesAvecLignes = await Promise.all(
      rows.map(async (cmd) => {
        const lignes = await sql`
          SELECT
            cp.quantite, cp.prix_unitaire,
            p.id   AS produit_id,
            p.nom  AS produit_nom,
            p.unite
          FROM commande_produits cp
          JOIN produits p ON p.id = cp.produit_id
          WHERE cp.commande_id = ${cmd.id}
        `;
        return { ...cmd, lignes };
      })
    );

    return Response.json(commandesAvecLignes);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST : créer une commande ───────────────────────────────
export async function POST(req) {
  try {
    const body = await req.json();
    const { client_id, produits, adresse_livraison, notes } = body;

    if (!client_id || !produits || produits.length === 0) {
      return Response.json({ error: 'client_id et produits sont requis' }, { status: 400 });
    }

    // 1. Vérifier le stock disponible
    for (const ligne of produits) {
      const [produit] = await sql`
        SELECT id, nom, stock_disponible FROM produits WHERE id = ${ligne.produit_id}
      `;
      if (!produit) {
        return Response.json({ error: `Produit #${ligne.produit_id} introuvable` }, { status: 404 });
      }
      if (produit.stock_disponible < ligne.quantite) {
        return Response.json({
          error: `Stock insuffisant pour "${produit.nom}" : ${produit.stock_disponible} disponible(s), ${ligne.quantite} demandé(s)`,
          produit_id: produit.id,
          stock_disponible: produit.stock_disponible,
        }, { status: 400 });
      }
    }

    // 2. Vérifier la faisabilité matières premières
    const alertes_matieres = [];
    for (const ligne of produits) {
      const matieres = await sql`
        SELECT
          pm.quantite_necessaire,
          mp.id AS matiere_id,
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
          alertes_matieres.push({
            matiere: m.titre,
            stock_actuel: m.stock_actuel,
            quantite_requise: m.quantite_requise,
            manque: Number(m.quantite_requise) - Number(m.stock_actuel),
            unite: m.unite,
          });
        }
      }
    }

    // 3. Calculer le total
    const total = produits.reduce(
      (acc, p) => acc + (Number(p.prix_unitaire) * Number(p.quantite)), 0
    );

    // 4. Créer la commande
    const [commande] = await sql`
      INSERT INTO commandes (client_id, statut, total, adresse_livraison, notes)
      VALUES (${client_id}, 'en_attente', ${total}, ${adresse_livraison || null}, ${notes || null})
      RETURNING *
    `;

    // 5. Insérer les lignes
    for (const ligne of produits) {
      await sql`
        INSERT INTO commande_produits (commande_id, produit_id, quantite, prix_unitaire)
        VALUES (${commande.id}, ${ligne.produit_id}, ${ligne.quantite}, ${ligne.prix_unitaire})
      `;
    }

    // 6. Générer le bon de commande
    const annee  = new Date().getFullYear();
    const numero = String(commande.id).padStart(4, '0');
    const numBon = `BC-${annee}-${numero}`;

    const [bon] = await sql`
      INSERT INTO bons_commande (commande_id, numero_bon, date_emission, conditions_paiement)
      VALUES (${commande.id}, ${numBon}, CURRENT_DATE, '30 jours')
      RETURNING *
    `;

    // 7. Déduire le stock
    for (const ligne of produits) {
      await sql`
        UPDATE produits
        SET stock_disponible = stock_disponible - ${ligne.quantite}
        WHERE id = ${ligne.produit_id}
      `;
      await sql`
        INSERT INTO mouvements_stock (produit_id, type, quantite, raison, reference_id)
        VALUES (${ligne.produit_id}, 'sortie', ${ligne.quantite}, 'commande', ${commande.id})
      `;
    }

    return Response.json({
      id: commande.id,
      total: commande.total,
      statut: commande.statut,
      numero_bon_commande: numBon,
      bon_commande_id: bon.id,
      alertes_matieres: alertes_matieres.length > 0 ? alertes_matieres : null,
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/commandes error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}