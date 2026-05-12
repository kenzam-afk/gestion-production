"use client";
import { useEffect, useState } from "react";
import {
  ShoppingCart, Factory, Truck, TrendingUp,
  Clock, CheckCircle2, AlertCircle, Package,
  ArrowUpRight, RefreshCw,
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0, attente: 0, fabrication: 0, livrees: 0, ca: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch('/api/commandes');
      if (!res.ok) throw new Error();
      const commandes = await res.json();
      setStats({
        total: commandes.length,
        attente: commandes.filter((c: any) => c.statut === 'en_attente' || c.statut === 'confirmee').length,
        fabrication: commandes.filter((c: any) => c.statut === 'en_fabrication').length,
        livrees: commandes.filter((c: any) => c.statut === 'livree').length,
        ca: commandes.reduce((acc: number, c: any) => acc + (Number(c.total) || 0), 0),
      });
      setLastUpdate(new Date().toLocaleTimeString('fr-FR'));
    } catch { /* silently fail */ }
    setLoading(false);
  }

  useEffect(() => { fetchStats(); }, []);

  const cards = [
    {
      label: 'Total commandes',
      value: stats.total,
      icon: ShoppingCart,
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.08)',
      border: 'rgba(59,130,246,0.18)',
      trend: '+12%',
    },
    {
      label: 'En attente',
      value: stats.attente,
      icon: Clock,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.18)',
      trend: null,
    },
    {
      label: 'En fabrication',
      value: stats.fabrication,
      icon: Factory,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.08)',
      border: 'rgba(139,92,246,0.18)',
      trend: null,
    },
    {
      label: 'Livrées',
      value: stats.livrees,
      icon: Truck,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.08)',
      border: 'rgba(16,185,129,0.18)',
      trend: '+8%',
    },
    {
      label: "Chiffre d'affaires",
      value: `${stats.ca.toLocaleString('fr-DZ')} DA`,
      icon: TrendingUp,
      color: '#06b6d4',
      bg: 'rgba(6,182,212,0.08)',
      border: 'rgba(6,182,212,0.18)',
      trend: '+23%',
      wide: true,
    },
  ];

  const taux = stats.total > 0 ? Math.round((stats.livrees / stats.total) * 100) : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

        .dash-root {
          font-family: 'DM Sans', sans-serif;
          padding: 28px 32px;
          max-width: 1400px;
          min-height: calc(100vh - 58px);
        }

        .dash-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .dash-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .dash-sub {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 3px;
          font-weight: 400;
        }

        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .refresh-btn:hover { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 1100px) { .cards-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px)  { .cards-grid { grid-template-columns: 1fr; } }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: box-shadow 0.2s, transform 0.2s;
          position: relative;
          overflow: hidden;
        }
        .stat-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }

        .stat-card-wide {
          grid-column: span 2;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px;
        }

        @media (max-width: 1100px) { .stat-card-wide { grid-column: span 2; } }
        @media (max-width: 600px)  { .stat-card-wide { grid-column: span 1; flex-direction: column; } }

        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-trend {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          font-weight: 600;
          color: #10b981;
          background: #f0fdf4;
          padding: 3px 8px;
          border-radius: 20px;
        }

        .card-label {
          font-size: 12px;
          font-weight: 500;
          color: #94a3b8;
          letter-spacing: 0.01em;
        }

        .card-value {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 30px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .card-value-wide {
          font-size: 36px;
        }

        .card-stripe {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 16px 16px 0 0;
        }

        /* Bottom row */
        .bottom-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 800px) { .bottom-row { grid-template-columns: 1fr; } }

        .panel {
          background: white;
          border-radius: 16px;
          padding: 22px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .panel-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 16px;
          letter-spacing: -0.01em;
        }

        .progress-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .progress-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .progress-name {
          font-size: 12.5px;
          font-weight: 500;
          color: #475569;
        }

        .progress-pct {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
        }

        .progress-track {
          height: 6px;
          background: #f1f5f9;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.6s ease;
        }

        .status-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #f1f5f9;
        }

        .status-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-label {
          font-size: 13px;
          font-weight: 500;
          color: #334155;
        }

        .status-count {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }

        .skeleton {
          animation: pulse 1.5s ease-in-out infinite;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          border-radius: 6px;
        }
        @keyframes pulse {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="dash-root">

        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Tableau de bord</h1>
            <p className="dash-sub">
              Vue d'ensemble de la production
              {lastUpdate && ` · Mis à jour à ${lastUpdate}`}
            </p>
          </div>
          <button className="refresh-btn" onClick={fetchStats} disabled={loading}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Actualiser
          </button>
        </div>

        {/* Cards */}
        <div className="cards-grid">
          {cards.map((c, i) => {
            const Icon = c.icon;
            if (c.wide) return (
              <div key={i} className="stat-card stat-card-wide">
                <div className="card-stripe" style={{ background: c.color }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="card-icon" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                    <Icon size={20} color={c.color} />
                  </div>
                  <div>
                    <div className="card-label">{c.label}</div>
                    {loading
                      ? <div className="skeleton" style={{ width: 180, height: 36, marginTop: 6 }} />
                      : <div className="card-value card-value-wide">{c.value}</div>
                    }
                  </div>
                </div>
                {c.trend && (
                  <div className="card-trend">
                    <ArrowUpRight size={12} />
                    {c.trend}
                  </div>
                )}
              </div>
            );
            return (
              <div key={i} className="stat-card">
                <div className="card-stripe" style={{ background: c.color }} />
                <div className="card-top">
                  <div className="card-icon" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                    <Icon size={18} color={c.color} />
                  </div>
                  {c.trend && (
                    <div className="card-trend">
                      <ArrowUpRight size={12} />
                      {c.trend}
                    </div>
                  )}
                </div>
                <div>
                  <div className="card-label">{c.label}</div>
                  {loading
                    ? <div className="skeleton" style={{ width: 80, height: 30, marginTop: 6 }} />
                    : <div className="card-value">{c.value}</div>
                  }
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom panels */}
        <div className="bottom-row">

          {/* Répartition */}
          <div className="panel">
            <div className="panel-title">Répartition des commandes</div>
            <div className="progress-row">
              {[
                { label: 'En attente / Confirmées', count: stats.attente, color: '#f59e0b' },
                { label: 'En fabrication',           count: stats.fabrication, color: '#8b5cf6' },
                { label: 'Livrées',                  count: stats.livrees, color: '#10b981' },
              ].map((item, i) => {
                const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                return (
                  <div key={i} className="progress-item">
                    <div className="progress-info">
                      <span className="progress-name">{item.label}</span>
                      <span className="progress-pct">{item.count} ({pct}%)</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statuts */}
          <div className="panel">
            <div className="panel-title">Statuts en temps réel</div>
            <div className="status-list">
              {[
                { label: 'Total commandes',  count: stats.total,       color: '#3b82f6', bg: '#eff6ff' },
                { label: 'En attente',        count: stats.attente,     color: '#f59e0b', bg: '#fffbeb' },
                { label: 'En fabrication',    count: stats.fabrication, color: '#8b5cf6', bg: '#f5f3ff' },
                { label: 'Livrées',           count: stats.livrees,     color: '#10b981', bg: '#f0fdf4' },
              ].map((s, i) => (
                <div key={i} className="status-row" style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
                  <div className="status-left">
                    <div className="status-dot" style={{ background: s.color }} />
                    <span className="status-label">{s.label}</span>
                  </div>
                  <span className="status-count">{loading ? '—' : s.count}</span>
                </div>
              ))}
            </div>

            {/* Taux livraison */}
            <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Taux de livraison</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{taux}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${taux}%`, background: 'linear-gradient(90deg, #3b82f6, #10b981)' }} />
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}