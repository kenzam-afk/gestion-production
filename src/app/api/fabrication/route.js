import sql from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`
      SELECT ord.*, p.nom as produit_nom, c.id as commande_ref
      FROM ordres_fabrication ord
      JOIN produits p ON ord.produit_id = p.id
      JOIN commandes c ON ord.commande_id = c.id
      ORDER BY ord.created_at DESC
    `;
    return Response.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    console.error(error);
    return Response.json([], { status: 200 });
  }
}