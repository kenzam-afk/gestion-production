'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Printer, ArrowLeft, Truck, MapPin, CheckCircle } from 'lucide-react';

interface BonLivraison {
  id: number;
  numero_bon: string;
  numero_bon_livraison: string;
  date_emission: string;
  date_livraison_prevue: string | null;
  commande_id: number;
  commande_total: number;
  adresse_livraison: string;
  client_nom: string;
  client_email: string;
  client_telephone: string;
  client_adresse: string;
  livreur_nom: string | null;
  statut: string;
  lignes: {
    produit_nom: string;
    unite: string;
    quantite: number;
    prix_unitaire: number;
  }[];
}

export default function BonLivraisonPage() {
  const params = useParams();
  const id     = params?.id as string; // id de la livraison

  const [bon, setBon]         = useState<BonLivraison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/livraisons/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setBon(data);
      })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: "'DM Sans',sans-serif", flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #059669', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !bon) return <div style={{ padding: 32, fontFamily: "'DM Sans',sans-serif", color: '#dc2626' }}>{error || 'Introuvable'}</div>;

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
      `}</style>

      {/* Barre actions */}
      <div className="no-print" style={{ background: '#080f1e', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => history.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
          <ArrowLeft size={14} /> Retour
        </button>
        <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#059669', border: 'none', color: 'white', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
          <Printer size={15} /> Imprimer
        </button>
      </div>

      {/* Document */}
      <div style={{ padding: '32px 24px', maxWidth: 860, margin: '0 auto' }}>
        <div className="bon-paper" style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

          {/* En-tête verte */}
          <div style={{ background: 'linear-gradient(135deg,#064e3b 0%,#059669 100%)', padding: '32px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Truck size={22} color="white" />
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
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>BON DE LIVRAISON</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, color: '#6ee7b7', fontWeight: 600, marginTop: 4 }}>{bon.numero_bon_livraison}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
                  Émis le {new Date(bon.date_emission).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '32px 40px' }}>

            {/* Client + livraison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '18px 20px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Destinataire</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 6 }}>{bon.client_nom}</div>
                {bon.client_telephone && <div style={{ fontSize: 12.5, color: '#475569' }}>{bon.client_telephone}</div>}
                {bon.client_email     && <div style={{ fontSize: 12.5, color: '#475569' }}>{bon.client_email}</div>}
                {bon.client_adresse   && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{bon.client_adresse}</div>}
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '18px 20px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Livraison</div>
                {[
                  { label: 'N° commande',    value: `#${bon.commande_id}` },
                  { label: 'Livreur',         value: bon.livreur_nom || 'Non assigné' },
                  { label: 'Livraison prévue', value: bon.date_livraison_prevue ? new Date(bon.date_livraison_prevue).toLocaleDateString('fr-FR') : 'À définir' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                    <span style={{ color: '#94a3b8' }}>{row.label}</span>
                    <span style={{ fontWeight: 500, color: '#334155' }}>{row.value}</span>
                  </div>
                ))}
                {(bon.adresse_livraison || bon.client_adresse) && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 8, padding: '8px 10px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                    <MapPin size={13} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12, color: '#065f46' }}>{bon.adresse_livraison || bon.client_adresse}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Table articles */}
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f1f5f9', marginBottom: 32 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#064e3b' }}>
                    {['Désignation', 'Unité', 'Quantité livrée', 'Quantité reçue ✓'].map((h, i) => (
                      <th key={h} style={{ padding: '12px 16px', fontSize: 10.5, fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: i >= 2 ? 'center' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(bon.lignes || []).map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '13px 16px', fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{l.produit_nom}</td>
                      <td style={{ padding: '13px 16px', fontSize: 12.5, color: '#64748b' }}>{l.unite}</td>
                      <td style={{ padding: '13px 16px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: '#059669', textAlign: 'center', fontSize: 15 }}>{l.quantite}</td>
                      {/* Case à cocher pour signature physique */}
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                        <div style={{ width: 24, height: 24, border: '2px solid #d1d5db', borderRadius: 5, margin: '0 auto' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Confirmation réception */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 24 }}>
              <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '20px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <CheckCircle size={16} color="#059669" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signature du livreur</span>
                </div>
                <div style={{ height: 60 }} />
                <div style={{ borderTop: '1.5px solid #bbf7d0', paddingTop: 8, fontSize: 11, color: '#94a3b8' }}>Nom et signature</div>
              </div>
              <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '20px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <CheckCircle size={16} color="#059669" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signature du client</span>
                </div>
                <div style={{ height: 60 }} />
                <div style={{ borderTop: '1.5px solid #bbf7d0', paddingTop: 8, fontSize: 11, color: '#94a3b8' }}>Bon pour réception</div>
              </div>
            </div>

            {/* Pied */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                Document généré le {new Date().toLocaleDateString('fr-FR')} · {bon.numero_bon_livraison} · Gestion Pro — PFE 2025
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}