import sql from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM produits ORDER BY created_at DESC`;
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      nom, description, categorie, unite,
      cout_matieres_premieres, cout_fabrication,
      marge_base, stock_disponible, stock_minimum,
    } = body;

    const cout_total = parseFloat(cout_matieres_premieres || 0) + parseFloat(cout_fabrication || 0);

    // Calcul prix dynamique
    const prixRes = await fetch(`${process.env.NEXTAUTH_URL}/api/produits/prix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cout_matieres_premieres, cout_fabrication, categorie, marge_base }),
    });
    const prixData = await prixRes.json();

    await sql`
      INSERT INTO produits 
        (nom, description, categorie, unite, cout_matieres_premieres, cout_fabrication,
         cout_total, marge_base, marge_dynamique, prix_vente, stock_disponible, stock_minimum)
      VALUES 
        (${nom}, ${description}, ${categorie}, ${unite || 'unité'},
         ${cout_matieres_premieres || 0}, ${cout_fabrication || 0},
         ${cout_total}, ${marge_base || 20}, ${prixData.marge_dynamique}, ${prixData.prix_vente},
         ${stock_disponible || 0}, ${stock_minimum || 10})
    `;

    return Response.json({ success: true, prix: prixData }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}