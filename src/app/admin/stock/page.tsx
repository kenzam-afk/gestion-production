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
interface Alerte { type: 'danger' | 'warning'; categorie: string; message: string; detail: string; }
interface StockData {
  produits: ProduitStock[]; matieres: MatiereStock[];
  faisabilite: Faisabilite[]; alertes: Alerte[];
  resume: { produits_rupture: number; produits_critique: number; produits_ok: number; matieres_critique: number; alertes_total: number; };
}

const DS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box}
.btn-primary{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:white;border:none;border-radius:9px;padding:9px 18px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .2s;box-shadow:0 2px 12px rgba(124,58,237,.35)}
.btn-primary:hover{transform:translateY(-1px);filter:brightness(1.1)}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--border);color:var(--text-secondary);border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:var(--violet);color:var(--violet-light);background:rgba(124,58,237,.08)}
.inp{width:100%;background:var(--bg-surface) !important;border:1px solid var(--border) !important;border-radius:9px;padding:10px 13px;font-family:'Outfit',sans-serif;font-size:13.5px;color:var(--text-primary) !important;outline:none;transition:all .15s}
.inp:focus{border-color:var(--violet) !important;box-shadow:0 0 0 3px rgba(124,58,237,.15) !important}
.inp::placeholder{color:var(--text-muted)}
label{font-size:11.5px;font-weight:600;color:var(--text-secondary);margin-bottom:5px;display:block;letter-spacing:.02em}
.tab-btn{flex:1;padding:11px;font-size:13px;font-weight:500;border:none;background:transparent;cursor:pointer;font-family:'Outfit',sans-serif;color:var(--text-secondary);transition:all .15s;border-bottom:2px solid transparent}
.tab-btn.active{color:var(--violet-light);border-bottom-color:var(--violet);background:rgba(124,58,237,.08)}
.tab-btn:not(.active):hover{color:var(--text-primary);background:var(--bg-surface)}
.progress-track{height:6px;background:var(--border);border-radius:3px;overflow:hidden}
.progress-fill{height:100%;border-radius:3px;transition:width .5s ease}
.tr-row{border-bottom:1px solid var(--border);transition:background .15s}
.tr-row:hover td{background:var(--bg-surface) !important}
.overlay{position:fixed;inset:0;background:rgba(4,4,20,.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;animation:fadeIn .2s}
.modal{background:var(--bg-card);border:1px solid var(--border);border-radius:18px;width:100%;max-width:420px;padding:28px;box-shadow:0 32px 80px rgba(0,0,0,.5);animation:slideUp .2s}
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
      body: JSON.stringify({ type: modal.type, id: modal.id, quantite: parseFloat(ajustForm.quantite), operation: ajustForm.operation, raison: ajustForm.raison }),
    });
    setSaving(false);
    setModal(null);
    setAjustForm({ operation: 'entree', quantite: '', raison: '' });
    fetchStock();
  }

  function etatBadge(etat: string) {
    const cfg: Record<string, { bg: string; color: string; border: string; label: string }> = {
      ok:       { bg: 'rgba(16,185,129,.1)',  color: '#10b981', border: 'rgba(16,185,129,.25)', label: 'OK'      },
      bas:      { bg: 'rgba(245,158,11,.1)',  color: '#f59e0b', border: 'rgba(245,158,11,.25)', label: 'Bas'     },
      critique: { bg: 'rgba(239,68,68,.1)',   color: '#ef4444', border: 'rgba(239,68,68,.25)',  label: 'Critique'},
      rupture:  { bg: 'rgba(239,68,68,.1)',   color: '#ef4444', border: 'rgba(239,68,68,.25)',  label: 'Rupture' },
    };
    const c = cfg[etat] || cfg.ok;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
        {c.label}
      </span>
    );
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12, fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ width: 36, height: 36, border: '3px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chargement du stock...</p>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!data) return <div style={{ padding: 24, color: '#ef4444' }}>Erreur de chargement.</div>;

  const { produits, matieres, faisabilite, alertes, resume } = data;

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", padding: '28px 32px', maxWidth: 1400 }}>
      <style>{DS}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Inventaire</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(124,58,237,.4)' }}>
              <BarChart3 size={18} color="white" />
            </div>
            Gestion du Stock
          </h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>
            {resume.alertes_total > 0
              ? `⚠ ${resume.alertes_total} alerte${resume.alertes_total > 1 ? 's' : ''} active${resume.alertes_total > 1 ? 's' : ''}`
              : '✓ Tout est sous contrôle'}
          </p>
        </div>
        <button onClick={fetchStock} className="btn-ghost">
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Produits OK',       value: resume.produits_ok,       color: '#10b981', bg: 'rgba(16,185,129,.1)', border: 'rgba(16,185,129,.2)' },
          { label: 'Stock critique',    value: resume.produits_critique,  color: '#f59e0b', bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.2)' },
          { label: 'En rupture',        value: resume.produits_rupture,   color: '#ef4444', bg: 'rgba(239,68,68,.1)',  border: 'rgba(239,68,68,.2)'  },
          { label: 'Matières critiques',value: resume.matieres_critique,  color: '#a855f7', bg: 'rgba(168,85,247,.1)', border: 'rgba(168,85,247,.2)' },
          { label: 'Alertes totales',   value: resume.alertes_total,      color: '#06b6d4', bg: 'rgba(6,182,212,.1)',  border: 'rgba(6,182,212,.2)'  },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {([
            { id: 'produits',    label: 'Produits finis',         icon: <Package size={14} /> },
            { id: 'matieres',    label: 'Matières premières',     icon: <Layers size={14} /> },
            { id: 'faisabilite', label: 'Faisabilité production', icon: <Zap size={14} /> },
            { id: 'alertes',     label: `Alertes (${alertes.length})`, icon: <AlertTriangle size={14} /> },
          ] as { id: TabId; label: string; icon: any }[]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>

          {/* PRODUITS */}
          {activeTab === 'produits' && (
            <div style={{ overflow: 'hidden', borderRadius: 12, border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                    {['Produit', 'Stock dispo', 'Stock min', 'Demandé', 'Solde', 'État', 'Ajuster'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {produits.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>Aucun produit</td></tr>
                  ) : produits.map(p => {
                    const solde = Number(p.stock_disponible) - Number(p.quantite_demandee);
                    const pct   = Math.min((Number(p.stock_disponible) / Math.max(Number(p.stock_minimum) * 2, 1)) * 100, 100);
                    return (
                      <tr key={p.id} className="tr-row">
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{ width: 32, height: 32, background: 'rgba(124,58,237,.12)', border: '1px solid rgba(124,58,237,.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Package size={14} color="#a855f7" />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{p.nom}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: 15, color: p.etat_stock === 'ok' ? 'var(--text-primary)' : '#ef4444' }}>{p.stock_disponible}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 3 }}>{p.unite}</span>
                            <div className="progress-track" style={{ marginTop: 4 }}>
                              <div className="progress-fill" style={{ width: `${pct}%`, background: p.etat_stock === 'ok' ? '#10b981' : p.etat_stock === 'bas' ? '#f59e0b' : '#ef4444' }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{p.stock_minimum}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <ShoppingCart size={12} color="var(--text-muted)" />
                            <span style={{ fontWeight: 600, fontSize: 13, color: Number(p.quantite_demandee) > 0 ? '#f59e0b' : 'var(--text-muted)' }}>{p.quantite_demandee}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: solde < 0 ? '#ef4444' : solde === 0 ? '#f59e0b' : '#10b981' }}>
                            {solde >= 0 ? '+' : ''}{solde}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>{etatBadge(p.etat_stock)}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <button onClick={() => setModal({ type: 'produit', id: p.id, nom: p.nom })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(124,58,237,.1)', border: '1px solid rgba(124,58,237,.25)', color: '#a855f7', borderRadius: 8, padding: '5px 11px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
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

          {/* MATIÈRES */}
          {activeTab === 'matieres' && (
            <div style={{ overflow: 'hidden', borderRadius: 12, border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                    {['Matière', 'Stock actuel', 'Stock min', 'État', 'Ajuster'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matieres.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucune matière</td></tr>
                  ) : matieres.map(m => {
                    const pct = Math.min((Number(m.stock_actuel) / Math.max(Number(m.stock_minimum) * 2, 1)) * 100, 100);
                    return (
                      <tr key={m.id} className="tr-row">
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{ width: 32, height: 32, background: 'rgba(6,182,212,.12)', border: '1px solid rgba(6,182,212,.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Layers size={14} color="#06b6d4" />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{m.titre}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: m.etat_stock === 'ok' ? 'var(--text-primary)' : '#ef4444' }}>{m.stock_actuel}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 3 }}>{m.unite}</span>
                          <div className="progress-track" style={{ marginTop: 4 }}>
                            <div className="progress-fill" style={{ width: `${pct}%`, background: m.etat_stock === 'ok' ? '#10b981' : m.etat_stock === 'bas' ? '#f59e0b' : '#ef4444' }} />
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{m.stock_minimum} {m.unite}</td>
                        <td style={{ padding: '12px 14px' }}>{etatBadge(m.etat_stock)}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <button onClick={() => setModal({ type: 'matiere', id: m.id, nom: m.titre })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(6,182,212,.1)', border: '1px solid rgba(6,182,212,.25)', color: '#06b6d4', borderRadius: 8, padding: '5px 11px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
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

          {/* FAISABILITÉ */}
          {activeTab === 'faisabilite' && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Nombre d'unités que l'on peut produire avec le stock de matières premières actuel.
              </p>
              {faisabilite.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                  <Zap size={32} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.2 }} />
                  <p style={{ fontSize: 13 }}>Aucune nomenclature définie.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {faisabilite.map(f => {
                    const productibles = Number(f.unites_productibles);
                    const manquantes   = Number(f.matieres_manquantes);
                    const isOk         = manquantes === 0 && productibles > 0;
                    return (
                      <div key={f.produit_id} style={{ background: isOk ? 'rgba(16,185,129,.06)' : 'rgba(239,68,68,.06)', border: `1px solid ${isOk ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)'}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, background: 'var(--bg-surface)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isOk ? <CheckCircle size={20} color="#10b981" /> : <TrendingDown size={20} color="#ef4444" />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{f.produit_nom}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                              {f.nb_matieres_requises} matière{Number(f.nb_matieres_requises) > 1 ? 's' : ''} requise{Number(f.nb_matieres_requises) > 1 ? 's' : ''}
                              {manquantes > 0 && <span style={{ color: '#ef4444', marginLeft: 8 }}>· {manquantes} manquante{manquantes > 1 ? 's' : ''}</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 28, fontWeight: 800, color: isOk ? '#10b981' : '#ef4444', lineHeight: 1 }}>
                            {isOk ? productibles : 0}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>unités productibles</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ALERTES */}
          {activeTab === 'alertes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alertes.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'rgba(16,185,129,.06)', borderRadius: 12, border: '1px solid rgba(16,185,129,.2)' }}>
                  <CheckCircle size={20} color="#10b981" />
                  <div>
                    <p style={{ fontWeight: 600, color: '#10b981', fontSize: 13, margin: 0 }}>Aucune alerte active</p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '2px 0 0' }}>Tous les stocks sont dans les niveaux normaux.</p>
                  </div>
                </div>
              ) : alertes.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '13px 16px', borderRadius: 12, background: a.type === 'danger' ? 'rgba(239,68,68,.06)' : 'rgba(245,158,11,.06)', border: `1px solid ${a.type === 'danger' ? 'rgba(239,68,68,.2)' : 'rgba(245,158,11,.2)'}`, borderLeft: `4px solid ${a.type === 'danger' ? '#ef4444' : '#f59e0b'}` }}>
                  <AlertTriangle size={16} color={a.type === 'danger' ? '#ef4444' : '#f59e0b'} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13, color: a.type === 'danger' ? '#ef4444' : '#f59e0b', margin: 0 }}>{a.message}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{a.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Modal ajustement */}
      {modal && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', margin: 0 }}>Ajuster le stock</h2>
              <button onClick={() => setModal(null)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 9, border: '1px solid var(--border)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{modal.nom}</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label>Opération</label>
                <select className="inp" value={ajustForm.operation} onChange={e => setAjustForm({ ...ajustForm, operation: e.target.value })}>
                  <option value="entree">Entrée (ajouter au stock)</option>
                  <option value="sortie">Sortie (retirer du stock)</option>
                  <option value="ajustement">Ajustement (valeur absolue)</option>
                </select>
              </div>
              <div>
                <label>Quantité</label>
                <input className="inp" type="number" min="0" step="0.01" placeholder="Ex: 50" value={ajustForm.quantite} onChange={e => setAjustForm({ ...ajustForm, quantite: e.target.value })} />
              </div>
              <div>
                <label>Raison (optionnel)</label>
                <input className="inp" placeholder="Ex: réapprovisionnement" value={ajustForm.raison} onChange={e => setAjustForm({ ...ajustForm, raison: e.target.value })} />
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