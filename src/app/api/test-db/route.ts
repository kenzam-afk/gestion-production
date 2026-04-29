import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`SELECT id, nom, email, role FROM utilisateurs`;
    return NextResponse.json({ success: true, users: rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) });
  }
}