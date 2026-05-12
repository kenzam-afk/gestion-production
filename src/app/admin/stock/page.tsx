'use client';

import { useEffect, useState } from 'react';
import {
  Package, Layers, AlertTriangle, CheckCircle,
  TrendingDown, RefreshCw, Plus, Minus, X,
  BarChart3, Zap, ShoppingCart,
} from 'lucide-react';

interface ProduitStock {
  id: number; nom: string; unite: string;
  stock_disponible: number; stock_minimum: number;
  prix_vente: number; etat_stock: string;
  quantite_demandee: number;
}

interface MatiereStock {
  id: number; titre: string; unite: string;
  stock_actuel: number; stock_minimum: number;
  etat_stock: string; cout_unitaire: number;
}

interface Faisabilite {
  produit_id: number; produit_nom: string;
  stock_disponible: number; unites_productibles: number;
  nb_matieres_requises: number; matieres_manquantes: number;
}

interface Alerte {
  type: 'danger' | 'warning';
  categorie: string; message: string; detail: string;
}

interface StockData {
  produits: ProduitStock[];
  matieres: MatiereStock[];
  faisabilite: Faisabilite[];
  alertes: Alerte[];
  resume: { produits_rupture: number; produits_critique: number; produits_ok: number; matieres_critique: number; alertes_total: number; };
}

