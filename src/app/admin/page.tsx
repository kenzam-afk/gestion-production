"use client";
import { useEffect, useState } from "react";
import {
  ShoppingCart, Factory, Truck, TrendingUp,
  Clock, CheckCircle2, AlertCircle, Package,
  ArrowUpRight, RefreshCw, Zap, Star,
} from "lucide-react";

const DS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
*, *::before, *::after { box-sizing: border-box; }

.dash {
  font-family: 'Outfit', sans-serif;
  padding: 28px 32px;
  max-width: 1400px;
  min-height: calc(100vh - 62px);
  background: transparent;
}

.dash-title {
  font-size: 26px;
  font-weight: 800;
  color: #f1f0ff;
  letter-spacing: -0.03em;
  margin: 0;
  line-height: 1;
}

.dash-sub {
  font-size: 13px;
  color: #6b6890;
  margin-top: 5px;
  font-weight: 400;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  font-size: 12.5px;
  font-weight: 500;
  color: #a09dc0;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  transition: all 0.2s;
}
.refresh-btn:hover {
  border-color: rgba(124,58,237,0.4);
  color: #c4b5fd;
  background: rgba(124,58,237,0.08);
}

/* Cards grille */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
@media(max-width:1100px){.cards-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.cards-grid{grid-template-columns:1fr}}

.stat-card {
  background: rgba(19,19,42,0.8);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 18px;
  padding: 22px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  cursor: default;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  border-radius: 18px 18px 0 0;
}

.stat-card:hover {
  transform: translateY(-3px);
  border-color: rgba(255,255,255,0.12);
}

.stat-card-wide {
  grid-column: span 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px;
}
@media(max-width:600px){.stat-card-wide{grid-column:span 1;flex-direction:column;gap:12px}}

/* Orb déco */
.card-orb {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.15;
  top: -20px;
  right: -20px;
  pointer-events: none;
}

.card-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.card-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b6890;
  letter-spacing: 0.02em;
  margin-bottom: 4px;
}

.card-value {
  font-size: 32px;
  font-weight: 800;
  color: #f1f0ff;
  letter-spacing: -0.03em;
  line-height: 1;
}

.card-value-wide {
  font-size: 40px;
}

.card-trend {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  color: #10b981;
  background: rgba(16,185,129,0.12);
  padding: 3px 8px;
  border-radius: 20px;
  margin-top: 8px;
}

/* Bottom panels */
.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media(max-width:800px){.bottom-row{grid-template-columns:1fr}}

.panel {
  background: rgba(19,19,42,0.8);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 18px;
  padding: 22px;
}

.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: #e2e0ff;
  margin-bottom: 18px;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-title-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #ec4899);
  box-shadow: 0 0 8px rgba(124,58,237,0.5);
}

.progress-row { display: flex; flex-direction: column; gap: 14px; }

.progress-item { display: flex; flex-direction: column; gap: 6px; }

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-name { font-size: 12.5px; font-weight: 500; color: #a09dc0; }
.progress-pct { font-size: 12px; font-weight: 700; color: #f1f0ff; }

.progress-track {
  height: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Status rows */
.status-list { display: flex; flex-direction: column; gap: 8px; }

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.05);
  background: rgba(255,255,255,0.02);
  transition: all 0.2s;
}

.status-row:hover {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.08);
}

.status-left { display: flex; align-items: center; gap: 10px; }

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
}

