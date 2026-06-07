import sql from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const rows = await sql`
      SELECT mp.*,
        CASE
          WHEN mp.stock_actuel = 0                       THEN 'rupture'
          WHEN mp.stock_actuel <= mp.stock_minimum       THEN 'critique'
          WHEN mp.stock_actuel <= mp.stock_minimum * 1.5 THEN 'bas'
          ELSE 'ok'
        END AS etat_stock
      FROM matieres_premieres mp
      ORDER BY mp.titre ASC
    `;
    return Response.json(rows);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { titre, unite, stock_actuel, stock_minimum, cout_unitaire, fournisseur } = await req.json();
    if (!titre) return Response.json({ error: 'Le titre est requis' }, { status: 400 });

    const [matiere] = await sql`
      INSERT INTO matieres_premieres (titre, unite, stock_actuel, stock_minimum, cout_unitaire, fournisseur)
      VALUES (${titre}, ${unite || 'unités'}, ${stock_actuel || 0}, ${stock_minimum || 5}, ${cout_unitaire || 0}, ${fournisseur || null})
      RETURNING *
    `;

    if (Number(stock_actuel) > 0) {
      await sql`INSERT INTO mouvements_matieres (matiere_id, type, quantite, raison) VALUES (${matiere.id}, 'entree', ${stock_actuel}, 'stock_initial')`;
    }

    return Response.json(matiere, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, nouveau_stock, quantite, operation, raison } = await req.json();
    if (id === undefined) return Response.json({ error: 'id requis' }, { status: 400 });

    let updated;

    if (nouveau_stock !== undefined) {
      const [current] = await sql`SELECT stock_actuel FROM matieres_premieres WHERE id = ${id}`;
      const delta = Number(nouveau_stock) - Number(current.stock_actuel);
      ;[updated] = await sql`UPDATE matieres_premieres SET stock_actuel = ${nouveau_stock} WHERE id = ${id} RETURNING *`;
      await sql`INSERT INTO mouvements_matieres (matiere_id, type, quantite, raison) VALUES (${id}, ${delta >= 0 ? 'entree' : 'sortie'}, ${Math.abs(delta)}, ${raison || 'ajustement_manuel'})`;
    } else if (quantite !== undefined && operation) {
      const delta = operation === 'sortie' ? -Number(quantite) : Number(quantite);
      ;[updated] = await sql`UPDATE matieres_premieres SET stock_actuel = stock_actuel + ${delta} WHERE id = ${id} RETURNING *`;
      await sql`INSERT INTO mouvements_matieres (matiere_id, type, quantite, raison) VALUES (${id}, ${operation}, ${quantite}, ${raison || 'ajustement_manuel'})`;
    } else {
      return Response.json({ error: 'nouveau_stock ou (quantite + operation) requis' }, { status: 400 });
    }

    return Response.json({ success: true, data: updated });
  } catch (error: any) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'id requis' }, { status: 400 });
    await sql`DELETE FROM matieres_premieres WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}