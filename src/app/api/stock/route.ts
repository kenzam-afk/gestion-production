import sql from '@/lib/db';

// ─── GET /api/stock ──────────────────────────────────────────
// Retourne l'état complet du stock produits + matières premières
// avec alertes et faisabilité de production
export async function GET() {
  try {

    // 1. Stock produits finis avec état
    const produits = await sql`
      SELECT
        p.id,
        p.nom,
        p.unite,
        p.stock_disponible,
        p.stock_minimum,
        p.prix_vente,
        CASE
          WHEN p.stock_disponible = 0                       THEN 'rupture'
          WHEN p.stock_disponible <= p.stock_minimum        THEN 'critique'
          WHEN p.stock_disponible <= p.stock_minimum * 1.5  THEN 'bas'
          ELSE 'ok'
        END AS etat_stock,
        -- Quantité demandée (commandes en attente + fabrication)
        COALESCE((
          SELECT SUM(cp.quantite)
          FROM commande_produits cp
          JOIN commandes c ON c.id = cp.commande_id
          WHERE cp.produit_id = p.id
            AND c.statut IN ('en_attente', 'confirmee', 'en_fabrication')
        ), 0) AS quantite_demandee
      FROM produits p
      ORDER BY p.stock_disponible ASC
    `;

    // 2. Stock matières premières avec état
    const matieres = await sql`
      SELECT
        mp.*,
        CASE
          WHEN mp.stock_actuel = 0                          THEN 'rupture'
          WHEN mp.stock_actuel <= mp.stock_minimum          THEN 'critique'
          WHEN mp.stock_actuel <= mp.stock_minimum * 1.5    THEN 'bas'
          ELSE 'ok'
        END AS etat_stock
      FROM matieres_premieres mp
      ORDER BY mp.stock_actuel ASC
    `;

    // 3. Faisabilité : pour chaque produit, combien peut-on produire ?
    const faisabilite = await sql`
      SELECT
        p.id   AS produit_id,
        p.nom  AS produit_nom,
        p.stock_disponible,
        MIN(FLOOR(mp.stock_actuel / pm.quantite_necessaire)) AS unites_productibles,
        COUNT(pm.id) AS nb_matieres_requises,
        SUM(CASE WHEN mp.stock_actuel < pm.quantite_necessaire THEN 1 ELSE 0 END) AS matieres_manquantes
      FROM produits p
      JOIN produit_matieres pm ON pm.produit_id = p.id
      JOIN matieres_premieres mp ON mp.id = pm.matiere_id
      GROUP BY p.id, p.nom, p.stock_disponible
      ORDER BY unites_productibles ASC
    `;

    // 4. Alertes prioritaires
    const alertes = [];

    for (const p of produits) {
      const demande  = Number(p.quantite_demandee);
      const dispo    = Number(p.stock_disponible);

      if (p.etat_stock === 'rupture') {
        alertes.push({
          type: 'danger',
          categorie: 'produit',
          message: `Rupture totale — ${p.nom}`,
          detail: `Stock : 0 | Demande en cours : ${demande}`,
        });
      } else if (p.etat_stock === 'critique') {
        alertes.push({
          type: 'warning',
          categorie: 'produit',
          message: `Stock critique — ${p.nom}`,
          detail: `Stock : ${dispo} / Min : ${p.stock_minimum} | Demande : ${demande}`,
        });
      }

      if (demande > dispo) {
        alertes.push({
          type: 'danger',
          categorie: 'demande',
          message: `Demande supérieure au stock — ${p.nom}`,
          detail: `Demandé : ${demande} | Disponible : ${dispo} | Manque : ${demande - dispo}`,
        });
      }
    }

    for (const m of matieres) {
      if (m.etat_stock === 'rupture' || m.etat_stock === 'critique') {
        alertes.push({
          type: m.etat_stock === 'rupture' ? 'danger' : 'warning',
          categorie: 'matiere',
          message: `${m.etat_stock === 'rupture' ? 'Rupture' : 'Stock bas'} matière — ${m.titre}`,
          detail: `Stock : ${m.stock_actuel} ${m.unite} / Min : ${m.stock_minimum}`,
        });
      }
    }

    return Response.json({
      produits,
      matieres,
      faisabilite,
      alertes,
      resume: {
        produits_rupture:  produits.filter(p => p.etat_stock === 'rupture').length,
        produits_critique: produits.filter(p => p.etat_stock === 'critique').length,
        produits_ok:       produits.filter(p => p.etat_stock === 'ok').length,
        matieres_critique: matieres.filter(m => m.etat_stock === 'rupture' || m.etat_stock === 'critique').length,
        alertes_total:     alertes.length,
      },
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST /api/stock ─────────────────────────────────────────
// Ajustement manuel du stock d'un produit ou d'une matière
// Body: { type: 'produit'|'matiere', id, quantite, operation: 'entree'|'sortie'|'ajustement', raison }
export async function POST(req) {
  try {
    const { type, id, quantite, operation, raison } = await req.json();

    if (!id || !quantite || !operation) {
      return Response.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const qte = Number(quantite);

    if (type === 'produit') {
      const delta = operation === 'sortie' ? -qte : qte;
      const [updated] = await sql`
        UPDATE produits
        SET stock_disponible = stock_disponible + ${delta}
        WHERE id = ${id}
        RETURNING *
      `;
      await sql`
        INSERT INTO mouvements_stock (produit_id, type, quantite, raison)
        VALUES (${id}, ${operation}, ${qte}, ${raison || 'ajustement_manuel'})
      `;
      return Response.json({ success: true, stock_disponible: updated.stock_disponible });

    } else if (type === 'matiere') {
      const delta = operation === 'sortie' ? -qte : qte;
      const [updated] = await sql`
        UPDATE matieres_premieres
        SET stock_actuel = stock_actuel + ${delta}
        WHERE id = ${id}
        RETURNING *
      `;
      await sql`
        INSERT INTO mouvements_matieres (matiere_id, type, quantite, raison)
        VALUES (${id}, ${operation}, ${qte}, ${raison || 'ajustement_manuel'})
      `;
      return Response.json({ success: true, stock_actuel: updated.stock_actuel });

    } else {
      return Response.json({ error: 'type doit être "produit" ou "matiere"' }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}