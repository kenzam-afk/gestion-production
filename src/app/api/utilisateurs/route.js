import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query(
      'SELECT id, nom, email, role, created_at FROM utilisateurs ORDER BY created_at DESC'
    );
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}