import sql from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const utilisateur_id   = searchParams.get('utilisateur_id');

    if (!utilisateur_id) {
      return Response.json({ error: 'utilisateur_id requis' }, { status: 400 });
    }

    const [fournisseur] = await sql`
      SELECT id FROM fournisseurs WHERE utilisateur_id = ${utilisateur_id}
    `;

    if (!fournisseur) {
      return Response.json({ error: 'Fournisseur introuvable pour cet utilisateur' }, { status: 404 });
    }

    const demandes = await sql`
      SELECT da.*, mp.titre AS matiere_titre, mp.unite AS matiere_unite, f.nom AS fournisseur_nom
      FROM demandes_appro da
      JOIN matieres_premieres mp ON mp.id = da.matiere_id
      JOIN fournisseurs        f  ON f.id  = da.fournisseur_id
      WHERE da.fournisseur_id = ${fournisseur.id}
      ORDER BY da.created_at DESC
    `;

    return Response.json(demandes);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { matiere_id, quantite, fournisseur_id, notes, date_prevue } = body;

    if (!matiere_id || !quantite || !fournisseur_id) {
      return Response.json({ error: 'matiere_id, quantite et fournisseur_id sont requis' }, { status: 400 });
    }

    const [demande] = await sql`
      INSERT INTO demandes_appro (matiere_id, quantite, fournisseur_id, statut, notes, date_prevue)
      VALUES (${matiere_id}, ${quantite}, ${fournisseur_id}, 'en_attente', ${notes || null}, ${date_prevue || null})
      RETURNING *
    `;

    return Response.json(demande, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return Response.json({ error: 'Utilisez /api/fournisseurs/demande/[id]' }, { status: 400 });
}