import sql from './db';

type NotifType = 'info' | 'success' | 'warning' | 'danger';

interface TrackOptions {
  entite_type:      string;
  entite_id?:       number;
  action:           string;
  ancien_etat?:     string;
  nouvel_etat?:     string;
  details?:         string;
  utilisateur_id?:  number;
  utilisateur_nom?: string;
}

interface NotifOptions {
  titre:              string;
  message?:           string;
  type:               NotifType;
  entite_type?:       string;
  entite_id?:         number;
  destinataire_id?:   number;
  destinataire_role?: string;
}

// ─── Journal ─────────────────────────────────────────────────
export async function track(opts: TrackOptions) {
  try {
    await sql`
      INSERT INTO tracabilite
        (entite_type, entite_id, action, ancien_etat, nouvel_etat, details, utilisateur_id, utilisateur_nom)
      VALUES
        (${opts.entite_type}, ${opts.entite_id || null}, ${opts.action},
         ${opts.ancien_etat || null}, ${opts.nouvel_etat || null},
         ${opts.details || null}, ${opts.utilisateur_id || null},
         ${opts.utilisateur_nom || null})
    `;
  } catch (e) { console.error('[tracker] journal:', e); }
}

// ─── Notification ─────────────────────────────────────────────
export async function notify(opts: NotifOptions) {
  try {
    await sql`
      INSERT INTO notifications
        (titre, message, type, entite_type, entite_id, destinataire_id, destinataire_role)
      VALUES
        (${opts.titre}, ${opts.message || null}, ${opts.type},
         ${opts.entite_type || null}, ${opts.entite_id || null},
         ${opts.destinataire_id || null}, ${opts.destinataire_role || null})
    `;
  } catch (e) { console.error('[tracker] notif:', e); }
}

async function trackAndNotify(trackOpts: TrackOptions, notifOpts: NotifOptions | NotifOptions[]) {
  const notifs = Array.isArray(notifOpts) ? notifOpts : [notifOpts];
  await Promise.all([track(trackOpts), ...notifs.map(n => notify(n))]);
}

// ════════════════════════════════════════════════════════════
// HELPERS MÉTIER
// ════════════════════════════════════════════════════════════

/** Nouvelle commande */
export async function onNouvelleCommande(
  commandeId: number, clientNom: string, total: number, clientUserId?: number,
) {
  await trackAndNotify(
    {
      entite_type: 'commande', entite_id: commandeId,
      action: 'nouvelle_commande', nouvel_etat: 'en_attente',
      details: `Commande #${commandeId} — ${clientNom} — ${total.toLocaleString('fr-DZ')} DA`,
    },
    [
      { titre: `Nouvelle commande #${commandeId}`, message: `${clientNom} — ${total.toLocaleString('fr-DZ')} DA`, type: 'info', entite_type: 'commande', entite_id: commandeId, destinataire_role: 'admin' },
      ...(clientUserId ? [{ titre: `Commande #${commandeId} reçue ✓`, message: `Votre commande de ${total.toLocaleString('fr-DZ')} DA a bien été enregistrée.`, type: 'success' as NotifType, entite_type: 'commande', entite_id: commandeId, destinataire_id: clientUserId }] : []),
    ],
  );
}

/** Changement statut commande */
export async function onStatutCommande(
  commandeId: number, ancienStatut: string, nouveauStatut: string,
  clientNom?: string, clientUserId?: number, livreurId?: number,
) {
  const LABELS: Record<string, string> = {
    confirmee: 'Confirmée', en_fabrication: 'En fabrication',
    pret_livraison: 'Prête à livrer', livree: 'Livrée', annulee: 'Annulée',
  };
  const type: NotifType =
    nouveauStatut === 'livree'         ? 'success' :
    nouveauStatut === 'annulee'        ? 'danger'  :
    nouveauStatut === 'en_fabrication' ? 'warning' : 'info';
  const label = LABELS[nouveauStatut] || nouveauStatut;
  const notifs: NotifOptions[] = [];

  // Admin
  notifs.push({ titre: `Commande #${commandeId} — ${label}`, message: clientNom ? `Client : ${clientNom}` : undefined, type, entite_type: 'commande', entite_id: commandeId, destinataire_role: 'admin' });

  // Client
  const msgClient: Record<string, string> = {
    confirmee:      'Votre commande a été confirmée.',
    en_fabrication: 'Votre commande est en cours de fabrication.',
    pret_livraison: 'Votre commande est prête et sera bientôt livrée !',
    livree:         'Votre commande a été livrée. Merci !',
    annulee:        'Votre commande a été annulée.',
  };
  if (clientUserId && msgClient[nouveauStatut]) {
    notifs.push({ titre: `Commande #${commandeId} — ${label}`, message: msgClient[nouveauStatut], type, entite_type: 'commande', entite_id: commandeId, destinataire_id: clientUserId });
  }

  // Responsable production — en fabrication
  if (nouveauStatut === 'en_fabrication') {
    notifs.push({ titre: `Ordre de fabrication — Commande #${commandeId}`, message: `Une nouvelle commande est à fabriquer.`, type: 'warning', entite_type: 'commande', entite_id: commandeId, destinataire_role: 'responsable_production' });
  }

  // Livreur — prête à livrer ou annulée
  if (livreurId && nouveauStatut === 'pret_livraison') {
    notifs.push({ titre: `À livrer — Commande #${commandeId}`, message: `La commande${clientNom ? ` de ${clientNom}` : ''} est prête.`, type: 'warning', entite_type: 'commande', entite_id: commandeId, destinataire_id: livreurId });
  }
  if (livreurId && nouveauStatut === 'annulee') {
    notifs.push({ titre: `Commande #${commandeId} annulée`, message: `Ne pas livrer — commande annulée.`, type: 'danger', entite_type: 'commande', entite_id: commandeId, destinataire_id: livreurId });
  }

  await trackAndNotify(
    { entite_type: 'commande', entite_id: commandeId, action: 'changement_statut', ancien_etat: ancienStatut, nouvel_etat: nouveauStatut, details: `Commande #${commandeId}${clientNom ? ` — ${clientNom}` : ''} → ${label}` },
    notifs,
  );
}

