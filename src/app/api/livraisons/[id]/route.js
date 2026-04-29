import sql from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { statut, date_livraison, raison_echec } = body;

    await sql`
      UPDATE livraisons
      SET statut=${statut}, date_livraison=${date_livraison || null}, raison_echec=${raison_echec || null}
      WHERE id=${id}
    `;

    if (statut === 'livree') {
      const livraison = await sql`SELECT * FROM livraisons WHERE id = ${id}`;
      await sql`
        UPDATE commandes SET statut = 'livree' WHERE id = ${livraison[0].commande_id}
      `;
    }

    return Response.json({ message: 'Livraison mise a jour' });
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM livraisons WHERE id = ${id}`;
    return Response.json({ message: 'Livraison supprimee' });
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}