.status-label { font-size: 13px; font-weight: 500; color: #c4c0e8; }
.status-count { font-size: 16px; font-weight: 800; color: #f1f0ff; }

/* Skeleton */
.skeleton {
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}
@keyframes shimmer {
  0%{background-position:200% 0}
  100%{background-position:-200% 0}
}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

/* Titre gradient */
.gradient-text {
  background: linear-gradient(135deg, #a855f7, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
`;

const CARD_CONFIGS = [
  {
    label: 'Total commandes',
    key: 'total',
    icon: ShoppingCart,
    color: '#a855f7',
    orb: '#a855f7',
    grad: 'linear-gradient(135deg,#7c3aed,#a855f7)',
    trend: '+12%',
  },
  {
    label: 'En attente',
    key: 'attente',
    icon: Clock,
    color: '#f59e0b',
    orb: '#f59e0b',
    grad: 'linear-gradient(135deg,#d97706,#f59e0b)',
    trend: null,
  },
  {
    label: 'En fabrication',
    key: 'fabrication',
    icon: Factory,
    color: '#ec4899',
    orb: '#ec4899',
    grad: 'linear-gradient(135deg,#be185d,#ec4899)',
    trend: null,
  },
  {
    label: 'Livrées',
    key: 'livrees',
    icon: Truck,
    color: '#10b981',
    orb: '#10b981',
    grad: 'linear-gradient(135deg,#059669,#10b981)',
    trend: '+8%',
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, attente: 0, fabrication: 0, livrees: 0, ca: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch('/api/commandes');
      if (!res.ok) throw new Error();
      const commandes = await res.json();
      setStats({
        total:       commandes.length,
        attente:     commandes.filter((c: any) => c.statut === 'en_attente' || c.statut === 'confirmee').length,
        fabrication: commandes.filter((c: any) => c.statut === 'en_fabrication').length,
        livrees:     commandes.filter((c: any) => c.statut === 'livree').length,
        ca:          commandes.reduce((a: number, c: any) => a + (Number(c.total) || 0), 0),
      });
      setLastUpdate(new Date().toLocaleTimeString('fr-FR'));
    } catch { /* silent */ }
    setLoading(false);
  }

  useEffect(() => { fetchStats(); }, []);

  const taux = stats.total > 0 ? Math.round((stats.livrees / stats.total) * 100) : 0;

  return (
    <>
      <style>{DS}</style>
      <div className="dash">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 20, padding: '4px 12px', marginBottom: 10 }}>
              <Zap size={12} color="#a855f7" />
              <span style={{ fontSize: 11, color: '#c4b5fd', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Vue d'ensemble</span>
            </div>
            <h1 className="dash-title">
              Tableau de <span className="gradient-text">bord</span>
            </h1>
            <p className="dash-sub">
              Production & Livraison{lastUpdate && ` · ${lastUpdate}`}
            </p>
          </div>
          <button className="refresh-btn" onClick={fetchStats} disabled={loading}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Actualiser
          </button>
        </div>

        {/* Stat cards */}
        <div className="cards-grid">
          {CARD_CONFIGS.map((c, i) => {
            const Icon = c.icon;
            const val  = stats[c.key as keyof typeof stats] as number;
            return (
              <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="card-orb" style={{ background: c.orb }} />
                <div className="stat-card-inner" style={{ position: 'relative', zIndex: 1 }}>
                  <div className="card-icon-wrap" style={{ background: c.orb + '18' }}>
                    <Icon size={20} color={c.color} />
                  </div>
                  <div className="card-label">{c.label}</div>
                  {loading
                    ? <div className="skeleton" style={{ width: 80, height: 32, marginTop: 4 }} />
                    : <div className="card-value">{val}</div>
                  }
                  {c.trend && (
                    <div className="card-trend">
                      <ArrowUpRight size={11} /> {c.trend}
                    </div>
                  )}
                </div>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.grad, borderRadius: '18px 18px 0 0' }} />
              </div>
            );
          })}

          {/* CA wide card */}
          <div className="stat-card stat-card-wide">
            <div className="card-orb" style={{ background: '#06b6d4', left: -20, right: 'auto' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div className="card-icon-wrap" style={{ background: 'rgba(6,182,212,0.12)', marginBottom: 0 }}>
                  <TrendingUp size={22} color="#06b6d4" />
                </div>
                <div className="card-label" style={{ marginBottom: 0 }}>Chiffre d'affaires</div>
              </div>
              {loading
                ? <div className="skeleton" style={{ width: 200, height: 40, marginTop: 8 }} />
                : <div className="card-value card-value-wide" style={{ color: '#06b6d4' }}>
                    {stats.ca.toLocaleString('fr-DZ')} <span style={{ fontSize: 18, color: '#22d3ee', fontWeight: 500 }}>DA</span>
                  </div>
              }
            </div>
            <div className="card-trend" style={{ color: '#06b6d4', background: 'rgba(6,182,212,0.12)', alignSelf: 'flex-start' }}>
              <ArrowUpRight size={12} /> +23%
            </div>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#06b6d4,#7c3aed)', borderRadius: '18px 18px 0 0' }} />
          </div>
        </div>

        {/* Bottom panels */}
        <div className="bottom-row">

          {/* Répartition */}
          <div className="panel">
            <div className="panel-title">
              <div className="panel-title-dot" />
              Répartition des commandes
            </div>
            <div className="progress-row">
              {[
                { label: 'En attente / Confirmées', count: stats.attente,     color: '#f59e0b', grad: 'linear-gradient(90deg,#d97706,#f59e0b)' },
                { label: 'En fabrication',           count: stats.fabrication, color: '#ec4899', grad: 'linear-gradient(90deg,#be185d,#ec4899)' },
                { label: 'Livrées',                  count: stats.livrees,     color: '#10b981', grad: 'linear-gradient(90deg,#059669,#10b981)' },
              ].map((item, i) => {
                const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                return (
                  <div key={i} className="progress-item">
                    <div className="progress-info">
                      <span className="progress-name">{item.label}</span>
                      <span className="progress-pct">{item.count} <span style={{ color: item.color }}>({pct}%)</span></span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: item.grad }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Taux livraison */}
            <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, color: '#a09dc0', fontWeight: 500 }}>Taux de livraison</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#f1f0ff' }}>{taux}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${taux}%`, background: 'linear-gradient(90deg,#7c3aed,#10b981)' }} />
              </div>
            </div>
          </div>

          {/* Statuts */}
          <div className="panel">
            <div className="panel-title">
              <div className="panel-title-dot" style={{ background: 'linear-gradient(135deg,#06b6d4,#7c3aed)', boxShadow: '0 0 8px rgba(6,182,212,0.5)' }} />
              Statuts en temps réel
            </div>
            <div className="status-list">
              {[
                { label: 'Total commandes',  count: stats.total,       color: '#a855f7' },
                { label: 'En attente',        count: stats.attente,     color: '#f59e0b' },
                { label: 'En fabrication',    count: stats.fabrication, color: '#ec4899' },
                { label: 'Livrées',           count: stats.livrees,     color: '#10b981' },
              ].map((s, i) => (
                <div key={i} className="status-row">
                  <div className="status-left">
                    <div className="status-dot" style={{ background: s.color, color: s.color }} />
                    <span className="status-label">{s.label}</span>
                  </div>
                  {loading
                    ? <div className="skeleton" style={{ width: 32, height: 20 }} />
                    : <span className="status-count">{s.count}</span>
                  }
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}