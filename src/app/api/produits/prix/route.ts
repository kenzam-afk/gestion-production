import { NextResponse } from 'next/server';

function calculerMargeDynamique(categorie: string, marge_base: number) {
  let marge = marge_base;
  const raisons: string[] = [];
  const mois = new Date().getMonth() + 1;

  if (mois === 3 || mois === 4) {
    marge += 10;
    raisons.push('📅 Période Ramadan/Aïd : +10%');
  } else if (mois === 9) {
    marge += 8;
    raisons.push('📚 Rentrée scolaire : +8%');
  } else if (mois === 12) {
    marge += 12;
    raisons.push("🎄 Fin d'année : +12%");
  } else if (mois === 7 || mois === 8) {
    marge -= 5;
    raisons.push('☀️ Été (basse saison) : -5%');
  } else if (mois === 1 || mois === 2) {
    marge -= 3;
    raisons.push('❄️ Hiver (basse saison) : -3%');
  }

  if (categorie?.toLowerCase().includes('alimentaire')) {
    marge += 5;
    raisons.push('🍎 Produit alimentaire : +5%');
  } else if (categorie?.toLowerCase().includes('luxe')) {
    marge += 20;
    raisons.push('💎 Produit de luxe : +20%');
  } else if (categorie?.toLowerCase().includes('construction')) {
    marge += 8;
    raisons.push('🏗️ Construction : +8%');
  }

  marge = Math.max(5, Math.min(60, marge));
  return { marge_finale: marge, raisons };
}

export async function POST(req: Request) {
  try {
    const { cout_matieres_premieres, cout_fabrication, categorie, marge_base } = await req.json();
    const cout_total = parseFloat(cout_matieres_premieres) + parseFloat(cout_fabrication);
    const { marge_finale, raisons } = calculerMargeDynamique(categorie, marge_base);
    const prix_vente = cout_total * (1 + marge_finale / 100);

    return NextResponse.json({
      success: true,
      cout_total: cout_total.toFixed(2),
      marge_dynamique: marge_finale,
      prix_vente: prix_vente.toFixed(2),
      raisons,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}