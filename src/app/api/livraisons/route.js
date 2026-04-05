import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT l.*, c.total as commande_total
      FROM livraisons l
      JOIN commandes c ON l.commande_id = c.id
      ORDER BY l.created_at DESC
    `);
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { commande_id, livreur_id, adresse } = body;

    const [result] = await pool.query(
      'INSERT INTO livraisons (commande_id, livreur_id, adresse, statut) VALUES (?, ?, ?, "en_attente")',
      [commande_id, livreur_id, adresse]
    );

    return Response.json({ id: result.insertId, message: 'Livraison créée avec succès' }, { status: 201 });
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}