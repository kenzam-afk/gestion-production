import sql from '@/lib/db';
import { NextRequest } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const commande_id = parseInt(id);

  try {
    const [commande] = await sql`
      SELECT * FROM commandes WHERE id = ${commande_id}
    `;
    if (!commande)
  return Response.json(
    { error: 'Commande introuvable' },
    { status: 404 }
  );

if (commande.statut !== 'en_attente')
  return Response.json(
    { error: 'Commande déjà traitée' },
    { status: 400 }
  );

// Commande validée
await sql`
  UPDATE commandes
  SET statut = 'confirmee',
      updated_at = NOW()
  WHERE id = ${commande_id}
`;

const lignes = await sql`
  SELECT cp.produit_id, cp.quantite, p.nom AS produit_nom
  FROM commande_produits cp
  JOIN produits p ON p.id = cp.produit_id
  WHERE cp.commande_id = ${commande_id}
`;
    const ordresCrees: any[] = [];

    for (const ligne of lignes) {
      const [produit] = await sql`
  SELECT stock_disponible FROM produits WHERE id = ${ligne.produit_id}
`;
const stockDispo = produit?.stock_disponible ?? 0;
      const manque = ligne.quantite - stockDispo;

      if (manque > 0) {
        const ageHeures = Math.floor(
          (Date.now() - new Date(commande.created_at).getTime()) / 3600000
        );
        const scorePriorite = manque * 10 + ageHeures;

        const dateDebut = new Date().toISOString().split('T')[0];
        const dateFin = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

        const [ordre] = await sql`
          INSERT INTO ordres_fabrication (commande_id, produit_id, quantite, statut, date_debut, date_fin, notes)
          VALUES (
            ${commande_id}, ${ligne.produit_id}, ${manque}, 'urgent',
            ${dateDebut}, ${dateFin},
            ${'PRIORITÉ ABSOLUE — Manque ' + manque + ' unité(s) de "' + ligne.produit_nom + '" pour commande #' + commande_id + ' | Score: ' + scorePriorite}
          )
          RETURNING *
        `;

        ordresCrees.push({ ...ordre, score_priorite: scorePriorite });

        // Enregistrer dans mouvements_stock → affecte le forecasting
        await sql`
          INSERT INTO mouvements_stock (produit_id, type, quantite, raison, reference_id)
          VALUES (${ligne.produit_id}, 'besoin_production', ${manque},
            ${'Manque détecté validation commande #' + commande_id}, ${commande_id})
        `;

        // Notifier le responsable de production
        await sql`
          INSERT INTO notifications (titre, message, type, destinataire_role, entite_type, entite_id)
          VALUES (
            ${'🔴 Ordre urgent'},
            ${'Fabriquer ' + manque + ' × "' + ligne.produit_nom + '" — commande #' + commande_id + ' | Score: ' + scorePriorite},
            'urgent', 'responsable_production', 'ordre_fabrication', ${ordre.id}
          )
        `;

        // Réserver le stock partiel disponible
        if (stockDispo > 0) {
          await sql`
            UPDATE stock_etats
            SET qte_reservee = qte_reservee + ${stockDispo},
                qte_disponible = qte_disponible - ${stockDispo},
                updated_at = NOW()
            WHERE produit_id = ${ligne.produit_id}
          `;
        }
      } else {
        // Stock suffisant → réserver directement
        await sql`
          UPDATE stock_etats
          SET qte_reservee = qte_reservee + ${ligne.quantite},
              qte_disponible = qte_disponible - ${ligne.quantite},
              updated_at = NOW()
          WHERE produit_id = ${ligne.produit_id}
        `;
      }
    }


const nouveauStatut = ordresCrees.length > 0
  ? 'en_fabrication'
  : 'pret_livraison';

await sql`
  UPDATE commandes
  SET statut = ${nouveauStatut},
      source_urgence = ${ordresCrees.length > 0},
      updated_at = NOW()
  WHERE id = ${commande_id}
`;

// Si stock suffisant → créer la livraison directement
if (ordresCrees.length === 0) {
  const [existeLivraison] = await sql`
    SELECT id FROM livraisons WHERE commande_id = ${commande_id}
  `;

  if (!existeLivraison) {
    const [cmdInfo] = await sql`
      SELECT c.adresse_livraison, cl.adresse AS client_adresse
      FROM commandes c
      LEFT JOIN clients cl ON cl.id = c.client_id
      WHERE c.id = ${commande_id}
    `;
    const adresse = cmdInfo?.adresse_livraison || cmdInfo?.client_adresse || '';

    const [livraison] = await sql`
      INSERT INTO livraisons (commande_id, adresse, statut)
      VALUES (${commande_id}, ${adresse}, 'en_attente')
      RETURNING *
    `;
    const numBon = `BL-${new Date().getFullYear()}-${String(livraison.id).padStart(4, '0')}`;
    await sql`
      INSERT INTO bons_livraison (livraison_id, commande_id, numero_bon, date_emission)
      VALUES (${livraison.id}, ${commande_id}, ${numBon}, CURRENT_DATE)
    `;
  }
}

    return Response.json({
      success: true,
      commande_id,
      statut: nouveauStatut,
      ordres_fabrication_crees: ordresCrees.length,
      message: ordresCrees.length > 0
        ? `${ordresCrees.length} ordre(s) urgent(s) créés et transmis au responsable de production.`
        : 'Stock suffisant — commande validée.',
    });
  } catch (error: any) {
    console.error('VALIDER ERROR:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}