/** Nouvelle livraison */
export async function onNouvelleLivraison(
  livraisonId: number, commandeId: number,
  livreurId?: number, livreurNom?: string,
  clientNom?: string, clientUserId?: number,
) {
  const notifs: NotifOptions[] = [
    { titre: `Livraison #${livraisonId} créée`, message: `Commande #${commandeId}${livreurNom ? ` · ${livreurNom}` : ''}`, type: 'info', entite_type: 'livraison', entite_id: livraisonId, destinataire_role: 'admin' },
  ];
  if (livreurId) {
    notifs.push({ titre: `Livraison assignée — #${livraisonId}`, message: `Commande #${commandeId}${clientNom ? ` — ${clientNom}` : ''} à livrer.`, type: 'warning', entite_type: 'livraison', entite_id: livraisonId, destinataire_id: livreurId });
  }
  if (clientUserId) {
    notifs.push({ titre: `Votre commande est en route !`, message: `Commande #${commandeId}${livreurNom ? ` — Livreur : ${livreurNom}` : ''}.`, type: 'info', entite_type: 'livraison', entite_id: livraisonId, destinataire_id: clientUserId });
  }
  await trackAndNotify(
    { entite_type: 'livraison', entite_id: livraisonId, action: 'nouvelle_livraison', nouvel_etat: 'en_attente', details: `Livraison #${livraisonId} — Commande #${commandeId}` },
    notifs,
  );
}

/** Livraison effectuée */
export async function onLivraisonTerminee(
  livraisonId: number, commandeId: number,
  clientNom?: string, clientUserId?: number,
) {
  const notifs: NotifOptions[] = [
    { titre: `Livraison #${livraisonId} effectuée ✓`, message: `Commande #${commandeId}${clientNom ? ` — ${clientNom}` : ''} livrée`, type: 'success', entite_type: 'livraison', entite_id: livraisonId, destinataire_role: 'admin' },
  ];
  if (clientUserId) {
    notifs.push({ titre: `Commande #${commandeId} livrée ! 🎉`, message: 'Votre commande a été livrée avec succès. Merci !', type: 'success', entite_type: 'livraison', entite_id: livraisonId, destinataire_id: clientUserId });
  }
  await trackAndNotify(
    { entite_type: 'livraison', entite_id: livraisonId, action: 'livraison_effectuee', ancien_etat: 'en_cours', nouvel_etat: 'livree', details: `Livraison #${livraisonId} — Commande #${commandeId} livrée` },
    notifs,
  );
}

/** Fabrication démarrée */
export async function onFabricationDemarree(ordreId: number, produitNom: string, quantite: number) {
  await trackAndNotify(
    { entite_type: 'fabrication', entite_id: ordreId, action: 'fabrication_demarree', ancien_etat: 'planifie', nouvel_etat: 'en_cours', details: `Ordre #${ordreId} — ${produitNom} × ${quantite}` },
    [
      { titre: `Fabrication démarrée — ${produitNom}`, message: `Ordre #${ordreId} · Qté : ${quantite}`, type: 'warning', entite_type: 'fabrication', entite_id: ordreId, destinataire_role: 'admin' },
      { titre: `Fabrication démarrée — ${produitNom}`, message: `Ordre #${ordreId} · Qté : ${quantite}`, type: 'warning', entite_type: 'fabrication', entite_id: ordreId, destinataire_role: 'responsable_production' },
    ],
  );
}

/** Fabrication terminée */
export async function onFabricationTerminee(ordreId: number, produitNom: string, quantite: number) {
  await trackAndNotify(
    { entite_type: 'fabrication', entite_id: ordreId, action: 'fabrication_terminee', ancien_etat: 'en_cours', nouvel_etat: 'termine', details: `Ordre #${ordreId} — ${produitNom} × ${quantite} terminé` },
    [
      { titre: `Fabrication terminée — ${produitNom}`, message: `Ordre #${ordreId} · ${quantite} unités produites`, type: 'success', entite_type: 'fabrication', entite_id: ordreId, destinataire_role: 'admin' },
      { titre: `Fabrication terminée — ${produitNom}`, message: `${quantite} unités prêtes. En attente de livraison.`, type: 'success', entite_type: 'fabrication', entite_id: ordreId, destinataire_role: 'responsable_production' },
    ],
  );
}

