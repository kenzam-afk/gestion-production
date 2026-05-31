import sql from '@/lib/db';

// ─── PUT /api/notifications/[id] ── Marquer une notif comme lue
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    await sql`UPDATE notifications SET lu = TRUE WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ─── DELETE /api/notifications/[id] ── Supprimer une notif
export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    await sql`DELETE FROM notifications WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}