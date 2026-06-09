import sql from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (email) {
      const [client] = await sql`SELECT * FROM clients WHERE email = ${email}`;
      return Response.json(client || null);
    }

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
  } catch (error: any) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      utilisateur_id, type_client,
      email, telephone, adresse,
      nom, prenom, date_naissance, nin,
      titre, nif, annee_creation, siege_social,
    } = body;

    // Vérifier NIN (individuel)
    if (nin) {
      const ninExist = await sql`SELECT id FROM clients WHERE nin = ${nin}`;
      if (ninExist.length > 0) {
        return Response.json({ error: 'Ce NIN est déjà associé à un client existant' }, { status: 400 });
      }
    }

    // Vérifier NIF (entreprise)
    if (nif) {
      const nifExist = await sql`SELECT id FROM clients WHERE nif = ${nif}`;
      if (nifExist.length > 0) {
        return Response.json({ error: 'Ce NIF est déjà associé à un client existant' }, { status: 400 });
      }
    }

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
  } catch (error: any) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}