/** Stock critique */
export async function onStockCritique(produitNom: string, stockActuel: number, stockMin: number, type: 'produit' | 'matiere' = 'produit') {
  const entiteType = type === 'produit' ? 'stock_produit' : 'stock_matiere';
  await trackAndNotify(
    { entite_type: entiteType, action: 'stock_critique', details: `${produitNom} — Stock: ${stockActuel} / Min: ${stockMin}` },
    [
      { titre: `⚠ Stock critique — ${produitNom}`, message: `Stock : ${stockActuel} · Min : ${stockMin}`, type: 'danger', entite_type: entiteType, destinataire_role: 'admin' },
      { titre: `⚠ Stock critique — ${produitNom}`, message: `Stock : ${stockActuel} · Min : ${stockMin}. Réapprovisionnement nécessaire.`, type: 'danger', entite_type: entiteType, destinataire_role: 'responsable_production' },
    ],
  );
}

/** Demande appro créée */
export async function onDemandeAppro(
  demandeId: number, matiereTitre: string, quantite: number,
  fournisseurId?: number, fournisseurNom?: string,
) {
  const notifs: NotifOptions[] = [
    { titre: `Demande appro — ${matiereTitre}`, message: `Qté : ${quantite}${fournisseurNom ? ` · ${fournisseurNom}` : ''}`, type: 'info', entite_type: 'demande_appro', entite_id: demandeId, destinataire_role: 'admin' },
    { titre: `Demande appro — ${matiereTitre}`, message: `Qté : ${quantite}${fournisseurNom ? ` · ${fournisseurNom}` : ''}. En attente de confirmation.`, type: 'info', entite_type: 'demande_appro', entite_id: demandeId, destinataire_role: 'responsable_production' },
  ];
  if (fournisseurId) {
    notifs.push({ titre: `Nouvelle demande — ${matiereTitre}`, message: `Quantité demandée : ${quantite}. Veuillez confirmer votre disponibilité.`, type: 'warning', entite_type: 'demande_appro', entite_id: demandeId, destinataire_id: fournisseurId });
  }
  await trackAndNotify(
    { entite_type: 'demande_appro', entite_id: demandeId, action: 'demande_appro_creee', nouvel_etat: 'en_attente', details: `Demande #${demandeId} — ${matiereTitre} × ${quantite}` },
    notifs,
  );
}

/** Demande appro confirmée par fournisseur */
export async function onDemandeApproConfirmee(demandeId: number, matiereTitre: string, fournisseurNom?: string) {
  await trackAndNotify(
    { entite_type: 'demande_appro', entite_id: demandeId, action: 'demande_appro_confirmee', ancien_etat: 'en_attente', nouvel_etat: 'confirmee', details: `Demande #${demandeId} — ${matiereTitre} confirmée` },
    [
      { titre: `Appro confirmée — ${matiereTitre}`, message: `${fournisseurNom || 'Fournisseur'} a confirmé la demande #${demandeId}.`, type: 'success', entite_type: 'demande_appro', entite_id: demandeId, destinataire_role: 'admin' },
      { titre: `Appro confirmée — ${matiereTitre}`, message: `${fournisseurNom || 'Fournisseur'} a confirmé. Livraison en cours de préparation.`, type: 'success', entite_type: 'demande_appro', entite_id: demandeId, destinataire_role: 'responsable_production' },
    ],
  );
}

/** Demande appro expédiée */
export async function onDemandeApproExpediee(demandeId: number, matiereTitre: string, fournisseurNom?: string) {
  await trackAndNotify(
    { entite_type: 'demande_appro', entite_id: demandeId, action: 'demande_appro_expediee', ancien_etat: 'confirmee', nouvel_etat: 'expediee', details: `Demande #${demandeId} — ${matiereTitre} expédiée` },
    [
      { titre: `Appro expédiée — ${matiereTitre}`, message: `${fournisseurNom || 'Fournisseur'} a expédié la demande #${demandeId}.`, type: 'info', entite_type: 'demande_appro', entite_id: demandeId, destinataire_role: 'admin' },
      { titre: `Appro en route — ${matiereTitre}`, message: `La livraison est en route. Réception attendue prochainement.`, type: 'info', entite_type: 'demande_appro', entite_id: demandeId, destinataire_role: 'responsable_production' },
    ],
  );
}

/** Connexion utilisateur */
export async function onConnexion(userId: number, userNom: string) {
  await track({
    entite_type: 'utilisateur', entite_id: userId,
    action: 'connexion', nouvel_etat: 'connecte',
    utilisateur_id: userId, utilisateur_nom: userNom,
  });
}