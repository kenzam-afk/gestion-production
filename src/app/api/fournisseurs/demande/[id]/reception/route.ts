import sql from '@/lib/db';

// ─── POST /api/fournisseur/demandes/[id]/reception ───────────
// Confirme la réception physique des matières premières
// → met à jour le stock + traçabilité + alerte
export async function POST(req, { params }) {
  try {
    const { id }                    = params;
    const { quantite_recue, notes } = await req.json();

    // 1. Récupérer la demande
    const [demande] = await sql`
      SELECT da.*, mp.titre AS matiere_titre, mp.unite
      FROM demandes_appro da
      JOIN matieres_premieres mp ON mp.id = da.matiere_id
      WHERE da.id = ${id}
    `;
    if (!demande) return Response.json({ error: 'Demande introuvable' }, { status: 404 });

    const qte = parseFloat(quantite_recue) || Number(demande.quantite);

    // 2. Mettre à jour le stock matière première
    const [matiere] = await sql`
      UPDATE matieres_premieres
      SET stock_actuel = stock_actuel + ${qte}
      WHERE id = ${demande.matiere_id}
      RETURNING *
    `;

    // 3. Enregistrer le mouvement
    await sql`
      INSERT INTO mouvements_matieres (matiere_id, type, quantite, raison)
      VALUES (${demande.matiere_id}, 'entree', ${qte}, ${'reception_fournisseur — ' + (notes || '')})
    `;

    // 4. Marquer la demande comme reçue
    await sql`
      UPDATE demandes_appro
      SET statut = 'recue', updated_at = NOW(), notes = ${notes || null}
      WHERE id = ${id}
    `;

    // 5. Marquer le plan MRP comme reçu si lié
    if (demande.mrp_plan_id) {
      await sql`
        UPDATE mrp_plans SET statut = 'recu', updated_at = NOW()
        WHERE id = ${demande.mrp_plan_id}
      `;
    }

    // 6. Traçabilité
    await sql`
      INSERT INTO tracabilite (entite_type, entite_id, action, ancien_etat, nouvel_etat, details)
      VALUES (
        'demande_appro', ${id}, 'reception',
        'expediee', 'recue',
        ${'Reçu: ' + qte + ' ' + demande.unite + ' de ' + demande.matiere_titre + (notes ? ' — ' + notes : '')}
      )
    `;

    // 7. Alerte si stock toujours bas après réception
    if (Number(matiere.stock_actuel) <= Number(matiere.stock_minimum)) {
      await sql`
        INSERT INTO alertes (type, niveau, titre, message, entite_type, entite_id)
        VALUES (
          'stock_critique', 'warning',
          ${'Stock encore bas après réception — ' + demande.matiere_titre},
          ${'Stock actuel : ' + matiere.stock_actuel + ' / Minimum : ' + matiere.stock_minimum},
          'matiere', ${demande.matiere_id}
        )
      `;
    } else {
      // Stock OK → résoudre les alertes liées
      await sql`
        UPDATE alertes SET resolu = true, resolu_at = NOW()
        WHERE entite_type = 'matiere' AND entite_id = ${demande.matiere_id}
          AND resolu = false
      `;
    }

    // 8. Alerte admin : réception confirmée
    await sql`
      INSERT INTO alertes (type, niveau, titre, message, entite_type, entite_id)
      VALUES (
        'appro', 'info',
        ${'Réception confirmée — ' + demande.matiere_titre},
        ${'Quantité reçue : ' + qte + ' ' + demande.unite + ' | Nouveau stock : ' + matiere.stock_actuel},
        'demande_appro', ${id}
      )
    `;

    return Response.json({
      success:        true,
      quantite_recue: qte,
      nouveau_stock:  matiere.stock_actuel,
    });

  } catch (error) {
    console.error('[POST /api/fournisseur/demandes/[id]/reception]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}