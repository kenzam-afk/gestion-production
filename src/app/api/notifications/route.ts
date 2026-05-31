import sql from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// ─── GET /api/notifications ──────────────────────────────────
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const session = await getServerSession(authOptions);
    const userId  = (session?.user as any)?.id;
    const role    = (session?.user as any)?.role;

    if (!userId) {
      return Response.json({ notifications: [], non_lues: 0 });
    }

    const uid = parseInt(userId);

    const rows = await sql`
      SELECT * FROM notifications
      WHERE
        destinataire_id = ${uid}
        OR destinataire_role = ${role}
        OR (destinataire_id IS NULL AND destinataire_role IS NULL)
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    const [{ count }] = await sql`
      SELECT COUNT(*) as count FROM notifications
      WHERE
        lu = FALSE
        AND (
          destinataire_id = ${uid}
          OR destinataire_role = ${role}
          OR (destinataire_id IS NULL AND destinataire_role IS NULL)
        )
    `;

    return Response.json({
      notifications: rows,
      non_lues: parseInt(count),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ─── PUT : marquer tout comme lu ─────────────────────────────
export async function PUT() {
  try {
    const session = await getServerSession(authOptions);
    const userId  = (session?.user as any)?.id;
    const role    = (session?.user as any)?.role;

    if (!userId) return Response.json({ success: true });

    const uid = parseInt(userId);

    await sql`
      UPDATE notifications SET lu = TRUE
      WHERE
        lu = FALSE
        AND (
          destinataire_id = ${uid}
          OR destinataire_role = ${role}
          OR (destinataire_id IS NULL AND destinataire_role IS NULL)
        )
    `;

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST : créer une notification ───────────────────────────
export async function POST(req) {
  try {
    const { titre, message, type, entite_type, entite_id, destinataire_id, destinataire_role } = await req.json();
    const [notif] = await sql`
      INSERT INTO notifications
        (titre, message, type, entite_type, entite_id, destinataire_id, destinataire_role)
      VALUES
        (${titre}, ${message || null}, ${type || 'info'},
         ${entite_type || null}, ${entite_id || null},
         ${destinataire_id || null}, ${destinataire_role || null})
      RETURNING *
    `;
    return Response.json(notif, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}