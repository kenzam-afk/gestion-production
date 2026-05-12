import sql from '@/lib/db';

// ═══════════════════════════════════════════════════════════
// GET /api/mrp
// Lance le calcul MRP et retourne le plan des besoins
// ═══════════════════════════════════════════════════════════
export async function GET() {
  try {
    const resultat = await calculerMRP();
    return Response.json(resultat);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════
// POST /api/mrp
// Sauvegarde le plan MRP et génère les alertes + demandes appro
// ═══════════════════════════════════════════════════════════
export async function POST() {
  try {
    const { besoins, commandes_concernees } = await calculerMRP();

    const plans_crees = [];

    for (const besoin of besoins) {
      if (besoin.quantite_manque <= 0) continue;

      // Chercher fournisseur associé à cette matière
      const [fournisseur] = await sql`
        SELECT f.id FROM fournisseurs f
        WHERE f.actif = true
        ORDER BY f.id ASC LIMIT 1
      `;

      // Créer le plan MRP
      const [plan] = await sql`
        INSERT INTO mrp_plans
          (matiere_id, fournisseur_id, quantite_besoin, quantite_stock, quantite_manque, statut, commandes_concernees)
        VALUES
          (${besoin.matiere_id}, ${fournisseur?.id || null},
           ${besoin.quantite_besoin}, ${besoin.stock_actuel},
           ${besoin.quantite_manque}, 'en_attente',
           ${JSON.stringify(besoin.commandes_ids)}::jsonb)
        RETURNING *
      `;
      plans_crees.push(plan);

      // Créer alerte si manque critique
      await sql`
        INSERT INTO alertes (type, niveau, titre, message, entite_type, entite_id)
        VALUES (
          'mrp', 'danger',
          ${'Approvisionnement requis — ' + besoin.matiere_titre},
          ${'Besoin: ' + besoin.quantite_besoin + ' ' + besoin.unite +
            ' | Stock: ' + besoin.stock_actuel + ' ' + besoin.unite +
            ' | Manque: ' + besoin.quantite_manque + ' ' + besoin.unite},
          'matiere', ${besoin.matiere_id}
        )
      `;

      // Créer demande appro si fournisseur connu
      if (fournisseur) {
        await sql`
          INSERT INTO demandes_appro (mrp_plan_id, fournisseur_id, matiere_id, quantite, statut)
          VALUES (${plan.id}, ${fournisseur.id}, ${besoin.matiere_id}, ${besoin.quantite_manque}, 'en_attente')
        `;
      }
    }

    return Response.json({
      success: true,
      plans_crees: plans_crees.length,
      message: `${plans_crees.length} plan(s) MRP créé(s)`,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════
// ALGORITHME MRP PRINCIPAL
// ═══════════════════════════════════════════════════════════
async function calculerMRP() {

  // 1. Récupérer toutes les commandes actives (en attente + confirmées + fabrication)
  const commandes = await sql`
    SELECT
      c.id,
      c.statut,
      cp.produit_id,
      cp.quantite
    FROM commandes c
    JOIN commande_produits cp ON cp.commande_id = c.id
    WHERE c.statut IN ('en_attente', 'confirmee', 'en_fabrication')
    ORDER BY c.created_at ASC
  `;

  if (commandes.length === 0) {
    return {
      besoins: [],
      commandes_concernees: [],
      resume: { total_matieres: 0, matieres_ok: 0, matieres_manquantes: 0 },
      faisabilite_commandes: [],
    };
  }

  // 2. Pour chaque commande + produit, calculer les besoins en matières
  // Structure: { matiere_id -> { besoin_total, stock, manque, commandes... } }
  const besoins_map: Record<number, {
    matiere_id: number;
    matiere_titre: string;
    unite: string;
    stock_actuel: number;
    stock_minimum: number;
    quantite_besoin: number;
    commandes_ids: number[];
    detail_par_commande: { commande_id: number; produit: string; quantite_mp: number }[];
  }> = {};

  const faisabilite_commandes: {
    commande_id: number;
    statut: string;
    faisable: boolean;
    matieres_manquantes: { matiere: string; besoin: number; stock: number; manque: number }[];
  }[] = [];

  for (const cmd of commandes) {
    // Récupérer la nomenclature du produit
    const matieres_requises = await sql`
      SELECT
        pm.matiere_id,
        pm.quantite_necessaire,
        mp.titre AS matiere_titre,
        mp.unite,
        mp.stock_actuel,
        mp.stock_minimum,
        p.nom AS produit_nom
      FROM produit_matieres pm
      JOIN matieres_premieres mp ON mp.id = pm.matiere_id
      JOIN produits p ON p.id = pm.produit_id
      WHERE pm.produit_id = ${cmd.produit_id}
    `;

    const matieres_manquantes_cmd = [];

    for (const mat of matieres_requises) {
      const qte_necessaire = Number(mat.quantite_necessaire) * Number(cmd.quantite);

      // Accumuler dans le map global
      if (!besoins_map[mat.matiere_id]) {
        besoins_map[mat.matiere_id] = {
          matiere_id:      mat.matiere_id,
          matiere_titre:   mat.matiere_titre,
          unite:           mat.unite,
          stock_actuel:    Number(mat.stock_actuel),
          stock_minimum:   Number(mat.stock_minimum),
          quantite_besoin: 0,
          commandes_ids:   [],
          detail_par_commande: [],
        };
      }

      besoins_map[mat.matiere_id].quantite_besoin += qte_necessaire;

      if (!besoins_map[mat.matiere_id].commandes_ids.includes(cmd.id)) {
        besoins_map[mat.matiere_id].commandes_ids.push(cmd.id);
      }

      besoins_map[mat.matiere_id].detail_par_commande.push({
        commande_id: cmd.id,
        produit:     mat.produit_nom,
        quantite_mp: qte_necessaire,
      });

      // Vérifier si cette matière manque pour cette commande spécifique
      if (Number(mat.stock_actuel) < qte_necessaire) {
        matieres_manquantes_cmd.push({
          matiere:  mat.matiere_titre,
          besoin:   qte_necessaire,
          stock:    Number(mat.stock_actuel),
          manque:   qte_necessaire - Number(mat.stock_actuel),
        });
      }
    }

    // Faisabilité par commande
    const existing = faisabilite_commandes.find(f => f.commande_id === cmd.id);
    if (!existing) {
      faisabilite_commandes.push({
        commande_id: cmd.id,
        statut:      cmd.statut,
        faisable:    matieres_manquantes_cmd.length === 0,
        matieres_manquantes: matieres_manquantes_cmd,
      });
    } else {
      existing.matieres_manquantes.push(...matieres_manquantes_cmd);
      if (matieres_manquantes_cmd.length > 0) existing.faisable = false;
    }
  }

  // 3. Calculer le manque net pour chaque matière
  // (stock - besoin total, en tenant compte du stock minimum)
  const besoins = Object.values(besoins_map).map(b => {
    const stock_net    = b.stock_actuel - b.quantite_besoin;
    // On commande aussi de quoi reconstituer le stock minimum
    const qte_manque   = stock_net < 0
      ? Math.abs(stock_net) + b.stock_minimum
      : (b.stock_actuel < b.stock_minimum ? b.stock_minimum - b.stock_actuel : 0);

    return {
      ...b,
      quantite_manque: Math.max(0, qte_manque),
      stock_net,
      suffisant: stock_net >= 0,
    };
  });

  // 4. Résumé
  const resume = {
    total_matieres:      besoins.length,
    matieres_ok:         besoins.filter(b => b.suffisant).length,
    matieres_manquantes: besoins.filter(b => !b.suffisant).length,
    commandes_faisables: faisabilite_commandes.filter(f => f.faisable).length,
    commandes_bloquees:  faisabilite_commandes.filter(f => !f.faisable).length,
  };

  return {
    besoins,
    commandes_concernees: [...new Set(commandes.map(c => c.id))],
    faisabilite_commandes,
    resume,
    calcule_le: new Date().toISOString(),
  };
}