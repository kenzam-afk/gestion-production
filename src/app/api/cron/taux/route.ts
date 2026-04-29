import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Appelle notre route de mise à jour
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/taux-change`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) });
  }
}