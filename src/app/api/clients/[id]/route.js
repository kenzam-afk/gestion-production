import sql from '@/lib/db';

// ─── GET : un client avec ses commandes ─────────────────────
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const [client] = await sql`
      SELECT c.*,
        COUNT(cmd.id)            AS total_commandes,
        COALESCE(SUM(cmd.total), 0) AS chiffre_affaires
      FROM clients c
      LEFT JOIN commandes cmd ON cmd.client_id = c.id
      WHERE c.id = ${id}
      GROUP BY c.id
    `;
    if (!client) return Response.json({ error: 'Client introuvable' }, { status: 404 });

    const commandes = await sql`
      SELECT id, statut, total, created_at
      FROM commandes WHERE client_id = ${id}
      ORDER BY created_at DESC LIMIT 10
    `;

    return Response.json({ ...client, commandes });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// ─── PUT : modifier un client ────────────────────────────────
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body    = await req.json();
    const { nom, prenom, email, telephone, adresse, titre, nif, siege_social } = body;

    const [updated] = await sql`
      UPDATE clients SET
        nom          = COALESCE(${nom || null}, nom),
        prenom       = COALESCE(${prenom || null}, prenom),
        email        = COALESCE(${email || null}, email),
        telephone    = COALESCE(${telephone || null}, telephone),
        adresse      = COALESCE(${adresse || null}, adresse),
        titre        = COALESCE(${titre || null}, titre),
        nif          = COALESCE(${nif || null}, nif),
        siege_social = COALESCE(${siege_social || null}, siege_social)
      WHERE id = ${id}
      RETURNING *
    `;
    if (!updated) return Response.json({ error: 'Client introuvable' }, { status: 404 });
    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// ─── DELETE : supprimer un client ───────────────────────────
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM clients WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}