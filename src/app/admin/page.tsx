"use client";
import { useEffect, useState } from "react";
import {
  ShoppingCart, Factory, Truck, TrendingUp,
  Clock, Package, ArrowUpRight, RefreshCw, Zap,
  Activity, ShoppingBag, Settings, CheckCircle,
  AlertTriangle, User, Box,
} from "lucide-react";

interface JournalEntry {
  id: number;
  entite_type: string;
  entite_id: number;
  action: string;
  ancien_etat: string | null;
  nouvel_etat: string | null;
  details: string | null;
  created_at: string;
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} j`;
}

function getActionIcon(entite_type: string, action: string) {
  if (entite_type === 'commande') return { icon: ShoppingBag, color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.2)' };
  if (entite_type === 'livraison') return { icon: Truck, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.2)' };
  if (entite_type === 'fabrication' || entite_type === 'ordre_fabrication') return { icon: Factory, color: '#ec4899', bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.2)' };
  if (entite_type === 'stock' || entite_type === 'matiere') return { icon: Box, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)' };
  if (entite_type === 'client') return { icon: User, color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)' };
  if (action?.includes('valider') || action?.includes('terminer')) return { icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)' };
  if (action?.includes('alerte') || action?.includes('critique')) return { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)' };
  return { icon: Activity, color: '#6b6890', bg: 'rgba(107,104,144,0.1)', border: 'rgba(107,104,144,0.15)' };
}

const DS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
*, *::before, *::after { box-sizing: border-box; }

.dash {
  font-family: 'Outfit', sans-serif;
  padding: 28px 32px;
  max-width: 1400px;
  min-height: calc(100vh - 62px);
}

.dash-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 12px;
}

.dash-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(124,58,237,0.12);
  border: 1px solid rgba(124,58,237,0.25);
  border-radius: 20px;
  padding: 4px 12px;
  margin-bottom: 10px;
}

.dash-title {
  font-size: 26px;
  font-weight: 800;
  color: #f1f0ff;
  margin: 0;
  letter-spacing: -0.03em;
  line-height: 1;
}

.dash-sub {
  font-size: 13px;
  color: #5c5a7a;
  margin-top: 5px;
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
.refresh-btn:hover { border-color: rgba(124,58,237,0.4); color: #c4b5fd; background: rgba(124,58,237,0.08); }

/* Cards */
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
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}
.stat-card:hover {
  border-color: rgba(255,255,255,0.12);
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.3);
}

.stat-card-wide {
  grid-column: span 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 26px;
}
@media(max-width:600px){.stat-card-wide{grid-column:span 1;flex-direction:column;gap:12px}}

.card-orb {
  position: absolute;
  width: 100px; height: 100px;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.15;
  top: -20px; right: -20px;
  pointer-events: none;
}

.card-stripe {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  border-radius: 18px 18px 0 0;
}

.card-icon {
  width: 42px; height: 42px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 14px;
}

.card-label {
  font-size: 12px; font-weight: 500;
  color: #5c5a7a; letter-spacing: 0.02em;
  margin-bottom: 4px;
}

.card-value {
  font-size: 32px; font-weight: 800;
  color: #f1f0ff; letter-spacing: -0.03em;
  line-height: 1;
}

.card-trend {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 11px; font-weight: 600;
  color: #10b981;
  background: rgba(16,185,129,0.12);
  padding: 3px 8px; border-radius: 20px;
  margin-top: 8px;
}

/* Bottom row — 3 colonnes */
.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}
@media(max-width:1100px){.bottom-row{grid-template-columns:1fr 1fr}}
@media(max-width:700px){.bottom-row{grid-template-columns:1fr}}

.panel {
  background: rgba(19,19,42,0.8);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 18px;
  padding: 22px;
}

.panel-title {
  font-size: 14px; font-weight: 700;
  color: #e2e0ff; margin-bottom: 18px;
  letter-spacing: -0.01em;
  display: flex; align-items: center; gap: 8px;
}

.panel-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #ec4899);
  box-shadow: 0 0 8px rgba(124,58,237,0.5);
}

.prog-track { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
.prog-fill { height: 100%; border-radius: 3px; transition: width 0.8s ease; }

.status-row {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 10px 14px; border-radius: 11px;
  border: 1px solid rgba(255,255,255,0.05);
  background: rgba(255,255,255,0.02);
  transition: all 0.15s; margin-bottom: 8px;
}
.status-row:hover { background: rgba(255,255,255,0.04); }

/* Journal */
.journal-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  transition: all 0.15s;
}
.journal-item:last-child { border-bottom: none; }
.journal-item:hover { background: rgba(255,255,255,0.02); border-radius: 10px; padding-left: 8px; padding-right: 8px; margin: 0 -8px; }

.journal-icon {
  width: 32px; height: 32px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.journal-action {
  font-size: 12.5px; font-weight: 600;
  color: #e2e0ff; line-height: 1.3;
}

.journal-detail {
  font-size: 11.5px; color: #5c5a7a;
  margin-top: 2px; line-height: 1.4;
}

.journal-time {
  font-size: 10.5px; color: #4a4870;
  flex-shrink: 0; margin-top: 2px;
}

.skeleton {
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

.grad-text {
  background: linear-gradient(135deg, #a855f7, #ec4899);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
`;

