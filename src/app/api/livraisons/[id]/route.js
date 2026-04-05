import pool from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { statut, date_livraison } = body;

    await pool.query(
      'UPDATE livraisons SET statut=?, date_livraison=? WHERE id=?',
      [statut, date_livraison, id]
    );

    if (statut === 'livree') {
      const [livraison] = await pool.query(
        'SELECT * FROM livraisons WHERE id=?', [id]
      );
      await pool.query(
        'UPDATE commandes SET statut="livree" WHERE id=?',
        [livraison[0].commande_id]
      );
    }

    return Response.json({ message: 'Livraison mise à jour' });
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await pool.query('DELETE FROM livraisons WHERE id=?', [id]);
    return Response.json({ message: 'Livraison supprimée' });
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}