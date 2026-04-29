import sql from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`
      SELECT c.*, 
        CASE 
          WHEN cl.type_client = 'entreprise' THEN cl.titre
          ELSE CONCAT(cl.prenom, ' ', cl.nom)
        END as client_nom
      FROM commandes c
      JOIN clients cl ON c.client_id = cl.id
      ORDER BY c.created_at DESC
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
    const { client_id, produits } = body;

    const commandeResult = await sql`
      INSERT INTO commandes (client_id, statut, total)
      VALUES (${client_id}, 'en_attente', 0)
      RETURNING id
    `;

    const commande_id = commandeResult[0].id;
    let total = 0;

    for (const p of produits) {
      await sql`
        INSERT INTO commande_produits (commande_id, produit_id, quantite, prix_unitaire)
        VALUES (${commande_id}, ${p.produit_id}, ${p.quantite}, ${p.prix_unitaire})
      `;
      total += p.quantite * p.prix_unitaire;
    }

    await sql`UPDATE commandes SET total = ${total} WHERE id = ${commande_id}`;

    return Response.json({ id: commande_id, message: 'Commande creee' }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}