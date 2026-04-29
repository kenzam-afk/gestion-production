import sql from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const rows = await sql`SELECT * FROM produits WHERE id = ${id}`;
    if (rows.length === 0) {
      return Response.json({ error: 'Produit non trouve' }, { status: 404 });
    }
    return Response.json(rows[0]);
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nom, description, prix, stock, stock_minimum, cout_production, categorie_id } = body;

    await sql`
      UPDATE produits 
      SET nom=${nom}, description=${description}, prix=${prix},
          stock=${stock}, stock_minimum=${stock_minimum},
          cout_production=${cout_production}, categorie_id=${categorie_id || null}
      WHERE id=${id}
    `;

    return Response.json({ message: 'Produit modifie' });
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM commande_produits WHERE produit_id = ${id}`;
    await sql`DELETE FROM ordres_fabrication WHERE produit_id = ${id}`;
    await sql`DELETE FROM produits WHERE id = ${id}`;
    return Response.json({ message: 'Produit supprime' });
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}