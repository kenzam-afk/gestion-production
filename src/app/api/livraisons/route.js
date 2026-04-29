import sql from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`
      SELECT l.*, c.total as commande_total,
        CASE 
          WHEN cl.type_client = 'entreprise' THEN cl.titre
          ELSE CONCAT(cl.prenom, ' ', cl.nom)
        END as client_nom,
        u.nom as livreur_nom
      FROM livraisons l
      JOIN commandes c ON l.commande_id = c.id
      JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN utilisateurs u ON l.livreur_id = u.id
      ORDER BY l.created_at DESC
    `;
    return Response.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    console.error(error);
    return Response.json([], { status: 200 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { commande_id, livreur_id, adresse } = body;

    const result = await sql`
      INSERT INTO livraisons (commande_id, livreur_id, adresse, statut)
      VALUES (${commande_id}, ${livreur_id || null}, ${adresse}, 'en_attente')
      RETURNING id
    `;

    return Response.json({ id: result[0].id, message: 'Livraison creee' }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}