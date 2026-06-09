import sql from '@/lib/db';

// ═══════════════════════════════════════════════════════════
// GET /api/mrp
// ═══════════════════════════════════════════════════════════
export async function GET() {
  try {
    const resultat = await calculerMRP();
    return Response.json(resultat);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════
// POST /api/mrp — Sauvegarde + alertes + demandes appro
// ═══════════════════════════════════════════════════════════
export async function POST() {
  try {
    const { besoins } = await calculerMRP();
    const plans_crees = [];

    for (const besoin of besoins) {
      if (besoin.quantite_a_commander <= 0) continue;

      const [fournisseur] = await sql`
        SELECT f.id FROM fournisseurs f
        WHERE f.actif = true
        ORDER BY f.id ASC LIMIT 1
      `;

      const [plan] = await sql`
        INSERT INTO mrp_plans
          (matiere_id, fournisseur_id, quantite_besoin, quantite_stock, quantite_manque, statut, commandes_concernees)
        VALUES
          (${besoin.matiere_id}, ${fournisseur?.id || null},
           ${besoin.besoin_total}, ${besoin.stock_actuel},
           ${besoin.quantite_a_commander}, 'en_attente',
           ${JSON.stringify(besoin.commandes_ids)}::jsonb)
        RETURNING *
      `;
      plans_crees.push(plan);

      const niveau = besoin.score_urgence > 10 ? 'danger' : besoin.score_urgence > 5 ? 'warning' : 'info';

      await sql`
        INSERT INTO alertes (type, niveau, titre, message, entite_type, entite_id)
        VALUES (
          'mrp', ${niveau},
          ${'Approvisionnement requis — ' + besoin.matiere_titre},
          ${'Besoin commandes: ' + besoin.besoin_commandes.toFixed(2) + ' ' + besoin.unite +
            ' | Prévision mois prochain: ' + besoin.prevision_mois_prochain.toFixed(2) + ' ' + besoin.unite +
            ' | Stock: ' + besoin.stock_actuel + ' ' + besoin.unite +
            ' | À commander: ' + besoin.quantite_a_commander.toFixed(2) + ' ' + besoin.unite +
            ' | Score urgence: ' + besoin.score_urgence.toFixed(1)},
          'matiere', ${besoin.matiere_id}
        )
      `;

      if (fournisseur) {
        await sql`
          INSERT INTO demandes_appro (mrp_plan_id, fournisseur_id, matiere_id, quantite, statut)
          VALUES (${plan.id}, ${fournisseur.id}, ${besoin.matiere_id}, ${besoin.quantite_a_commander}, 'en_attente')
        `;
      }
    }

    return Response.json({
      success: true,
      plans_crees: plans_crees.length,
      message: `${plans_crees.length} plan(s) MRP créé(s)`,
    });

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════
// ALGORITHME MRP v2
// — Agrégation globale (toutes commandes × tous produits)
// — Prévision mois prochain (historique mouvements_matieres)
// — Time-Phased + Priority-Based + Yield-Based
// ═══════════════════════════════════════════════════════════
async function calculerMRP() {

  const aujourd_hui = new Date();

  // ── 1. Toutes les commandes actives ──────────────────────
  const commandes = await sql`
    SELECT
      c.id,
      c.statut,
      c.created_at,
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
      resume: {
        total_matieres: 0, matieres_ok: 0, matieres_manquantes: 0,
        commandes_faisables: 0, commandes_bloquees: 0,
        taux_rebut_moyen: 0, commandes_urgentes: 0, commandes_normales: 0,
      },
      faisabilite_commandes: [],
      periodes: [],
    };
  }

  // ── 2. Yield-Based : taux de rebut depuis validations_production ──
  const taux_rebut_map: Record<number, number> = {};
  try {
    const rebuts = await sql`
      SELECT
        of2.produit_id,
        SUM(pv.quantite_rebutee)  AS total_rebutee,
        SUM(pv.quantite_produite) AS total_produite
      FROM validations_production pv
      JOIN ordres_fabrication of2 ON of2.id = pv.ordre_fab_id
      GROUP BY of2.produit_id
    `;
    for (const r of rebuts) {
      const total = Number(r.total_produite) + Number(r.total_rebutee);
      if (total > 0) {
        taux_rebut_map[r.produit_id] = Math.min(Number(r.total_rebutee) / total, 0.5);
      }
    }
  } catch {
    // Yield-Based désactivé si erreur
  }

  // ── 3. Prévision mois prochain par matière ────────────────
  // On lit les sorties réelles des 3 derniers mois depuis mouvements_matieres
  // et on projette la tendance sur le mois prochain.
  const debut_m1 = new Date(aujourd_hui.getFullYear(), aujourd_hui.getMonth() - 1, 1);
  const debut_m2 = new Date(aujourd_hui.getFullYear(), aujourd_hui.getMonth() - 2, 1);
  const debut_m3 = new Date(aujourd_hui.getFullYear(), aujourd_hui.getMonth() - 3, 1);
  const debut_m0 = new Date(aujourd_hui.getFullYear(), aujourd_hui.getMonth(),     1);

  const conso_historique = await sql`
    SELECT
      matiere_id,
      SUM(CASE WHEN created_at >= ${debut_m3.toISOString()} AND created_at < ${debut_m2.toISOString()} THEN quantite ELSE 0 END) AS conso_m3,
      SUM(CASE WHEN created_at >= ${debut_m2.toISOString()} AND created_at < ${debut_m1.toISOString()} THEN quantite ELSE 0 END) AS conso_m2,
      SUM(CASE WHEN created_at >= ${debut_m1.toISOString()} AND created_at < ${debut_m0.toISOString()} THEN quantite ELSE 0 END) AS conso_m1
    FROM mouvements_matieres
    WHERE type = 'sortie'
      AND created_at >= ${debut_m3.toISOString()}
    GROUP BY matiere_id
  `;

  // Map matiere_id → prévision mois prochain
  // Même logique que l'analyse produit : tendance m1 vs m2 → coeff → prévision
  const prevision_map: Record<number, number> = {};
  for (const row of conso_historique) {
    const m1 = Number(row.conso_m1);
    const m2 = Number(row.conso_m2);
    const m3 = Number(row.conso_m3);
    const moy = (m1 + m2 + m3) / 3;
    const coeff = m1 > m2 * 1.15 ? 1.2 : m1 < m2 * 0.85 ? 0.9 : 1.0;
    prevision_map[row.matiere_id] = parseFloat((moy * coeff).toFixed(2));
  }

  // ── 4. Priority-Based : score selon l'âge de la commande ──
  function calculerPriorite(commande: any): number {
    const jours_age = Math.floor(
      (aujourd_hui.getTime() - new Date(commande.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (jours_age > 14) return 3;
    if (jours_age > 7)  return 2;
    return 1;
  }

  // ── 5. Time-Phased : 4 semaines selon ancienneté ──────────
  const periodes = Array.from({ length: 4 }, (_, i) => {
    const debut = new Date(aujourd_hui);
    debut.setDate(debut.getDate() + i * 7);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 6);
    return {
      semaine: i + 1,
      debut:   debut.toISOString().split('T')[0],
      fin:     fin.toISOString().split('T')[0],
      commandes_ids:    [] as number[],
      besoins_matieres: {} as Record<number, number>,
    };
  });

  for (const cmd of commandes) {
    const jours_age = Math.floor(
      (aujourd_hui.getTime() - new Date(cmd.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    let idx = 3;
    if      (jours_age > 14) idx = 0;
    else if (jours_age > 7)  idx = 1;
    else if (jours_age > 3)  idx = 2;

    if (!periodes[idx].commandes_ids.includes(cmd.id)) {
      periodes[idx].commandes_ids.push(cmd.id);
    }
  }

  // ── 6. Agrégation globale des besoins par matière ─────────
  // Toutes les commandes × tous les produits → une seule ligne par matière
  const besoins_map: Record<number, {
    matiere_id:             number;
    matiere_titre:          string;
    unite:                  string;
    stock_actuel:           number;
    stock_minimum:          number;
    stock_securite:         number;
    besoin_commandes_brut:  number; // avant rebut
    besoin_commandes:       number; // après rebut (yield-based)
    prevision_mois_prochain:number; // depuis historique mouvements
    besoin_total:           number; // commandes + prévision
    taux_rebut_moyen:       number;
    score_urgence:          number;
    commandes_ids:          number[];
    produits_concernes:     string[];
    detail_par_commande: {
      commande_id: number;
      produit:     string;
      quantite_mp: number;
      priorite:    number;
      semaine:     number;
    }[];
  }> = {};

  const faisabilite_commandes: {
    commande_id: number;
    statut:      string;
    priorite:    number;
    faisable:    boolean;
    matieres_manquantes: { matiere: string; besoin: number; stock: number; manque: number }[];
  }[] = [];

  for (const cmd of commandes) {
    const priorite   = calculerPriorite(cmd);
    const semaine_cmd = periodes.findIndex(p => p.commandes_ids.includes(cmd.id)) + 1 || 1;

    // Toutes les matières requises pour CE produit de CETTE commande
    const matieres_requises = await sql`
      SELECT
        pm.matiere_id,
        pm.quantite_necessaire,
        mp.titre    AS matiere_titre,
        mp.unite,
        mp.stock_actuel,
        mp.stock_minimum,
        p.nom       AS produit_nom,
        p.id        AS produit_id
      FROM produit_matieres pm
      JOIN matieres_premieres mp ON mp.id = pm.matiere_id
      JOIN produits           p  ON p.id  = pm.produit_id
      WHERE pm.produit_id = ${cmd.produit_id}
    `;

    const matieres_manquantes_cmd: any[] = [];

    for (const mat of matieres_requises) {
      const taux_rebut = taux_rebut_map[mat.produit_id] || 0;
      const qte_brut   = Number(mat.quantite_necessaire) * Number(cmd.quantite);
      // Yield-Based : on commande plus pour absorber le rebut
      const qte_reel   = taux_rebut > 0 ? qte_brut / (1 - taux_rebut) : qte_brut;

      // Initialiser l'entrée matière si première fois
      if (!besoins_map[mat.matiere_id]) {
        const stock_securite = Math.ceil(Number(mat.stock_minimum) * 1.2);
        const prevision      = prevision_map[mat.matiere_id] || 0;
        besoins_map[mat.matiere_id] = {
          matiere_id:              mat.matiere_id,
          matiere_titre:           mat.matiere_titre,
          unite:                   mat.unite,
          stock_actuel:            Number(mat.stock_actuel),
          stock_minimum:           Number(mat.stock_minimum),
          stock_securite,
          besoin_commandes_brut:   0,
          besoin_commandes:        0,
          prevision_mois_prochain: prevision,
          besoin_total:            0,
          taux_rebut_moyen:        0,
          score_urgence:           0,
          commandes_ids:           [],
          produits_concernes:      [],
          detail_par_commande:     [],
        };
      }

      // Accumulation globale (toutes commandes confondues)
      besoins_map[mat.matiere_id].besoin_commandes_brut += qte_brut;
      besoins_map[mat.matiere_id].besoin_commandes      += qte_reel;

      // Score urgence = priorité × (besoin / max(stock,1))
      besoins_map[mat.matiere_id].score_urgence +=
        priorite * (qte_reel / Math.max(Number(mat.stock_actuel), 1));

      // Taux rebut moyen pondéré
      besoins_map[mat.matiere_id].taux_rebut_moyen =
        (besoins_map[mat.matiere_id].taux_rebut_moyen + taux_rebut) / 2;

      if (!besoins_map[mat.matiere_id].commandes_ids.includes(cmd.id)) {
        besoins_map[mat.matiere_id].commandes_ids.push(cmd.id);
      }
      if (!besoins_map[mat.matiere_id].produits_concernes.includes(mat.produit_nom)) {
        besoins_map[mat.matiere_id].produits_concernes.push(mat.produit_nom);
      }

      besoins_map[mat.matiere_id].detail_par_commande.push({
        commande_id: cmd.id,
        produit:     mat.produit_nom,
        quantite_mp: parseFloat(qte_reel.toFixed(2)),
        priorite,
        semaine:     semaine_cmd,
      });

      // Accumulation dans la période
      const p = periodes[semaine_cmd - 1];
      if (p) {
        p.besoins_matieres[mat.matiere_id] =
          (p.besoins_matieres[mat.matiere_id] || 0) + qte_reel;
      }

      // Faisabilité immédiate (stock vs besoin commandes uniquement, sans prévision)
      if (Number(mat.stock_actuel) < qte_reel) {
        matieres_manquantes_cmd.push({
          matiere: mat.matiere_titre,
          besoin:  parseFloat(qte_reel.toFixed(2)),
          stock:   Number(mat.stock_actuel),
          manque:  parseFloat((qte_reel - Number(mat.stock_actuel)).toFixed(2)),
        });
      }
    }

    const existing = faisabilite_commandes.find(f => f.commande_id === cmd.id);
    if (!existing) {
      faisabilite_commandes.push({
        commande_id: cmd.id,
        statut:      cmd.statut,
        priorite,
        faisable:    matieres_manquantes_cmd.length === 0,
        matieres_manquantes: matieres_manquantes_cmd,
      });
    } else {
      existing.matieres_manquantes.push(...matieres_manquantes_cmd);
      if (matieres_manquantes_cmd.length > 0) existing.faisable = false;
    }
  }

  // ── 7. Calcul final : besoin_total + quantité à commander ──
  // besoin_total = besoin_commandes (toutes cmds actives) + prévision_mois_prochain
  // quantite_a_commander = besoin_total + stock_securite - stock_actuel (si positif)
  const besoins = Object.values(besoins_map)
    .map(b => {
      const besoin_total      = parseFloat((b.besoin_commandes + b.prevision_mois_prochain).toFixed(2));
      const stock_net         = parseFloat((b.stock_actuel - besoin_total).toFixed(2));
      const quantite_a_commander = stock_net < 0
        ? parseFloat((Math.abs(stock_net) + b.stock_securite).toFixed(2))
        : b.stock_actuel < b.stock_securite
          ? parseFloat((b.stock_securite - b.stock_actuel).toFixed(2))
          : 0;

      // suffisant = stock couvre les commandes immédiates ET la prévision
      const suffisant = stock_net >= 0;

      // suffisant_immediat = stock couvre seulement les commandes actives
      const suffisant_immediat = b.stock_actuel >= b.besoin_commandes;

      return {
        ...b,
        besoin_commandes_brut:   parseFloat(b.besoin_commandes_brut.toFixed(2)),
        besoin_commandes:        parseFloat(b.besoin_commandes.toFixed(2)),
        prevision_mois_prochain: parseFloat(b.prevision_mois_prochain.toFixed(2)),
        besoin_total,
        taux_rebut_moyen:        parseFloat((b.taux_rebut_moyen * 100).toFixed(1)),
        score_urgence:           parseFloat(b.score_urgence.toFixed(2)),
        stock_net,
        quantite_a_commander,
        // rétrocompat
        quantite_besoin_reel:    parseFloat(b.besoin_commandes.toFixed(2)),
        quantite_besoin_brut:    parseFloat(b.besoin_commandes_brut.toFixed(2)),
        quantite_manque:         quantite_a_commander,
        suffisant,
        suffisant_immediat,
      };
    })
    .sort((a, b) => b.score_urgence - a.score_urgence);

  // ── 8. Résumé global ──────────────────────────────────────
  const taux_rebut_global = besoins.length > 0
    ? besoins.reduce((sum, b) => sum + b.taux_rebut_moyen, 0) / besoins.length
    : 0;

  const resume = {
    total_matieres:        besoins.length,
    matieres_ok:           besoins.filter(b => b.suffisant).length,
    matieres_manquantes:   besoins.filter(b => !b.suffisant).length,
    matieres_ok_immediat:  besoins.filter(b => b.suffisant_immediat).length,
    commandes_faisables:   faisabilite_commandes.filter(f => f.faisable).length,
    commandes_bloquees:    faisabilite_commandes.filter(f => !f.faisable).length,
    taux_rebut_moyen:      parseFloat(taux_rebut_global.toFixed(1)),
    commandes_urgentes:    faisabilite_commandes.filter(f => f.priorite === 3).length,
    commandes_normales:    faisabilite_commandes.filter(f => f.priorite === 1).length,
  };

  return {
    besoins,
    commandes_concernees:  Array.from(new Set(commandes.map((c: any) => c.id))),
    faisabilite_commandes: faisabilite_commandes.sort((a, b) => b.priorite - a.priorite),
    resume,
    periodes: periodes.map(p => ({
      semaine:       p.semaine,
      debut:         p.debut,
      fin:           p.fin,
      nb_commandes:  p.commandes_ids.length,
      commandes_ids: p.commandes_ids,
    })),
    calcule_le: new Date().toISOString(),
    methode:    'Time-Phased + Priority-Based + Yield-Based + Prévision historique',
  };
}