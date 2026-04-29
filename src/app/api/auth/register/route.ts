import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();
    const { nom, email, mot_de_passe, role } = body;

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const result = await sql`
      INSERT INTO utilisateurs (nom, email, mot_de_passe, role)
      VALUES (${nom}, ${email}, ${hashedPassword}, ${role})
      RETURNING id
    `;

    return Response.json({ id: result[0].id, message: 'Utilisateur cree' }, { status: 201 });
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}