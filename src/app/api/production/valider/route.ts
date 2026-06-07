import sql from '@/lib/db';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const {
      ordre_fab_id,
      responsable_id,
      quantite_produite,
      quantite_rebutee = 0,
      observations,
    } = await req.json();

    if (!ordre_fab_id || !responsable_id || !quantite_produite) {
      return Response.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const [ordre] = await sql`
      SELECT of.*, p.nom AS produit_nom
      FROM ordres_fabrication of
      JOIN produits p ON p.id = of.produit_id
      WHERE of.id = ${ordre_fab_id}
    `;
    if (!ordre) return Response.json({ error: 'Ordre introuvable' }, { status: 404 });
    if (ordre.statut === 'termine') return Response.json({ error: 'Ordre déjà terminé' }, { status: 400 });

    const nomenclature = await sql`
      SELECT pm.matiere_id, pm.quantite_necessaire, mp.titre, mp.stock_actuel, mp.unite
      FROM produit_matieres pm
      JOIN matieres_premieres mp ON mp.id = pm.matiere_id
      WHERE pm.produit_id = ${ordre.produit_id}
    `;

    const matieres_consommees = [];
    for (const mat of nomenclature) {
      const qte_a_consommer = Number(mat.quantite_necessaire) * Number(quantite_produite);
      if (Number(mat.stock_actuel) < qte_a_consommer) {
        return Response.json({
          error: `Stock insuffisant pour "${mat.titre}" : disponible ${mat.stock_actuel} ${mat.unite}, nécessaire ${qte_a_consommer} ${mat.unite}`,
        }, { status: 400 });
      }
      matieres_consommees.push({
        matiere_id:    mat.matiere_id,
        titre:         mat.titre,
        qte_consommee: qte_a_consommer,
        unite:         mat.unite,
      });
    }

    for (const mat of matieres_consommees) {
      await sql`UPDATE matieres_premieres SET stock_actuel = stock_actuel - ${mat.qte_consommee} WHERE id = ${mat.matiere_id}`;
      await sql`INSERT INTO mouvements_matieres (matiere_id, type, quantite, raison, ordre_fab_id) VALUES (${mat.matiere_id}, 'sortie', ${mat.qte_consommee}, 'consommation_production', ${ordre_fab_id})`;
      const [mp] = await sql`SELECT stock_actuel, stock_minimum, titre FROM matieres_premieres WHERE id = ${mat.matiere_id}`;
      if (Number(mp.stock_actuel) <= Number(mp.stock_minimum)) {
        await sql`
          INSERT INTO alertes (type, niveau, titre, message, entite_type, entite_id)
          VALUES ('stock_critique', ${Number(mp.stock_actuel) === 0 ? 'danger' : 'warning'},
            ${'Stock bas — ' + mp.titre},
            ${'Stock actuel : ' + mp.stock_actuel + ' / Minimum : ' + mp.stock_minimum},
            'matiere', ${mat.matiere_id})
        `;
      }
    }

    const qte_bonne = Number(quantite_produite) - Number(quantite_rebutee);
    await sql`UPDATE produits SET stock_disponible = stock_disponible + ${qte_bonne} WHERE id = ${ordre.produit_id}`;
    await sql`INSERT INTO mouvements_stock (produit_id, type, quantite, raison, reference_id) VALUES (${ordre.produit_id}, 'entree', ${qte_bonne}, 'production', ${ordre_fab_id})`;
    await sql`
      INSERT INTO stock_etats (produit_id, qte_disponible) VALUES (${ordre.produit_id}, ${qte_bonne})
      ON CONFLICT (produit_id) DO UPDATE SET qte_disponible = stock_etats.qte_disponible + ${qte_bonne}, updated_at = NOW()
    `;

    await sql`UPDATE ordres_fabrication SET statut = 'termine', date_fin = CURRENT_DATE WHERE id = ${ordre_fab_id}`;

    const [validation] = await sql`
      INSERT INTO validations_production (ordre_fab_id, responsable_id, quantite_produite, quantite_rebutee, matieres_consommees, observations)
      VALUES (${ordre_fab_id}, ${responsable_id}, ${quantite_produite}, ${quantite_rebutee}, ${JSON.stringify(matieres_consommees)}::jsonb, ${observations || null})
      RETURNING *
    `;

    await sql`
      INSERT INTO tracabilite (entite_type, entite_id, action, ancien_etat, nouvel_etat, details, utilisateur_id)
      VALUES ('ordre_fabrication', ${ordre_fab_id}, 'validation_production', 'en_cours', 'termine',
        ${'Produit: ' + quantite_produite + ' | Rebuté: ' + quantite_rebutee + ' | Matières: ' + JSON.stringify(matieres_consommees)},
        ${responsable_id})
    `;

    return Response.json({
      success: true,
      validation_id: validation.id,
      quantite_produite,
      quantite_rebutee,
      qte_ajoutee_stock: qte_bonne,
      matieres_consommees,
    });
  } catch (error: any) {
    console.error('[POST /api/production/valider]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}