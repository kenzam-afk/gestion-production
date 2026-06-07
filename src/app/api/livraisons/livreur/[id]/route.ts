import sql from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const rows = await sql`
      SELECT l.*, c.total AS commande_total, c.statut AS commande_statut,
        CASE WHEN cl.type_client = 'entreprise' THEN cl.titre ELSE CONCAT(cl.prenom, ' ', cl.nom) END AS client_nom,
        cl.telephone AS client_telephone, cl.adresse AS client_adresse
      FROM livraisons l
      JOIN commandes c  ON c.id  = l.commande_id
      JOIN clients   cl ON cl.id = c.client_id
      WHERE l.livreur_id = ${id}
      ORDER BY l.created_at DESC
    `;

    return Response.json(Array.isArray(rows) ? rows : []);
  } catch (error: any) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM utilisateurs WHERE id = ${id} AND role = 'livreur'`;
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}