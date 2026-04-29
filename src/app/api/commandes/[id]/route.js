import sql from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const rows = await sql`
      SELECT c.*, cl.nom as client_nom, cl.email as client_email
      FROM commandes c
      JOIN clients cl ON c.client_id = cl.id
      WHERE c.id = ${id}
    `;

    if (rows.length === 0) {
      return Response.json({ error: 'Commande non trouvee' }, { status: 404 });
    }

    const produits = await sql`
      SELECT cp.*, p.nom as produit_nom
      FROM commande_produits cp
      JOIN produits p ON cp.produit_id = p.id
      WHERE cp.commande_id = ${id}
    `;

    return Response.json({ ...rows[0], produits });
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { statut } = body;

    await sql`UPDATE commandes SET statut = ${statut} WHERE id = ${id}`;

    if (statut === 'confirmee') {
      const produits = await sql`
        SELECT * FROM commande_produits WHERE commande_id = ${id}
      `;
      for (const p of produits) {
        await sql`
          INSERT INTO ordres_fabrication (commande_id, produit_id, quantite, statut)
          VALUES (${id}, ${p.produit_id}, ${p.quantite}, 'planifie')
        `;
      }
      await sql`UPDATE commandes SET statut = 'en_fabrication' WHERE id = ${id}`;
    }

    return Response.json({ message: 'Commande mise a jour' });
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM ordres_fabrication WHERE commande_id = ${id}`;
    await sql`DELETE FROM commande_produits WHERE commande_id = ${id}`;
    await sql`DELETE FROM commandes WHERE id = ${id}`;
    return Response.json({ message: 'Commande supprimee' });
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}