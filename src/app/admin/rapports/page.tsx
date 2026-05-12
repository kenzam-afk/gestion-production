'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Package, ShoppingCart, AlertTriangle, ArrowUp, ArrowDown, Minus, ShoppingBag, RefreshCw } from 'lucide-react';

interface IntelligenceData {
  kpis: { chiffreAffaires: number; totalCommandes: number; totalProduits: number; totalClients: number; rotationStock: number; scoreStockPct: number; };
  bestSellers: { produit_id: number; nom: string; total_commandes: number; total_quantite: number; evolution_pct: number; }[];
  commandesParStatut: { statut: string; count: number; }[];
  stockCritique: { id: number; nom: string; stock_disponible: number; stock_minimum: number; jours_restants: number; categorie: string; }[];
  stockSurplus: { id: number; nom: string; stock_disponible: number; stock_minimum: number; ratio_surplus: number; }[];
  dernieresCommandes: { id: number; client_nom: string; statut: string; total: number; created_at: string; }[];
}

const STATUT_LABELS: Record<string, string> = { en_attente: 'En attente', confirmee: 'Confirmée', en_fabrication: 'En fabrication', livree: 'Livrée', annulee: 'Annulée' };
const STATUT_COLOR: Record<string, { bar: string; bg: string; color: string; border: string }> = {
  en_attente:     { bar: '#f59e0b', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  confirmee:      { bar: '#1a56db', bg: '#eff6ff', color: '#1a56db', border: '#bfdbfe' },
  en_fabrication: { bar: '#7c3aed', bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
  livree:         { bar: '#059669', bg: '#f0fdf4', color: '#059669', border: '#bbf7d0' },
  annulee:        { bar: '#ef4444', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};
const TABS = [{ id: 'commandes', label: 'Produits commandés' }, { id: 'stock', label: 'Analyse stock' }, { id: 'alertes', label: 'Alertes & actions' }] as const;
type TabId = typeof TABS[number]['id'];

const DS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1.5px solid #e2e8f0;color:#64748b;border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:#1a56db;color:#1a56db;background:#eff6ff}
.tab-btn{flex:1;padding:11px;font-size:13px;font-weight:500;border:none;background:transparent;cursor:pointer;font-family:'DM Sans',sans-serif;color:#64748b;transition:all .15s;border-bottom:2px solid transparent}
.tab-btn.active{color:#1a56db;border-bottom-color:#1a56db;background:#eff6ff}
.tab-btn:not(.active):hover{color:#475569;background:#f8fafc}
.progress-track{height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden}
.progress-fill{height:100%;border-radius:3px;transition:width .6s ease}
.kpi-card{background:white;border-radius:14px;padding:18px 20px;border:1px solid #f1f5f9;box-shadow:0 1px 4px rgba(0,0,0,.04);display:flex;align-items:center;gap:14px}
.panel{background:white;border-radius:14px;border:1px solid #f1f5f9;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function Rapports() {
  const [data, setData]           = useState<IntelligenceData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('commandes');
  const [refreshing, setRefreshing] = useState(false);

  async function fetchData() {
    try { const res = await fetch('/api/rapports/intelligence'); setData(await res.json()); }
    catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { fetchData(); }, []);
  function refresh() { setRefreshing(true); fetchData(); }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid #1a56db', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#94a3b8', fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>Chargement des analyses...</p>
    </div>
  );

  if (!data) return <div style={{ padding: 24, color: '#dc2626', fontFamily: "'DM Sans',sans-serif" }}>Erreur lors du chargement.</div>;

  const { kpis, bestSellers, commandesParStatut, stockCritique, stockSurplus, dernieresCommandes } = data;
  const maxCmd     = bestSellers[0]?.total_commandes || 1;
  const totalStat  = commandesParStatut.reduce((a, s) => a + s.count, 0);
  const alertesUrg = stockCritique.filter(p => p.jours_restants !== null && p.jours_restants <= 3);
  const alertesWrn = stockCritique.filter(p => p.jours_restants === null || p.jours_restants > 3);

  const kpiCards = [
    { label: "Chiffre d'affaires", value: `${kpis.chiffreAffaires.toLocaleString('fr-FR')} DA`, icon: <TrendingUp size={18} />, color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
    { label: "Commandes",          value: kpis.totalCommandes, icon: <ShoppingCart size={18} />, color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
    { label: "Produits",           value: kpis.totalProduits,  icon: <Package size={18} />,      color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    { label: "Clients",            value: kpis.totalClients,   icon: <BarChart3 size={18} />,    color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", padding: '28px 32px', maxWidth: 1400 }}>
      <style>{DS}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Intelligence</div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#080f1e,#1a56db)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={18} color="white" />
            </div>
            Rapports & Analyse
          </h1>
          <p style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 3 }}>Intelligence commerciale — stocks, ventes & recommandations</p>
        </div>
        <button onClick={refresh} disabled={refreshing} className="btn-ghost">
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {kpiCards.map((k, i) => (
          <div key={i} className="kpi-card" style={{ border: `1px solid ${k.border}`, background: k.bg }}>
            <div style={{ width: 40, height: 40, background: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: k.color, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{k.label}</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, color: k.color, marginTop: 2 }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Score stock */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,.04)', padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Score santé du stock</span>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: kpis.scoreStockPct >= 70 ? '#059669' : kpis.scoreStockPct >= 40 ? '#d97706' : '#dc2626' }}>
            {kpis.scoreStockPct}%
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${kpis.scoreStockPct}%`, background: kpis.scoreStockPct >= 70 ? '#10b981' : kpis.scoreStockPct >= 40 ? '#f59e0b' : '#ef4444' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
          <span>Critique</span><span>Optimal</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="panel">
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}>{tab.label}</button>
          ))}
        </div>

        <div style={{ padding: 24 }}>

          {/* TAB commandes */}
          {activeTab === 'commandes' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Best-sellers (30 derniers jours)</div>
                {bestSellers.length === 0 ? <p style={{ color: '#94a3b8', fontSize: 13 }}>Aucune commande.</p> : bestSellers.map((p, i) => (
                  <div key={p.produit_id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', minWidth: 16 }}>#{i+1}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{p.nom}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p.evolution_pct > 0 ? <span style={{ fontSize: 11, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}><ArrowUp size={11} />+{p.evolution_pct}%</span>
                          : p.evolution_pct < 0 ? <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}><ArrowDown size={11} />{p.evolution_pct}%</span>
                          : <Minus size={11} color="#94a3b8" />}
                        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: '#334155' }}>{p.total_commandes} cmd</span>
                      </div>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${(p.total_commandes / maxCmd) * 100}%`, background: '#1a56db' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Commandes par statut</div>
                {commandesParStatut.map(s => {
                  const cfg = STATUT_COLOR[s.statut] || { bar: '#94a3b8', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
                  return (
                    <div key={s.statut} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                        <span style={{ color: '#475569' }}>{STATUT_LABELS[s.statut] || s.statut}</span>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{s.count}</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${totalStat > 0 ? (s.count / totalStat) * 100 : 0}%`, background: cfg.bar }} />
                      </div>
                    </div>
                  );
                })}

                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '20px 0 12px' }}>Dernières commandes</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dernieresCommandes.map(c => {
                    const cfg = STATUT_COLOR[c.statut] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
                    return (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{c.client_nom}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>#{c.id}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                            {STATUT_LABELS[c.statut] || c.statut}
                          </span>
                          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: '#059669' }}>{Number(c.total).toLocaleString('fr-FR')} DA</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB stock */}
          {activeTab === 'stock' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={13} /> Stock critique
                </div>
                {stockCritique.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: 20 }}>✅</span>
                    <div>
                      <p style={{ fontWeight: 600, color: '#059669', fontSize: 13, margin: 0 }}>Aucun stock critique</p>
                      <p style={{ fontSize: 11, color: '#16a34a', margin: '2px 0 0' }}>Tous les produits sont au-dessus du seuil minimum.</p>
                    </div>
                  </div>
                ) : stockCritique.map(p => (
                  <div key={p.id} style={{ padding: 14, borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <p style={{ fontWeight: 600, color: '#0f172a', fontSize: 13, margin: 0 }}>{p.nom}</p>
                        <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>{p.categorie}</p>
                      </div>
                      <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: p.jours_restants !== null && p.jours_restants <= 2 ? '#dc2626' : '#fffbeb', color: p.jours_restants !== null && p.jours_restants <= 2 ? 'white' : '#d97706' }}>
                        {p.jours_restants !== null ? `~${p.jours_restants}j` : 'Rupture'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748b', marginBottom: 6 }}>
                      <span>Stock: <strong style={{ color: '#dc2626' }}>{p.stock_disponible}</strong></span>
                      <span>Min: {p.stock_minimum}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${Math.min((p.stock_disponible / p.stock_minimum) * 100, 100)}%`, background: '#ef4444' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShoppingBag size={13} /> Surplus — à ne plus commander
                </div>
                {stockSurplus.length === 0 ? <p style={{ color: '#94a3b8', fontSize: 13 }}>Aucun surplus détecté.</p>
                  : stockSurplus.map(p => (
                  <div key={p.id} style={{ padding: 14, borderRadius: 12, border: '1px solid #bbf7d0', background: '#f0fdf4', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <p style={{ fontWeight: 600, color: '#0f172a', fontSize: 13, margin: 0 }}>{p.nom}</p>
                      <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#059669', color: 'white' }}>×{p.ratio_surplus.toFixed(1)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748b', marginBottom: 6 }}>
                      <span>Stock: <strong style={{ color: '#059669' }}>{p.stock_disponible}</strong></span>
                      <span>Min: {p.stock_minimum}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: '100%', background: '#10b981' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB alertes */}
          {activeTab === 'alertes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Actions prioritaires</div>

              {alertesUrg.length === 0 && alertesWrn.length === 0 && stockSurplus.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: 20 }}>🟢</span>
                  <p style={{ fontWeight: 600, color: '#059669', fontSize: 13, margin: 0 }}>Tout va bien ! Aucune action urgente requise.</p>
                </div>
              )}

              {alertesUrg.map(p => <AlerteRow key={'u'+p.id} niveau="danger" titre={`Rupture imminente — ${p.nom}`} desc={`Stock: ${p.stock_disponible} / Min: ${p.stock_minimum} / ~${p.jours_restants} jour(s). Commander immédiatement.`} />)}
              {alertesWrn.map(p => <AlerteRow key={'w'+p.id} niveau="warn" titre={`Stock bas — ${p.nom}`} desc={`Stock: ${p.stock_disponible} / Min: ${p.stock_minimum}. Planifier un réapprovisionnement.`} />)}
              {stockSurplus.slice(0, 3).map(p => <AlerteRow key={'s'+p.id} niveau="info" titre={`Surplus — ${p.nom}`} desc={`Stock ${p.ratio_surplus.toFixed(1)}× au-dessus du minimum. Stopper les commandes.`} />)}
              {bestSellers[0] && <AlerteRow niveau="success" titre={`Opportunité — ${bestSellers[0].nom}`} desc={`Best-seller : ${bestSellers[0].total_commandes} commandes. ${bestSellers[0].evolution_pct > 0 ? `+${bestSellers[0].evolution_pct}% ce mois.` : ''} Augmenter la production préventive.`} />}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function AlerteRow({ niveau, titre, desc }: { niveau: 'danger' | 'warn' | 'success' | 'info'; titre: string; desc: string }) {
  const styles = {
    danger:  { bg: '#fef2f2', border: '1px solid #fecaca', left: '#ef4444', dot: '🔴', titleColor: '#991b1b' },
    warn:    { bg: '#fffbeb', border: '1px solid #fde68a', left: '#f59e0b', dot: '🟡', titleColor: '#92400e' },
    success: { bg: '#f0fdf4', border: '1px solid #bbf7d0', left: '#10b981', dot: '🟢', titleColor: '#065f46' },
    info:    { bg: '#eff6ff', border: '1px solid #bfdbfe', left: '#3b82f6', dot: '🔵', titleColor: '#1e3a8a' },
  };
  const s = styles[niveau];
  return (
    <div style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 12, background: s.bg, border: s.border, borderLeft: `4px solid ${s.left}` }}>
      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{s.dot}</span>
      <div>
        <p style={{ fontWeight: 600, fontSize: 13, color: s.titleColor, margin: 0 }}>{titre}</p>
        <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>{desc}</p>
      </div>
    </div>
  );
}