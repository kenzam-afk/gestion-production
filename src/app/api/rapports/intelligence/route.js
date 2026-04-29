import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {

    // ── 1. Données brutes ────────────────────────────────────────────────────
    const [commandes, produits, clients] = await Promise.all([
      sql`
        SELECT c.*,
          CASE
            WHEN cl.type_client = 'entreprise' THEN cl.titre
            ELSE CONCAT(cl.prenom, ' ', cl.nom)
          END as client_nom
        FROM commandes c
        JOIN clients cl ON c.client_id = cl.id
        ORDER BY c.created_at DESC
      `,
      sql`SELECT * FROM produits ORDER BY created_at DESC`,
      sql`SELECT * FROM clients`,
    ]);

    // ── 2. KPIs ──────────────────────────────────────────────────────────────
    const chiffreAffaires = commandes
      .filter(c => c.statut === 'livree')
      .reduce((acc, c) => acc + parseFloat(c.total || '0'), 0);

    // ── 3. Best-sellers (30 derniers jours) ──────────────────────────────────
    const bestSellersRaw = await sql`
      SELECT
        p.id            AS produit_id,
        p.nom,
        COUNT(cp.commande_id)::int        AS total_commandes,
        COALESCE(SUM(cp.quantite), 0)::int AS total_quantite
      FROM produits p
      LEFT JOIN commande_produits cp ON cp.produit_id = p.id
      LEFT JOIN commandes c ON c.id = cp.commande_id
        AND c.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY p.id, p.nom
      ORDER BY total_commandes DESC
      LIMIT 8
    `;

    const bestSellersPrevRaw = await sql`
      SELECT
        p.id AS produit_id,
        COUNT(cp.commande_id)::int AS total_commandes
      FROM produits p
      LEFT JOIN commande_produits cp ON cp.produit_id = p.id
      LEFT JOIN commandes c ON c.id = cp.commande_id
        AND c.created_at >= NOW() - INTERVAL '60 days'
        AND c.created_at <  NOW() - INTERVAL '30 days'
      GROUP BY p.id
    `;

    const prevMap = new Map(
      bestSellersPrevRaw.map(r => [Number(r.produit_id), Number(r.total_commandes)])
    );

    const bestSellers = bestSellersRaw.map(r => {
      const curr = Number(r.total_commandes);
      const prev = prevMap.get(Number(r.produit_id)) || 0;
      const evolution_pct = prev === 0
        ? (curr > 0 ? 100 : 0)
        : Math.round(((curr - prev) / prev) * 100);
      return {
        produit_id:      Number(r.produit_id),
        nom:             r.nom,
        total_commandes: curr,
        total_quantite:  Number(r.total_quantite),
        evolution_pct,
      };
    });

    // ── 4. Commandes par statut ───────────────────────────────────────────────
    const statutsRaw = await sql`
      SELECT statut, COUNT(*)::int AS count
      FROM commandes
      GROUP BY statut
      ORDER BY count DESC
    `;
    const commandesParStatut = statutsRaw.map(r => ({
      statut: r.statut,
      count:  Number(r.count),
    }));

    // ── 5. Stock critique ─────────────────────────────────────────────────────
    const stockCritiqueRaw = await sql`
      SELECT
        p.id,
        p.nom,
        p.stock_disponible,
        p.stock_minimum,
        p.categorie,
        COALESCE(SUM(cp.quantite), 0)::int AS vendu_30j
      FROM produits p
      LEFT JOIN commande_produits cp ON cp.produit_id = p.id
      LEFT JOIN commandes c ON c.id = cp.commande_id
        AND c.created_at >= NOW() - INTERVAL '30 days'
        AND c.statut NOT IN ('annulee')
      WHERE p.stock_disponible <= p.stock_minimum
      GROUP BY p.id, p.nom, p.stock_disponible, p.stock_minimum, p.categorie
      ORDER BY (p.stock_disponible::float / NULLIF(p.stock_minimum, 0)) ASC
    `;

    const stockCritique = stockCritiqueRaw.map(r => {
      const vendu    = Number(r.vendu_30j);
      const parJour  = vendu / 30;
      const jours_restants = parJour > 0
        ? Math.round(Number(r.stock_disponible) / parJour)
        : null;
      return {
        id:               Number(r.id),
        nom:              r.nom,
        stock_disponible: Number(r.stock_disponible),
        stock_minimum:    Number(r.stock_minimum),
        jours_restants,
        categorie:        r.categorie || '',
      };
    });

    // ── 6. Stock surplus (≥ 3× le minimum) ───────────────────────────────────
    const stockSurplusRaw = await sql`
      SELECT id, nom, stock_disponible, stock_minimum
      FROM produits
      WHERE stock_minimum > 0
        AND stock_disponible >= (stock_minimum * 3)
      ORDER BY (stock_disponible::float / stock_minimum) DESC
      LIMIT 6
    `;

    const stockSurplus = stockSurplusRaw.map(r => ({
      id:               Number(r.id),
      nom:              r.nom,
      stock_disponible: Number(r.stock_disponible),
      stock_minimum:    Number(r.stock_minimum),
      ratio_surplus:    Number(r.stock_disponible) / Number(r.stock_minimum),
    }));

    // ── 7. Score santé stock ──────────────────────────────────────────────────
    const totalProduits = produits.length;
    const produitsOk    = produits.filter(p => Number(p.stock_disponible) > Number(p.stock_minimum)).length;
    const scoreStockPct = totalProduits > 0 ? Math.round((produitsOk / totalProduits) * 100) : 100;

    // ── 8. Rotation stock ─────────────────────────────────────────────────────
    const valeurStock = produits.reduce(
      (acc, p) => acc + Number(p.stock_disponible || 0) * Number(p.cout_total || 0), 0
    );
    const rotationStock = valeurStock > 0
      ? Math.round((chiffreAffaires / valeurStock) * 10) / 10
      : 0;

    // ── 9. Dernières commandes ────────────────────────────────────────────────
    const dernieresCommandes = commandes.slice(0, 6).map(c => ({
      id:         c.id,
      client_nom: c.client_nom,
      statut:     c.statut,
      total:      parseFloat(c.total || '0'),
      created_at: c.created_at,
    }));

    // ── Réponse ───────────────────────────────────────────────────────────────
    return NextResponse.json({
      kpis: {
        chiffreAffaires: Math.round(chiffreAffaires),
        totalCommandes:  commandes.length,
        totalProduits,
        totalClients:    clients.length,
        rotationStock,
        scoreStockPct,
      },
      bestSellers,
      commandesParStatut,
      stockCritique,
      stockSurplus,
      dernieresCommandes,
    });

  } catch (error) {
    console.error('[/api/rapports/intelligence] Erreur:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}