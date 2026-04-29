import sql from '@/lib/db';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM utilisateurs WHERE id = ${id} AND role = 'livreur'`;
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}