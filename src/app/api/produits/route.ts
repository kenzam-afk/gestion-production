import sql from '@/lib/db';

// ─── GET : liste tous les produits avec leurs matières premières ───
export async function GET() {
  try {
    const produits = await sql`
      SELECT * FROM produits ORDER BY nom ASC
    `;

    const produitsAvecMatieres = await Promise.all(
      produits.map(async (p: any) => {
        const matieres = await sql`
          SELECT
            pm.matiere_id,
            pm.quantite_necessaire,
            mp.titre,
            mp.unite,
            mp.stock_actuel
          FROM produit_matieres pm
          JOIN matieres_premieres mp ON mp.id = pm.matiere_id
          WHERE pm.produit_id = ${p.id}
        `;
        return { ...p, matieres };
      })
    );

    return Response.json(produitsAvecMatieres);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST : créer un produit avec calcul de prix dynamique ───
export async function POST(req: Request) {
  try {
    const body = await req.json();
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
  } catch (error: any) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}