const CARD_CONFIGS = [
  { label: 'Total commandes', key: 'total',       color: '#a855f7', grad: 'linear-gradient(135deg,#7c3aed,#a855f7)', trend: '+12%' },
  { label: 'En attente',      key: 'attente',      color: '#f59e0b', grad: 'linear-gradient(135deg,#d97706,#f59e0b)', trend: null },
  { label: 'En fabrication',  key: 'fabrication',  color: '#ec4899', grad: 'linear-gradient(135deg,#be185d,#ec4899)', trend: null },
  { label: 'Livrées',         key: 'livrees',      color: '#10b981', grad: 'linear-gradient(135deg,#059669,#10b981)', trend: '+8%' },
];

const ICONS = [ShoppingCart, Clock, Factory, Truck];

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, attente: 0, fabrication: 0, livrees: 0, ca: 0 });
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [journalLoading, setJournalLoading] = useState(true);
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

  async function fetchJournal() {
    setJournalLoading(true);
    try {
      const res = await fetch('/api/tracabilite?limit=10');
      if (res.ok) {
        const data = await res.json();
        setJournal(Array.isArray(data) ? data : []);
      }
    } catch { /* silent */ }
    setJournalLoading(false);
  }

  useEffect(() => {
    fetchStats();
    fetchJournal();
  }, []);

  const taux = stats.total > 0 ? Math.round((stats.livrees / stats.total) * 100) : 0;

  return (
    <>
      <style>{DS}</style>
      <div className="dash">

        {/* Header */}
        <div className="dash-header">
          <div>
            <div className="dash-eyebrow">
              <Zap size={12} color="#a855f7" />
              <span style={{ fontSize: 11, color: '#c4b5fd', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Vue d'ensemble</span>
            </div>
            <h1 className="dash-title">Tableau de <span className="grad-text">bord</span></h1>
            <p className="dash-sub">Production & Livraison{lastUpdate && ` · ${lastUpdate}`}</p>
          </div>
          <button className="refresh-btn" onClick={() => { fetchStats(); fetchJournal(); }} disabled={loading}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser
          </button>
        </div>

        {/* Stat cards */}
        <div className="cards-grid">
          {CARD_CONFIGS.map((c, i) => {
            const Icon = ICONS[i];
            const val = stats[c.key as keyof typeof stats] as number;
            return (
              <div key={i} className="stat-card">
                <div className="card-orb" style={{ background: c.color }} />
                <div className="card-stripe" style={{ background: c.grad }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div className="card-icon" style={{ background: c.color + '18' }}>
                    <Icon size={20} color={c.color} />
                  </div>
                  <div className="card-label">{c.label}</div>
                  {loading
                    ? <div className="skeleton" style={{ width: 80, height: 32, marginTop: 4 }} />
                    : <div className="card-value">{val}</div>
                  }
                  {c.trend && <div className="card-trend"><ArrowUpRight size={11} /> {c.trend}</div>}
                </div>
              </div>
            );
          })}

          {/* CA wide */}
          <div className="stat-card stat-card-wide">
            <div className="card-orb" style={{ background: '#06b6d4', left: -20, right: 'auto' }} />
            <div className="card-stripe" style={{ background: 'linear-gradient(90deg,#06b6d4,#7c3aed)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div className="card-icon" style={{ background: 'rgba(6,182,212,0.12)', marginBottom: 0 }}>
                  <TrendingUp size={22} color="#06b6d4" />
                </div>
                <div className="card-label" style={{ marginBottom: 0 }}>Chiffre d'affaires</div>
              </div>
              {loading
                ? <div className="skeleton" style={{ width: 200, height: 40, marginTop: 8 }} />
                : <div className="card-value" style={{ fontSize: 36, color: '#06b6d4' }}>
                    {stats.ca.toLocaleString('fr-DZ')} <span style={{ fontSize: 16, color: '#22d3ee', fontWeight: 500 }}>DA</span>
                  </div>
              }
            </div>
            <div className="card-trend" style={{ color: '#06b6d4', background: 'rgba(6,182,212,0.12)', alignSelf: 'flex-start', position: 'relative', zIndex: 1 }}>
              <ArrowUpRight size={12} /> +23%
            </div>
          </div>
        </div>

        {/* Bottom row — 3 colonnes */}
        <div className="bottom-row">

          {/* Répartition */}
          <div className="panel">
            <div className="panel-title"><div className="panel-dot" /> Répartition</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'En attente',    count: stats.attente,     color: '#f59e0b', grad: 'linear-gradient(90deg,#d97706,#f59e0b)' },
                { label: 'Fabrication',   count: stats.fabrication, color: '#ec4899', grad: 'linear-gradient(90deg,#be185d,#ec4899)' },
                { label: 'Livrées',       count: stats.livrees,     color: '#10b981', grad: 'linear-gradient(90deg,#059669,#10b981)' },
              ].map((item, i) => {
                const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12.5, color: '#a09dc0', fontWeight: 500 }}>{item.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.count} ({pct}%)</span>
                    </div>
                    <div className="prog-track">
                      <div className="prog-fill" style={{ width: `${pct}%`, background: item.grad }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 6, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 12, color: '#a09dc0' }}>Taux de livraison</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#f1f0ff' }}>{taux}%</span>
                </div>
                <div className="prog-track">
                  <div className="prog-fill" style={{ width: `${taux}%`, background: 'linear-gradient(90deg,#7c3aed,#10b981)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Statuts */}
          <div className="panel">
            <div className="panel-title"><div className="panel-dot" style={{ background: 'linear-gradient(135deg,#06b6d4,#7c3aed)', boxShadow: '0 0 8px rgba(6,182,212,0.5)' }} /> Statuts</div>
            {[
              { label: 'Total commandes', count: stats.total,       color: '#a855f7' },
              { label: 'En attente',       count: stats.attente,     color: '#f59e0b' },
              { label: 'En fabrication',   count: stats.fabrication, color: '#ec4899' },
              { label: 'Livrées',          count: stats.livrees,     color: '#10b981' },
            ].map((s, i) => (
              <div key={i} className="status-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#c4c0e8' }}>{s.label}</span>
                </div>
                {loading
                  ? <div className="skeleton" style={{ width: 28, height: 20 }} />
                  : <span style={{ fontSize: 16, fontWeight: 800, color: '#f1f0ff' }}>{s.count}</span>
                }
              </div>
            ))}
          </div>

          {/* Journal d'activité */}
          <div className="panel">
            <div className="panel-title">
              <div className="panel-dot" style={{ background: 'linear-gradient(135deg,#ec4899,#f59e0b)', boxShadow: '0 0 8px rgba(236,72,153,0.5)' }} />
              Journal d'activité
            </div>
            {journalLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ width: '70%', height: 13, marginBottom: 5 }} />
                      <div className="skeleton" style={{ width: '50%', height: 11 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : journal.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#5c5a7a' }}>
                <Activity size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ fontSize: 13 }}>Aucune activité récente</p>
              </div>
            ) : (
              <div>
                {journal.map(entry => {
                  const cfg = getActionIcon(entry.entite_type, entry.action);
                  const Icon = cfg.icon;
                  const label = entry.action?.replace(/_/g, ' ') || 'Action';
                  const detail = entry.details || (entry.nouvel_etat ? `→ ${entry.nouvel_etat}` : null) || `${entry.entite_type} #${entry.entite_id}`;
                  return (
                    <div key={entry.id} className="journal-item">
                      <div className="journal-icon" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <Icon size={14} color={cfg.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="journal-action">{label}</div>
                        <div className="journal-detail" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail}</div>
                      </div>
                      <div className="journal-time">{timeAgo(entry.created_at)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}