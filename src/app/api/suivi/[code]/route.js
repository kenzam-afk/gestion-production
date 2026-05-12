import sql from '@/lib/db';
import { getServerSession } from "next-auth/next";

export async function GET(req, { params }) {
  try {
    const session = await getServerSession();
    if (!session) return Response.json({ error: "Connectez-vous pour voir le suivi" }, { status: 401 });

    const { code } = params;

    const suivi = await sql`
      SELECT c.statut, c.created_at, p.nom as produit_nom, c.code_suivi
      FROM commandes c
      JOIN commande_produits cp ON cp.commande_id = c.id
      JOIN produits p ON p.id = cp.produit_id
      WHERE c.code_suivi = ${code} AND c.client_id = ${session.user.id}
    `;

    if (suivi.length === 0) {
      return Response.json({ error: "Code de suivi invalide ou commande introuvable" }, { status: 404 });
    }

    return Response.json(suivi[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}