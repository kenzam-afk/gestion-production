import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM matieres_premieres ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { titre, description, cout_en_da, unite } = await req.json();

    // Récupère le taux actuel
    const tauxRes = await fetch(`${process.env.NEXTAUTH_URL}/api/taux-change`);
    const tauxData = await tauxRes.json();
    const taux = tauxData.taux_eur_dzd;

    const cout_en_euro = (parseFloat(cout_en_da) / taux).toFixed(2);

    await sql`
      INSERT INTO matieres_premieres 
        (titre, description, cout_unitaire, unite, cout_en_da, cout_en_euro, taux_change)
      VALUES 
        (${titre}, ${description}, ${cout_en_da}, ${unite}, ${cout_en_da}, ${cout_en_euro}, ${taux})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}