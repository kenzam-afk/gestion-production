import sql from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const rows = await sql`SELECT * FROM clients WHERE id = ${id}`;
    if (rows.length === 0) {
      return Response.json({ error: 'Client non trouve' }, { status: 404 });
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
    const { nom, email, telephone, adresse } = body;

    await sql`
      UPDATE clients 
      SET nom=${nom}, email=${email}, telephone=${telephone}, adresse=${adresse}
      WHERE id=${id}
    `;

    return Response.json({ message: 'Client modifie' });
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await sql`
      DELETE FROM commande_produits 
      WHERE commande_id IN (SELECT id FROM commandes WHERE client_id = ${id})
    `;
    await sql`
      DELETE FROM ordres_fabrication 
      WHERE commande_id IN (SELECT id FROM commandes WHERE client_id = ${id})
    `;
    await sql`DELETE FROM commandes WHERE client_id = ${id}`;
    await sql`DELETE FROM clients WHERE id = ${id}`;
    return Response.json({ message: 'Client supprime' });
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}