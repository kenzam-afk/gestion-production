import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    // API gratuite pour le taux de change
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/EUR'
    );
    const data = await response.json();
    
    // 1 EUR = X DZD
    const taux = data.rates.DZD;

    // Mettre à jour toutes les matières premières
    await sql`
      UPDATE matieres_premieres
      SET 
        cout_en_euro = ROUND(cout_en_da / ${taux}::DECIMAL, 2),
        taux_change = ${taux},
        derniere_maj_taux = NOW()
    `;

    return NextResponse.json({ 
      success: true, 
      taux_eur_dzd: taux,
      message: `Taux mis à jour : 1 EUR = ${taux} DA`
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}