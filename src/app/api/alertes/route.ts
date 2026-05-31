import sql from '@/lib/db';

export async function GET() {
  try {
    const alertes = [];

    // ── 1. Stock critique matières premières ─────────────────
    const matieres = await sql`
      SELECT titre, stock_actuel, stock_minimum
      FROM matieres_premieres
      WHERE stock_actuel <= stock_minimum AND stock_minimum > 0
      ORDER BY (stock_actuel::float / NULLIF(stock_minimum, 0)) ASC
    `;

    for (const m of matieres) {
      const estRupture = Number(m.stock_actuel) === 0;
      alertes.push({
        type:   estRupture ? 'stock_rupture' : 'stock_critique',
        niveau: estRupture ? 'danger' : 'warning',
        titre:  estRupture
          ? `Rupture de stock — ${m.titre}`
          : `Stock critique — ${m.titre}`,
        detail: `Stock actuel : ${m.stock_actuel} · Minimum requis : ${m.stock_minimum}`,
        lien:   '/admin/matieres-premieres',
      });
    }

    // ── 2. Stock critique produits finis ──────────────────────
    const produits = await sql`
      SELECT nom, stock_disponible, stock_minimum
      FROM produits
      WHERE stock_disponible <= stock_minimum AND stock_minimum > 0
      ORDER BY stock_disponible ASC
    `;

    for (const p of produits) {
      const estRupture = Number(p.stock_disponible) === 0;
      alertes.push({
        type:   estRupture ? 'stock_rupture' : 'stock_critique',
        niveau: estRupture ? 'danger' : 'warning',
        titre:  estRupture
          ? `Rupture produit — ${p.nom}`
          : `Stock bas — ${p.nom}`,
        detail: `Stock : ${p.stock_disponible} · Min : ${p.stock_minimum}`,
        lien:   '/admin/stock',
      });
    }

    // ── 3. Commandes en retard — en attente depuis +3 jours ───
    const commandesAttente = await sql`
      SELECT
        c.id,
        CASE
          WHEN cl.type_client = 'entreprise' THEN cl.titre
          ELSE CONCAT(cl.prenom, ' ', cl.nom)
        END AS client_nom,
        EXTRACT(DAY FROM NOW() - c.created_at)::int AS jours
      FROM commandes c
      LEFT JOIN clients cl ON cl.id = c.client_id
      WHERE c.statut = 'en_attente'
        AND c.created_at < NOW() - INTERVAL '3 days'
      ORDER BY c.created_at ASC
    `;

    for (const c of commandesAttente) {
      alertes.push({
        type:   'commande_retard',
        niveau: c.jours >= 7 ? 'danger' : 'warning',
        titre:  `Commande #${c.id} non confirmée`,
        detail: `${c.client_nom} · En attente depuis ${c.jours} jour${c.jours > 1 ? 's' : ''} sans confirmation`,
        lien:   '/admin/commandes',
      });
    }

    // ── 4. Commandes confirmées mais pas en fabrication +3j ───
    const commandesConfirmees = await sql`
      SELECT
        c.id,
        CASE
          WHEN cl.type_client = 'entreprise' THEN cl.titre
          ELSE CONCAT(cl.prenom, ' ', cl.nom)
        END AS client_nom,
        EXTRACT(DAY FROM NOW() - c.updated_at)::int AS jours
      FROM commandes c
      LEFT JOIN clients cl ON cl.id = c.client_id
      WHERE c.statut = 'confirmee'
        AND c.updated_at < NOW() - INTERVAL '3 days'
      ORDER BY c.updated_at ASC
    `;

    for (const c of commandesConfirmees) {
      alertes.push({
        type:   'fabrication_retard',
        niveau: c.jours >= 7 ? 'danger' : 'warning',
        titre:  `Commande #${c.id} — fabrication non démarrée`,
        detail: `${c.client_nom} · Confirmée depuis ${c.jours} jour${c.jours > 1 ? 's' : ''} sans lancer la fabrication`,
        lien:   '/admin/fabrication',
      });
    }

    // Trier — danger en premier
    alertes.sort((a, b) => {
      if (a.niveau === 'danger' && b.niveau !== 'danger') return -1;
      if (b.niveau === 'danger' && a.niveau !== 'danger') return 1;
      return 0;
    });

    return Response.json(alertes);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}