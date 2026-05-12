import sql from '@/lib/db';

// ─── GET : tous les clients ──────────────────────────────────
export async function GET() {
  try {
    const rows = await sql`
      SELECT
        c.*,
        CASE
          WHEN c.type_client = 'entreprise' THEN c.titre
          ELSE CONCAT(COALESCE(c.prenom, ''), ' ', COALESCE(c.nom, ''))
        END AS nom_affiche,
        COUNT(cmd.id) AS total_commandes,
        COALESCE(SUM(cmd.total), 0) AS chiffre_affaires
      FROM clients c
      LEFT JOIN commandes cmd ON cmd.client_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ─── POST : créer un client ──────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      utilisateur_id, type_client,
      email, telephone, adresse,
      nom, prenom, date_naissance, nin,
      titre, nif, annee_creation, siege_social,
    } = body;

    const [result] = await sql`
      INSERT INTO clients (
        utilisateur_id, type_client,
        email, telephone, adresse,
        nom, prenom, date_naissance, nin,
        titre, nif, annee_creation, siege_social
      ) VALUES (
        ${utilisateur_id || null},
        ${type_client || 'individuel'},
        ${email || null}, ${telephone || null}, ${adresse || null},
        ${nom || null}, ${prenom || null},
        ${date_naissance || null}, ${nin || null},
        ${titre || null}, ${nif || null},
        ${annee_creation || null}, ${siege_social || null}
      )
      RETURNING *
    `;

    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}