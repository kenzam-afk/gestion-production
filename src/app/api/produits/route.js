import sql from '@/lib/db';

// ─── GET : tous les produits avec état stock ─────────────────
export async function GET() {
  try {
    const rows = await sql`
      SELECT
        p.*,
        CASE
          WHEN p.stock_disponible = 0                        THEN 'rupture'
          WHEN p.stock_disponible <= p.stock_minimum         THEN 'critique'
          WHEN p.stock_disponible <= p.stock_minimum * 1.5   THEN 'bas'
          ELSE 'ok'
        END AS etat_stock
      FROM produits p
      ORDER BY p.created_at DESC
    `;
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ─── POST : créer un produit ─────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      nom, description, categorie, unite,
      cout_matieres_premieres, cout_fabrication,
      marge_base, stock_disponible, stock_minimum,
    } = body;

    if (!nom) {
      return Response.json({ error: 'Le nom est requis' }, { status: 400 });
    }

    const cmp       = parseFloat(cout_matieres_premieres || 0);
    const cfab      = parseFloat(cout_fabrication || 0);
    const cout_total = cmp + cfab;
    const marge      = parseFloat(marge_base || 20);
    const prix_vente = cout_total * (1 + marge / 100);

    const [produit] = await sql`
      INSERT INTO produits (
        nom, description, categorie, unite,
        cout_matieres_premieres, cout_fabrication, cout_total,
        marge_base, marge_dynamique, prix_vente,
        stock_disponible, stock_minimum
      ) VALUES (
        ${nom}, ${description || null}, ${categorie || null}, ${unite || 'unité'},
        ${cmp}, ${cfab}, ${cout_total},
        ${marge}, ${marge}, ${prix_vente},
        ${parseInt(stock_disponible || 0)}, ${parseInt(stock_minimum || 10)}
      )
      RETURNING *
    `;

    // Enregistrer le stock initial comme mouvement
    if (parseInt(stock_disponible || 0) > 0) {
      await sql`
        INSERT INTO mouvements_stock (produit_id, type, quantite, raison)
        VALUES (${produit.id}, 'entree', ${parseInt(stock_disponible)}, 'stock_initial')
      `;
    }

    return Response.json({ success: true, produit, prix_vente }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}