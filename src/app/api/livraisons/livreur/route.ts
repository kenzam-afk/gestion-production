import sql from '@/lib/db';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const rows = await sql`
      SELECT u.id, u.nom, u.email, u.role, u.created_at,
        COUNT(l.id) as livraisons_count,
        COUNT(CASE WHEN l.statut = 'livree' THEN 1 END) as livraisons_terminees
      FROM utilisateurs u
      LEFT JOIN livraisons l ON l.livreur_id = u.id
      WHERE u.role = 'livreur'
      GROUP BY u.id, u.nom, u.email, u.role, u.created_at
      ORDER BY u.created_at DESC
    `;
    return Response.json(rows);
  } catch (error: any) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nom, email, mot_de_passe } = await request.json();
    if (!nom || !email || !mot_de_passe) {
      return Response.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }
    const hash = await bcrypt.hash(mot_de_passe, 10);
    const result = await sql`
      INSERT INTO utilisateurs (nom, email, mot_de_passe, role)
      VALUES (${nom}, ${email}, ${hash}, 'livreur')
      RETURNING id
    `;
    return Response.json({ id: result[0].id }, { status: 201 });
  } catch (error: any) {
    if (String(error).includes('unique')) {
      return Response.json({ error: 'Cet email est déjà utilisé' }, { status: 400 });
    }
    return Response.json({ error: String(error) }, { status: 500 });
  }
}