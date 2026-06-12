import sql from '@/lib/db';

export async function GET() {
  try {
    const aujourd_hui = new Date();
    const debutM0 = new Date(aujourd_hui.getFullYear(), aujourd_hui.getMonth(), 1);
    const debutM1 = new Date(aujourd_hui.getFullYear(), aujourd_hui.getMonth() - 1, 1);
    const debutM2 = new Date(aujourd_hui.getFullYear(), aujourd_hui.getMonth() - 2, 1);
    const debutM3 = new Date(aujourd_hui.getFullYear(), aujourd_hui.getMonth() - 3, 1);

    // 1. Tous les produits
    const produits = await sql`
      SELECT id, nom, stock_disponible, stock_minimum, unite, prix_vente
      FROM produits ORDER BY nom ASC
    `;

    // 2. Ventes par produit sur 3 mois (commandes normales)
    const ventes = await sql`
      SELECT
        cp.produit_id,
        SUM(CASE WHEN c.created_at >= ${debutM3.toISOString()} AND c.created_at < ${debutM2.toISOString()} THEN cp.quantite ELSE 0 END) AS vm3,
        SUM(CASE WHEN c.created_at >= ${debutM2.toISOString()} AND c.created_at < ${debutM1.toISOString()} THEN cp.quantite ELSE 0 END) AS vm2,
        SUM(CASE WHEN c.created_at >= ${debutM1.toISOString()} AND c.created_at < ${debutM0.toISOString()} THEN cp.quantite ELSE 0 END) AS vm1,
        SUM(CASE WHEN c.created_at >= ${debutM0.toISOString()} THEN cp.quantite ELSE 0 END) AS vm0
      FROM commande_produits cp
      JOIN commandes c ON c.id = cp.commande_id
      WHERE c.statut != 'annulee'
        AND c.created_at >= ${debutM3.toISOString()}
      GROUP BY cp.produit_id
    `;

    // 3. ✅ NOUVEAU — Besoins urgents détectés par l'admin (manques stock)
    //    Ces besoins représentent une demande RÉELLE non couverte par le stock
    //    → ils doivent peser dans la prévision du mois prochain
    const besoinsUrgents = await sql`
      SELECT
        produit_id,
        SUM(CASE WHEN created_at >= ${debutM3.toISOString()} AND created_at < ${debutM2.toISOString()} THEN quantite ELSE 0 END) AS bu3,
        SUM(CASE WHEN created_at >= ${debutM2.toISOString()} AND created_at < ${debutM1.toISOString()} THEN quantite ELSE 0 END) AS bu2,
        SUM(CASE WHEN created_at >= ${debutM1.toISOString()} AND created_at < ${debutM0.toISOString()} THEN quantite ELSE 0 END) AS bu1,
        SUM(CASE WHEN created_at >= ${debutM0.toISOString()} THEN quantite ELSE 0 END) AS bu0
      FROM mouvements_stock
      WHERE type = 'besoin_production'
        AND created_at >= ${debutM3.toISOString()}
      GROUP BY produit_id
    `;

    // 4. Commandes en cours par produit
    const en_cours = await sql`
      SELECT cp.produit_id, SUM(cp.quantite) AS total_en_cours
      FROM commande_produits cp
      JOIN commandes c ON c.id = cp.commande_id
      WHERE c.statut IN ('en_attente', 'confirmee', 'en_fabrication', 'pret_livraison')
      GROUP BY cp.produit_id
    `;

    const ventesMap: Record<number, any> = {};
    for (const v of ventes) ventesMap[v.produit_id] = v;

    const urgentsMap: Record<number, any> = {};
    for (const u of besoinsUrgents) urgentsMap[u.produit_id] = u;

    const enCoursMap: Record<number, number> = {};
    for (const e of en_cours) enCoursMap[e.produit_id] = Number(e.total_en_cours);

    const moisLabels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const moisActuel = aujourd_hui.getMonth();

    const previsions = produits.map((p: any) => {
      const v = ventesMap[p.id] || { vm1: 0, vm2: 0, vm3: 0, vm0: 0 };
      const u = urgentsMap[p.id] || { bu1: 0, bu2: 0, bu3: 0, bu0: 0 };

      // ✅ Demande réelle = ventes + besoins urgents (manques détectés)
      const vm1 = Number(v.vm1) + Number(u.bu1);
      const vm2 = Number(v.vm2) + Number(u.bu2);
      const vm3 = Number(v.vm3) + Number(u.bu3);
      const vm0 = Number(v.vm0) + Number(u.bu0);

      // Indicateur : ce mois a-t-il eu des urgences ?
      const urgences_ce_mois = Number(u.bu0) > 0;
      const urgences_mois_passe = Number(u.bu1) > 0;

      // Moyenne pondérée exponentielle — mois récents pèsent plus
      // Poids : m3=1, m2=2, m1=3, m0=4 (le plus récent compte le plus)
      const totalPoids = 1 + 2 + 3 + 4;
      const moyPonderee = (vm3 * 1 + vm2 * 2 + vm1 * 3 + vm0 * 4) / totalPoids;
      const moy3mois = Math.round((vm1 + vm2 + vm3) / 3);

      // Tendance basée sur la demande réelle (ventes + urgences)
      const tendance = vm1 > vm2 * 1.15 ? 'hausse' : vm1 < vm2 * 0.85 ? 'baisse' : 'stable';
      let coeff = tendance === 'hausse' ? 1.2 : tendance === 'baisse' ? 0.9 : 1.0;

      // ✅ Marge de sécurité supplémentaire si urgences récentes détectées
      // Le système a dû fabriquer en urgence → on prévoit plus pour éviter ça
      if (urgences_ce_mois) coeff = Math.max(coeff, 1.15);
      if (urgences_mois_passe) coeff = Math.max(coeff, 1.1);

      // Prévision = moyenne pondérée × coefficient
      const prevision = Math.ceil(moyPonderee * coeff);

      // Stock après commandes en cours
      const total_en_cours = enCoursMap[p.id] || 0;
      const stock_apres    = Number(p.stock_disponible) - total_en_cours;

      // Quantité à produire en avance
      const a_produire = Math.max(0, prevision + Number(p.stock_minimum) - Math.max(0, stock_apres));

      // Urgence
      const urgence = a_produire > 0
        ? stock_apres < 0 ? 'critique' : stock_apres < prevision * 0.5 ? 'eleve' : 'normal'
        : 'ok';

      return {
        produit_id:          p.id,
        produit_nom:         p.nom,
        unite:               p.unite,
        stock_actuel:        Number(p.stock_disponible),
        stock_minimum:       Number(p.stock_minimum),
        total_en_cours,
        stock_apres,
        vm0, vm1, vm2, vm3,
        moy3mois,
        tendance,
        coeff,
        prevision,
        a_produire,
        urgence,
        // ✅ Infos urgences pour l'affichage
        urgences_ce_mois,
        urgences_mois_passe,
        besoins_urgents_m0:  Number(u.bu0),
        besoins_urgents_m1:  Number(u.bu1),
        mois_labels: {
          m3: moisLabels[(moisActuel - 3 + 12) % 12],
          m2: moisLabels[(moisActuel - 2 + 12) % 12],
          m1: moisLabels[(moisActuel - 1 + 12) % 12],
          m0: moisLabels[moisActuel],
        }
      };
    });

    // Trier par urgence puis par a_produire
    const ordre_urgence: Record<string, number> = { critique: 0, eleve: 1, normal: 2, ok: 3 };
    previsions.sort((a: any, b: any) => {
      const diff = ordre_urgence[a.urgence] - ordre_urgence[b.urgence];
      return diff !== 0 ? diff : b.a_produire - a.a_produire;
    });

    const resume = {
      total_produits:   previsions.length,
      a_produire:       previsions.filter((p: any) => p.a_produire > 0).length,
      critique:         previsions.filter((p: any) => p.urgence === 'critique').length,
      ok:               previsions.filter((p: any) => p.urgence === 'ok').length,
      tendance_hausse:  previsions.filter((p: any) => p.tendance === 'hausse').length,
      tendance_baisse:  previsions.filter((p: any) => p.tendance === 'baisse').length,
      // ✅ Nouveau — produits ayant eu des urgences ce mois
      avec_urgences:    previsions.filter((p: any) => p.urgences_ce_mois || p.urgences_mois_passe).length,
    };

    return Response.json({ previsions, resume, calcule_le: new Date().toISOString() });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}