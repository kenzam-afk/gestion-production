'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ShoppingBag, CheckCircle, Truck, Clock, RefreshCw, X, Package, LogOut } from 'lucide-react';

interface DemandeAppro {
  id: number;
  matiere_id: number;
  matiere_titre: string;
  matiere_unite: string;
  quantite: number;
  prix_unitaire: number | null;
  statut: string;
  date_prevue: string | null;
  notes: string | null;
  created_at: string;
  fournisseur_nom: string;
}

const STATUT_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  en_attente: { label: 'En attente', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  confirmee:  { label: 'Confirmée',  color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
  expediee:   { label: 'Expédiée',   color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  recue:      { label: 'Reçue',      color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
  annulee:    { label: 'Annulée',    color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

const DS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:#f1f5f9}
.btn-primary{display:inline-flex;align-items:center;gap:6px;background:#059669;color:white;border:none;border-radius:9px;padding:9px 18px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:background .15s,transform .15s}
.btn-primary:hover{background:#047857;transform:translateY(-1px)}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1.5px solid #e2e8f0;color:#64748b;border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:#059669;color:#059669;background:#f0fdf4}
.input-field{width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-family:'DM Sans',sans-serif;font-size:13.5px;color:#1e293b;outline:none;transition:border .15s;background:#f8fafc}
.input-field:focus{border-color:#059669;background:white;box-shadow:0 0 0 3px rgba(5,150,105,.08)}
label{font-size:11.5px;font-weight:600;color:#64748b;margin-bottom:5px;display:block;letter-spacing:.02em}
.card{background:white;border-radius:14px;border:1px solid #f1f5f9;box-shadow:0 1px 4px rgba(0,0,0,.04)}
.overlay{position:fixed;inset:0;background:rgba(8,15,30,.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;animation:fadeIn .2s}
.modal{background:white;border-radius:18px;width:100%;max-width:460px;padding:28px;box-shadow:0 32px 80px rgba(0,0,0,.25);animation:slideUp .2s}
.tab-btn{flex:1;padding:12px;font-size:13px;font-weight:500;border:none;background:transparent;cursor:pointer;font-family:'DM Sans',sans-serif;color:#64748b;transition:all .15s;border-bottom:2px solid transparent}
.tab-btn.active{color:#059669;border-bottom-color:#059669;background:#f0fdf4}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function FournisseurPage() {
  const { data: session }     = useSession();
  const [demandes, setDemandes] = useState<DemandeAppro[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<'actives' | 'historique'>('actives');
  const [modalReception, setModalReception] = useState<DemandeAppro | null>(null);
  const [recForm, setRecForm] = useState({ quantite_recue: '', notes: '' });
  const [saving, setSaving]   = useState(false);

async function fetchDemandes() {
  setLoading(true);
  try {
    const userId = (session?.user as any)?.id;
    const res    = await fetch(`/api/fournisseurs/demande?utilisateur_id=${userId}`);
    const data   = await res.json();
    setDemandes(Array.isArray(data) ? data : []);
  } finally { setLoading(false); }
}

async function confirmerDemande(id: number) {
  await fetch(`/api/fournisseurs/demande/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statut: 'confirmee' }),
  });
  fetchDemandes();
}

async function expedierDemande(id: number) {
  await fetch(`/api/fournisseurs/demande/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statut: 'expediee' }),
  });
  fetchDemandes();
}

async function confirmerReception() {
  if (!modalReception) return;
  setSaving(true);
  try {
    await fetch(`/api/fournisseurs/demande/${modalReception.id}/reception`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantite_recue: parseFloat(recForm.quantite_recue) || modalReception.quantite,
        notes: recForm.notes,
      }),
    });
    setModalReception(null);
    fetchDemandes();
  } finally { setSaving(false); }
}
  const actives    = demandes.filter(d => !['recue', 'annulee'].includes(d.statut));
  const historique = demandes.filter(d =>  ['recue', 'annulee'].includes(d.statut));

  const stats = {
    en_attente: demandes.filter(d => d.statut === 'en_attente').length,
    confirmees: demandes.filter(d => d.statut === 'confirmee').length,
    expediees:  demandes.filter(d => d.statut === 'expediee').length,
    recues:     demandes.filter(d => d.statut === 'recue').length,
  };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", minHeight: '100vh', background: '#f1f5f9' }}>
      <style>{DS}</style>

      {/* Navbar */}
      <nav style={{ background: '#064e3b', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 58 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#059669,#10b981)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={17} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>Espace Fournisseur</div>
              <div style={{ fontSize: 9, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{session?.user?.name}</div>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#6ee7b7', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>
            <LogOut size={13} /> Quitter
          </button>
        </div>
        <div style={{ height: 2, background: 'linear-gradient(90deg,#059669,#10b981,transparent)' }} />
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Tableau de bord</div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Demandes d'approvisionnement</h1>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'En attente', value: stats.en_attente, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
            { label: 'Confirmées', value: stats.confirmees,  color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
            { label: 'Expédiées',  value: stats.expediees,   color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
            { label: 'Reçues',     value: stats.recues,      color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="card">
          <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
            <button onClick={() => setActiveTab('actives')}    className={`tab-btn${activeTab === 'actives'    ? ' active' : ''}`}>Actives ({actives.length})</button>
            <button onClick={() => setActiveTab('historique')} className={`tab-btn${activeTab === 'historique' ? ' active' : ''}`}>Historique ({historique.length})</button>
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={fetchDemandes} className="btn-ghost">
                <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Chargement...</div>
            ) : (activeTab === 'actives' ? actives : historique).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 56 }}>
                <ShoppingBag size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.2, color: '#94a3b8' }} />
                <p style={{ color: '#94a3b8', fontSize: 13 }}>Aucune demande</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(activeTab === 'actives' ? actives : historique).map(d => {
                  const cfg = STATUT_CFG[d.statut] || STATUT_CFG.en_attente;
                  return (
                    <div key={d.id} style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9', padding: '18px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <div style={{ width: 34, height: 34, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Package size={16} color="#059669" />
                            </div>
                            <div>
                              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{d.matiere_titre}</div>
                              <div style={{ fontSize: 12, color: '#64748b' }}>
                                Quantité : <strong>{d.quantite} {d.matiere_unite}</strong>
                              </div>
                            </div>
                          </div>
                          {d.date_prevue && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                              <Clock size={12} /> Livraison prévue : {new Date(d.date_prevue).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                          {d.notes && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>{d.notes}</div>}
                        </div>
                        <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0 }}>
                          {cfg.label}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {d.statut === 'en_attente' && (
                          <button onClick={() => confirmerDemande(d.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1a56db', borderRadius: 8, padding: '7px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                            <CheckCircle size={13} /> Confirmer
                          </button>
                        )}
                        {d.statut === 'confirmee' && (
                          <button onClick={() => expedierDemande(d.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed', borderRadius: 8, padding: '7px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                            <Truck size={13} /> Marquer expédié
                          </button>
                        )}
                        {d.statut === 'expediee' && (
                          <button onClick={() => {
                            setModalReception(d);
                            setRecForm({ quantite_recue: String(d.quantite), notes: '' });
                          }} className="btn-primary">
                            <CheckCircle size={13} /> Confirmer réception
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal réception */}
      {modalReception && (
        <div className="overlay" onClick={() => setModalReception(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: '#0f172a', margin: 0 }}>Confirmer la réception</h2>
              <button onClick={() => setModalReception(null)} style={{ width: 28, height: 28, borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} color="#64748b" />
              </button>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{modalReception.matiere_titre}</div>
              <div style={{ fontSize: 12, color: '#064e3b', marginTop: 3 }}>Commandé : {modalReception.quantite} {modalReception.matiere_unite}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label>Quantité réellement reçue *</label>
                <input className="input-field" type="number" min="0" step="0.01"
                  value={recForm.quantite_recue}
                  onChange={e => setRecForm({ ...recForm, quantite_recue: e.target.value })} />
              </div>
              <div>
                <label>Notes / observations</label>
                <textarea className="input-field" rows={2} placeholder="Qualité, anomalies éventuelles..."
                  value={recForm.notes}
                  onChange={e => setRecForm({ ...recForm, notes: e.target.value } as any)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setModalReception(null)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Annuler</button>
              <button onClick={confirmerReception} disabled={saving} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                <CheckCircle size={14} /> {saving ? 'Enregistrement...' : 'Confirmer la réception'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}