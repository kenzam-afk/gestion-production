import sql from '@/lib/db';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id }                    = await params;
    const { quantite_recue, notes } = await req.json();

    const [demande] = await sql`
      SELECT da.*, mp.titre AS matiere_titre, mp.unite
      FROM demandes_appro da
      JOIN matieres_premieres mp ON mp.id = da.matiere_id
      WHERE da.id = ${id}
    `;
    if (!demande) return Response.json({ error: 'Demande introuvable' }, { status: 404 });

    const qte = parseFloat(quantite_recue) || Number(demande.quantite);

    const [matiere] = await sql`
      UPDATE matieres_premieres
      SET stock_actuel = stock_actuel + ${qte}
      WHERE id = ${demande.matiere_id}
      RETURNING *
    `;

    await sql`
      INSERT INTO mouvements_matieres (matiere_id, type, quantite, raison)
      VALUES (${demande.matiere_id}, 'entree', ${qte}, ${'reception_fournisseur — ' + (notes || '')})
    `;

    await sql`
      UPDATE demandes_appro
      SET statut = 'recue', updated_at = NOW(), notes = ${notes || null}
      WHERE id = ${id}
    `;

    if (demande.mrp_plan_id) {
      await sql`UPDATE mrp_plans SET statut = 'recu', updated_at = NOW() WHERE id = ${demande.mrp_plan_id}`;
    }

    await sql`
      INSERT INTO tracabilite (entite_type, entite_id, action, ancien_etat, nouvel_etat, details)
      VALUES ('demande_appro', ${id}, 'reception', 'expediee', 'recue',
        ${'Reçu: ' + qte + ' ' + demande.unite + ' de ' + demande.matiere_titre + (notes ? ' — ' + notes : '')})
    `;

    if (Number(matiere.stock_actuel) <= Number(matiere.stock_minimum)) {
      await sql`
        INSERT INTO alertes (type, niveau, titre, message, entite_type, entite_id)
        VALUES ('stock_critique', 'warning',
          ${'Stock encore bas après réception — ' + demande.matiere_titre},
          ${'Stock actuel : ' + matiere.stock_actuel + ' / Minimum : ' + matiere.stock_minimum},
          'matiere', ${demande.matiere_id})
      `;
    } else {
      await sql`UPDATE alertes SET resolu = true, resolu_at = NOW() WHERE entite_type = 'matiere' AND entite_id = ${demande.matiere_id} AND resolu = false`;
    }

    await sql`
      INSERT INTO alertes (type, niveau, titre, message, entite_type, entite_id)
      VALUES ('appro', 'info',
        ${'Réception confirmée — ' + demande.matiere_titre},
        ${'Quantité reçue : ' + qte + ' ' + demande.unite + ' | Nouveau stock : ' + matiere.stock_actuel},
        'demande_appro', ${id})
    `;

    return Response.json({ success: true, quantite_recue: qte, nouveau_stock: matiere.stock_actuel });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}