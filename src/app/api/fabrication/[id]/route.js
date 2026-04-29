import sql from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { statut, date_debut, date_fin } = body;

    await sql`
      UPDATE ordres_fabrication
      SET statut=${statut}, date_debut=${date_debut || null}, date_fin=${date_fin || null}
      WHERE id=${id}
    `;

    if (statut === 'termine') {
      const ordre = await sql`SELECT * FROM ordres_fabrication WHERE id = ${id}`;

      await sql`
        UPDATE produits 
        SET stock = stock + ${ordre[0].quantite} 
        WHERE id = ${ordre[0].produit_id}
      `;

      const autresOrdres = await sql`
        SELECT * FROM ordres_fabrication
        WHERE commande_id = ${ordre[0].commande_id} AND statut != 'termine'
      `;

      if (autresOrdres.length === 0) {
        await sql`
          UPDATE commandes SET statut = 'livree' WHERE id = ${ordre[0].commande_id}
        `;
      }
    }

    return Response.json({ message: 'Ordre mis a jour' });
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}