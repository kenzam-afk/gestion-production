'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Printer, Download, ArrowLeft, Package } from 'lucide-react';

interface BonCommande {
  id: number;
  numero_bon: string;
  date_emission: string;
  conditions_paiement: string;
  commande_id: number;
  commande_statut: string;
  commande_date: string;
  total: number;
  adresse_livraison: string;
  client_nom: string;
  client_email: string;
  client_telephone: string;
  client_adresse: string;
  type_client: string;
  nif: string;
  nin: string;
  lignes: {
    produit_nom: string;
    produit_description: string;
    unite: string;
    quantite: number;
    prix_unitaire: number;
    sous_total: number;
  }[];
}

export default function BonCommandePage() {
  const params  = useParams();
  const id      = params?.id as string;

  const [bon, setBon]       = useState<BonCommande | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/commandes/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        if (!data.bon_commande) { setError('Aucun bon de commande pour cette commande.'); return; }
        // Fusionner les données commande + bon
        fetch(`/api/bons/commande/${data.bon_commande.id}`)
          .then(r => r.json())
          .then(bonData => { setBon(bonData); setLoading(false); });
      })
      .catch(() => { setError('Erreur de chargement'); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: "'DM Sans',sans-serif", flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #1a56db', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !bon) return (
    <div style={{ padding: 32, fontFamily: "'DM Sans',sans-serif", color: '#dc2626' }}>{error || 'Bon introuvable'}</div>
  );

  const tva    = Number(bon.total) * 0.19;
  const htotal = Number(bon.total);
  const ttc    = htotal + tva;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        body{font-family:'DM Sans',sans-serif;background:#f8fafc;margin:0}
        @media print {
          .no-print{display:none!important}
          body{background:white}
          .bon-paper{box-shadow:none!important;border-radius:0!important}
        }
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      {/* Barre actions */}
      <div className="no-print" style={{ background: '#080f1e', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => history.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
          <ArrowLeft size={14} /> Retour
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#1a56db', border: 'none', color: 'white', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 2px 8px rgba(26,86,219,.3)' }}>
            <Printer size={15} /> Imprimer
          </button>
        </div>
      </div>

      {/* Document */}
      <div style={{ padding: '32px 24px', maxWidth: 860, margin: '0 auto' }}>
        <div className="bon-paper" style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

          {/* En-tête colorée */}
          <div style={{ background: 'linear-gradient(135deg,#080f1e 0%,#1a56db 100%)', padding: '32px 40px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={22} color="white" />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: 'white' }}>Gestion Pro</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Production & Livraison</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                  Zone Industrielle, Alger, Algérie<br />
                  contact@gestionpro.dz · +213 555 000 000
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>BON DE COMMANDE</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, color: '#93c5fd', fontWeight: 600, marginTop: 4 }}>{bon.numero_bon}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
                  Émis le {new Date(bon.date_emission).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '32px 40px' }}>

            {/* Infos client + commande */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '18px 20px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Client</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 6 }}>{bon.client_nom}</div>
                {bon.type_client === 'entreprise' && bon.nif && <div style={{ fontSize: 12, color: '#64748b' }}>NIF : {bon.nif}</div>}
                {bon.type_client === 'individuel' && bon.nin && <div style={{ fontSize: 12, color: '#64748b' }}>NIN : {bon.nin}</div>}
                {bon.client_email    && <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4 }}>{bon.client_email}</div>}
                {bon.client_telephone && <div style={{ fontSize: 12.5, color: '#475569' }}>{bon.client_telephone}</div>}
                {bon.client_adresse  && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{bon.client_adresse}</div>}
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '18px 20px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Détails</div>
                {[
                  { label: 'N° commande',   value: `#${bon.commande_id}` },
                  { label: 'Date commande', value: new Date(bon.commande_date).toLocaleDateString('fr-FR') },
                  { label: 'Paiement',      value: bon.conditions_paiement },
                  { label: 'Adresse livraison', value: bon.adresse_livraison || 'Non précisée' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                    <span style={{ color: '#94a3b8' }}>{row.label}</span>
                    <span style={{ fontWeight: 500, color: '#334155' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Table produits */}
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f1f5f9', marginBottom: 24 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#080f1e' }}>
                    {['Désignation', 'Unité', 'Quantité', 'Prix unitaire', 'Sous-total'].map((h, i) => (
                      <th key={h} style={{ padding: '12px 16px', fontSize: 10.5, fontWeight: 700, color: '#4d7aa3', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: i >= 2 ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bon.lignes.map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{l.produit_nom}</div>
                        {l.produit_description && <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>{l.produit_description}</div>}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12.5, color: '#64748b' }}>{l.unite}</td>
                      <td style={{ padding: '13px 16px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, color: '#334155', textAlign: 'right' }}>{l.quantite}</td>
                      <td style={{ padding: '13px 16px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, color: '#334155', textAlign: 'right' }}>{Number(l.prix_unitaire).toLocaleString('fr-DZ')} DA</td>
                      <td style={{ padding: '13px 16px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: '#1a56db', textAlign: 'right' }}>{Number(l.sous_total).toLocaleString('fr-DZ')} DA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totaux */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
              <div style={{ width: 280 }}>
                {[
                  { label: 'Total HT',  value: `${htotal.toLocaleString('fr-DZ')} DA`, bold: false },
                  { label: 'TVA (19%)', value: `${tva.toFixed(2)} DA`,                 bold: false },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>{row.label}</span>
                    <span style={{ color: '#334155', fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: '#080f1e', borderRadius: 10, marginTop: 10 }}>
                  <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: '#93c5fd' }}>TOTAL TTC</span>
                  <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 16, color: 'white' }}>{ttc.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DA</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 24 }}>
              {['Signature du client', 'Cachet & Signature société'].map((label, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', marginBottom: 48 }}>{label}</div>
                  <div style={{ borderTop: '1.5px solid #e2e8f0', paddingTop: 8, fontSize: 11, color: '#cbd5e1' }}>Date et signature</div>
                </div>
              ))}
            </div>

            {/* Pied */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                Document généré le {new Date().toLocaleDateString('fr-FR')} · {bon.numero_bon} · Gestion Pro — PFE 2025
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}