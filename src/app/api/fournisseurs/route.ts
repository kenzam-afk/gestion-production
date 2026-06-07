import sql from '@/lib/db';

export async function GET() {
  try {
    const fournisseurs = await sql`
      SELECT id, nom, email, telephone
      FROM fournisseurs
      WHERE actif = true
      ORDER BY id ASC
    `;
    return Response.json(fournisseurs);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}