const DS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box}
.btn-primary{display:inline-flex;align-items:center;gap:6px;background:#1a56db;color:white;border:none;border-radius:9px;padding:9px 18px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:background .15s,transform .15s;box-shadow:0 2px 8px rgba(26,86,219,.25)}
.btn-primary:hover{background:#1648c2;transform:translateY(-1px)}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1.5px solid #e2e8f0;color:#64748b;border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:#1a56db;color:#1a56db;background:#eff6ff}
.input-field{width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-family:'DM Sans',sans-serif;font-size:13.5px;color:#1e293b;outline:none;transition:border .15s;background:#f8fafc}
.input-field:focus{border-color:#1a56db;background:white;box-shadow:0 0 0 3px rgba(26,86,219,.08)}
.select-field{width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-family:'DM Sans',sans-serif;font-size:13.5px;color:#1e293b;outline:none;background:#f8fafc}
label{font-size:11.5px;font-weight:600;color:#64748b;margin-bottom:5px;display:block;letter-spacing:.02em}
.tab-btn{flex:1;padding:11px;font-size:13px;font-weight:500;border:none;background:transparent;cursor:pointer;font-family:'DM Sans',sans-serif;color:#64748b;transition:all .15s;border-bottom:2px solid transparent}
.tab-btn.active{color:#1a56db;border-bottom-color:#1a56db;background:#eff6ff}
.tab-btn:not(.active):hover{color:#475569;background:#f8fafc}
.card{background:white;border-radius:14px;border:1px solid #f1f5f9;box-shadow:0 1px 4px rgba(0,0,0,.04)}
.progress-track{height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden}
.progress-fill{height:100%;border-radius:3px;transition:width .5s ease}
.tr-row:hover td{background:#f8fafc}
.overlay{position:fixed;inset:0;background:rgba(8,15,30,.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;animation:fadeIn .2s}
.modal{background:white;border-radius:18px;width:100%;max-width:420px;padding:28px;box-shadow:0 32px 80px rgba(0,0,0,.25);animation:slideUp .2s}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

type TabId = 'produits' | 'matieres' | 'faisabilite' | 'alertes';

export default function StockPage() {
  const [data, setData]       = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('produits');
  const [modal, setModal]     = useState<{ type: 'produit' | 'matiere'; id: number; nom: string } | null>(null);
  const [ajustForm, setAjustForm] = useState({ operation: 'entree', quantite: '', raison: '' });
  const [saving, setSaving]   = useState(false);

  async function fetchStock() {
    setLoading(true);
    try {
      const res  = await fetch('/api/stock');
      const json = await res.json();
      setData(json);
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchStock(); }, []);

  async function handleAjustement() {
    if (!modal || !ajustForm.quantite) return;
    setSaving(true);
    await fetch('/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:      modal.type,
        id:        modal.id,
        quantite:  parseFloat(ajustForm.quantite),
        operation: ajustForm.operation,
        raison:    ajustForm.raison,
      }),
    });
    setSaving(false);
    setModal(null);
    setAjustForm({ operation: 'entree', quantite: '', raison: '' });
    fetchStock();
  }

  function etatBadge(etat: string) {
    const cfg: Record<string, { bg: string; color: string; border: string; label: string }> = {
      ok:       { bg: '#f0fdf4', color: '#059669', border: '#bbf7d0', label: 'OK' },
      bas:      { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'Bas' },
      critique: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Critique' },
      rupture:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Rupture' },
    };
    const c = cfg[etat] || cfg.ok;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
        {c.label}
      </span>
    );
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: 36, height: 36, border: '3px solid #1a56db', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#94a3b8', fontSize: 13 }}>Chargement du stock...</p>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!data) return <div style={{ padding: 24, color: '#dc2626' }}>Erreur de chargement.</div>;

  const { produits, matieres, faisabilite, alertes, resume } = data;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", padding: '28px 32px', maxWidth: 1400 }}>
      <style>{DS}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Inventaire</div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#080f1e,#1a56db)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={18} color="white" />
            </div>
            Gestion du Stock
          </h1>
          <p style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 3 }}>
            {resume.alertes_total > 0
              ? `⚠ ${resume.alertes_total} alerte${resume.alertes_total > 1 ? 's' : ''} active${resume.alertes_total > 1 ? 's' : ''}`
              : '✓ Tout est sous contrôle'}
          </p>
        </div>
        <button onClick={fetchStock} className="btn-ghost">
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser
        </button>
      </div>

      {/* Stats résumé */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Produits OK',      value: resume.produits_ok,       color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Stock critique',   value: resume.produits_critique,  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          { label: 'En rupture',       value: resume.produits_rupture,   color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
          { label: 'Matières critiques', value: resume.matieres_critique, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
          { label: 'Alertes totales',  value: resume.alertes_total,      color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="card">
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
          {([
            { id: 'produits',     label: 'Produits finis',       icon: <Package size={14} /> },
            { id: 'matieres',     label: 'Matières premières',   icon: <Layers size={14} /> },
            { id: 'faisabilite',  label: 'Faisabilité production', icon: <Zap size={14} /> },
            { id: 'alertes',      label: `Alertes (${alertes.length})`, icon: <AlertTriangle size={14} /> },
          ] as { id: TabId; label: string; icon: any }[]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>

          {/* ── TAB PRODUITS ── */}
          {activeTab === 'produits' && (
            <div style={{ overflow: 'hidden', borderRadius: 12, border: '1px solid #f1f5f9' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#080f1e' }}>
                    {['Produit', 'Stock dispo', 'Stock min', 'Demandé', 'Solde', 'État', 'Ajuster'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', fontSize: 10.5, fontWeight: 700, color: '#4d7aa3', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {produits.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>Aucun produit</td></tr>
                  ) : produits.map(p => {
                    const solde = Number(p.stock_disponible) - Number(p.quantite_demandee);
                    const pct   = Math.min((Number(p.stock_disponible) / Math.max(Number(p.stock_minimum) * 2, 1)) * 100, 100);
                    return (
                      <tr key={p.id} className="tr-row" style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{ width: 32, height: 32, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Package size={14} color="#1a56db" />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{p.nom}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div>
                            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: p.etat_stock === 'ok' ? '#0f172a' : '#dc2626' }}>{p.stock_disponible}</span>
                            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 3 }}>{p.unite}</span>
                            <div className="progress-track" style={{ marginTop: 4 }}>
                              <div className="progress-fill" style={{ width: `${pct}%`, background: p.etat_stock === 'ok' ? '#10b981' : p.etat_stock === 'bas' ? '#f59e0b' : '#ef4444' }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: '#64748b' }}>{p.stock_minimum}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <ShoppingCart size={12} color="#94a3b8" />
                            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13, color: Number(p.quantite_demandee) > 0 ? '#d97706' : '#94a3b8' }}>{p.quantite_demandee}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: solde < 0 ? '#dc2626' : solde === 0 ? '#d97706' : '#059669' }}>
                            {solde >= 0 ? '+' : ''}{solde}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>{etatBadge(p.etat_stock)}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <button onClick={() => setModal({ type: 'produit', id: p.id, nom: p.nom })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#475569', borderRadius: 8, padding: '5px 11px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                            <Plus size={12} /><Minus size={12} /> Ajuster
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── TAB MATIÈRES ── */}
          {activeTab === 'matieres' && (
            <div style={{ overflow: 'hidden', borderRadius: 12, border: '1px solid #f1f5f9' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#080f1e' }}>
                    {['Matière', 'Stock actuel', 'Stock min', 'État', 'Ajuster'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', fontSize: 10.5, fontWeight: 700, color: '#4d7aa3', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matieres.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Aucune matière</td></tr>
                  ) : matieres.map(m => {
                    const pct = Math.min((Number(m.stock_actuel) / Math.max(Number(m.stock_minimum) * 2, 1)) * 100, 100);
                    return (
                      <tr key={m.id} className="tr-row" style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{ width: 32, height: 32, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Layers size={14} color="#d97706" />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{m.titre}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: m.etat_stock === 'ok' ? '#0f172a' : '#dc2626' }}>{m.stock_actuel}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 3 }}>{m.unite}</span>
                          <div className="progress-track" style={{ marginTop: 4 }}>
                            <div className="progress-fill" style={{ width: `${pct}%`, background: m.etat_stock === 'ok' ? '#10b981' : m.etat_stock === 'bas' ? '#f59e0b' : '#ef4444' }} />
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: '#64748b' }}>{m.stock_minimum} {m.unite}</td>
                        <td style={{ padding: '12px 14px' }}>{etatBadge(m.etat_stock)}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <button onClick={() => setModal({ type: 'matiere', id: m.id, nom: m.titre })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#475569', borderRadius: 8, padding: '5px 11px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                            <Plus size={12} /><Minus size={12} /> Ajuster
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── TAB FAISABILITÉ ── */}
          {activeTab === 'faisabilite' && (
            <div>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                Nombre d'unités que l'on peut produire avec le stock de matières premières actuel.
              </p>
              {faisabilite.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                  <Zap size={32} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.2 }} />
                  <p style={{ fontSize: 13 }}>Aucune nomenclature définie.<br />Associez des matières premières aux produits pour voir la faisabilité.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {faisabilite.map(f => {
                    const productibles = Number(f.unites_productibles);
                    const manquantes   = Number(f.matieres_manquantes);
                    const isOk         = manquantes === 0 && productibles > 0;
                    return (
                      <div key={f.produit_id} style={{ background: isOk ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isOk ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, background: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            {isOk ? <CheckCircle size={20} color="#059669" /> : <TrendingDown size={20} color="#dc2626" />}
                          </div>
                          <div>
                            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{f.produit_nom}</div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                              {f.nb_matieres_requises} matière{Number(f.nb_matieres_requises) > 1 ? 's' : ''} requise{Number(f.nb_matieres_requises) > 1 ? 's' : ''}
                              {manquantes > 0 && <span style={{ color: '#dc2626', marginLeft: 8 }}>· {manquantes} manquante{manquantes > 1 ? 's' : ''}</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 800, color: isOk ? '#059669' : '#dc2626', lineHeight: 1 }}>
                            {isOk ? productibles : 0}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>unités productibles</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB ALERTES ── */}
          {activeTab === 'alertes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alertes.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                  <CheckCircle size={20} color="#059669" />
                  <div>
                    <p style={{ fontWeight: 600, color: '#059669', fontSize: 13, margin: 0 }}>Aucune alerte active</p>
                    <p style={{ fontSize: 11.5, color: '#16a34a', margin: '2px 0 0' }}>Tous les stocks sont dans les niveaux normaux.</p>
                  </div>
                </div>
              ) : alertes.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '13px 16px', borderRadius: 12, background: a.type === 'danger' ? '#fef2f2' : '#fffbeb', border: `1px solid ${a.type === 'danger' ? '#fecaca' : '#fde68a'}`, borderLeft: `4px solid ${a.type === 'danger' ? '#ef4444' : '#f59e0b'}` }}>
                  <AlertTriangle size={16} color={a.type === 'danger' ? '#dc2626' : '#d97706'} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13, color: a.type === 'danger' ? '#991b1b' : '#92400e', margin: 0 }}>{a.message}</p>
                    <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>{a.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Modal ajustement stock */}
      {modal && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 17, color: '#0f172a', margin: 0 }}>
                Ajuster le stock
              </h2>
              <button onClick={() => setModal(null)} style={{ width: 28, height: 28, borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} color="#64748b" />
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 18, padding: '10px 14px', background: '#f8fafc', borderRadius: 9, border: '1px solid #f1f5f9' }}>
              {modal.type === 'produit' ? <Package size={14} style={{ display: 'inline', marginRight: 5 }} /> : <Layers size={14} style={{ display: 'inline', marginRight: 5 }} />}
              <strong>{modal.nom}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label>Opération</label>
                <select className="select-field" value={ajustForm.operation} onChange={e => setAjustForm({ ...ajustForm, operation: e.target.value })}>
                  <option value="entree">Entrée (ajouter au stock)</option>
                  <option value="sortie">Sortie (retirer du stock)</option>
                  <option value="ajustement">Ajustement (définir valeur absolue)</option>
                </select>
              </div>
              <div>
                <label>Quantité</label>
                <input className="input-field" type="number" min="0" step="0.01" placeholder="Ex: 50" value={ajustForm.quantite} onChange={e => setAjustForm({ ...ajustForm, quantite: e.target.value })} />
              </div>
              <div>
                <label>Raison (optionnel)</label>
                <input className="input-field" placeholder="Ex: réapprovisionnement fournisseur" value={ajustForm.raison} onChange={e => setAjustForm({ ...ajustForm, raison: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setModal(null)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Annuler</button>
              <button onClick={handleAjustement} disabled={saving || !ajustForm.quantite} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                {saving ? 'Enregistrement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}