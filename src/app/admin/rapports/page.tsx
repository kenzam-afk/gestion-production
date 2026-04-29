'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3, TrendingUp, Package, ShoppingCart,
  AlertTriangle, ArrowUp, ArrowDown, Minus,
  ShoppingBag, RefreshCw
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface IntelligenceData {
  kpis: {
    chiffreAffaires: number;
    totalCommandes: number;
    totalProduits: number;
    totalClients: number;
    rotationStock: number;
    scoreStockPct: number;
  };
  bestSellers: {
    produit_id: number;
    nom: string;
    total_commandes: number;
    total_quantite: number;
    evolution_pct: number;
  }[];
  commandesParStatut: {
    statut: string;
    count: number;
  }[];
  stockCritique: {
    id: number;
    nom: string;
    stock_disponible: number;
    stock_minimum: number;
    jours_restants: number;
    categorie: string;
  }[];
  stockSurplus: {
    id: number;
    nom: string;
    stock_disponible: number;
    stock_minimum: number;
    ratio_surplus: number;
  }[];
  dernieresCommandes: {
    id: number;
    client_nom: string;
    statut: string;
    total: number;
    created_at: string;
  }[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  en_fabrication: 'En fabrication',
  livree: 'Livrée',
  annulee: 'Annulée',
};

const STATUT_COLORS: Record<string, { bar: string; badge: string }> = {
  en_attente:     { bar: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-700' },
  confirmee:      { bar: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700' },
  en_fabrication: { bar: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700' },
  livree:         { bar: 'bg-emerald-500',badge: 'bg-emerald-100 text-emerald-700' },
  annulee:        { bar: 'bg-red-400',    badge: 'bg-red-100 text-red-700' },
};

const TABS = [
  { id: 'commandes', label: 'Produits commandés' },
  { id: 'stock',     label: 'Analyse stock' },
  { id: 'alertes',   label: 'Alertes & actions' },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── Composant principal ───────────────────────────────────────────────────────

export default function Rapports() {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('commandes');
  const [refreshing, setRefreshing] = useState(false);

  async function fetchData() {
    try {
      const res = await fetch('/api/rapports/intelligence');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  function handleRefresh() {
    setRefreshing(true);
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Chargement des analyses...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-red-500">Erreur lors du chargement des données.</div>
    );
  }

  const { kpis, bestSellers, commandesParStatut, stockCritique, stockSurplus, dernieresCommandes } = data;
  const maxCommandes = bestSellers[0]?.total_commandes || 1;
  const totalStatuts = commandesParStatut.reduce((a, s) => a + s.count, 0);

  // Alertes prioritaires
  const alertesUrgentes = stockCritique.filter(p => p.jours_restants !== null && p.jours_restants <= 3);
  const alertesWarning  = stockCritique.filter(p => p.jours_restants === null || p.jours_restants > 3);
  const surplusRisque   = stockSurplus.slice(0, 3);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Rapports & Analyse</h1>
          <p className="text-gray-500 mt-1">Intelligence commerciale — stocks, ventes & recommandations</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm text-gray-500 border rounded-lg px-3 py-2 hover:bg-white transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={<TrendingUp size={20} />} label="Chiffre d'affaires" value={`${kpis.chiffreAffaires.toLocaleString('fr-FR')} DA`} color="green" />
        <KpiCard icon={<ShoppingCart size={20} />} label="Commandes" value={kpis.totalCommandes} color="blue" />
        <KpiCard icon={<Package size={20} />} label="Produits" value={kpis.totalProduits} color="purple" />
        <KpiCard icon={<BarChart3 size={20} />} label="Clients" value={kpis.totalClients} color="orange" />
      </div>

      {/* SCORE STOCK */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">Score santé du stock</span>
          <span className={`text-sm font-bold ${kpis.scoreStockPct >= 70 ? 'text-emerald-600' : kpis.scoreStockPct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
            {kpis.scoreStockPct}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${kpis.scoreStockPct >= 70 ? 'bg-emerald-500' : kpis.scoreStockPct >= 40 ? 'bg-amber-400' : 'bg-red-500'}`}
            style={{ width: `${kpis.scoreStockPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Critique</span>
          <span>Optimal</span>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ── TAB : PRODUITS COMMANDÉS ── */}
          {activeTab === 'commandes' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Best-sellers */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Best-sellers (30 derniers jours)
                </h3>
                {bestSellers.length === 0 ? (
                  <p className="text-gray-400 text-sm">Aucune commande enregistrée.</p>
                ) : (
                  bestSellers.map((p, i) => (
                    <div key={p.produit_id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                          <span className="font-medium text-gray-800 truncate max-w-[160px]">{p.nom}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendIndicator pct={p.evolution_pct} />
                          <span className="font-semibold text-gray-700">{p.total_commandes} cmd</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-blue-500 transition-all duration-700"
                          style={{ width: `${(p.total_commandes / maxCommandes) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Commandes par statut */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Commandes par statut
                </h3>
                {commandesParStatut.length === 0 ? (
                  <p className="text-gray-400 text-sm">Aucune commande.</p>
                ) : (
                  commandesParStatut.map(s => (
                    <div key={s.statut} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">{STATUT_LABELS[s.statut] || s.statut}</span>
                        <span className="font-semibold">{s.count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${STATUT_COLORS[s.statut]?.bar || 'bg-gray-400'} transition-all duration-700`}
                          style={{ width: `${totalStatuts > 0 ? (s.count / totalStatuts) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}

                {/* Dernières commandes */}
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide pt-4">
                  Dernières commandes
                </h3>
                <div className="space-y-2">
                  {dernieresCommandes.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div>
                        <span className="font-medium text-sm text-gray-800">{c.client_nom}</span>
                        <span className="text-xs text-gray-400 ml-2">#{c.id}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[c.statut]?.badge || 'bg-gray-100 text-gray-600'}`}>
                          {STATUT_LABELS[c.statut] || c.statut}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">{Number(c.total).toLocaleString('fr-FR')} DA</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB : ANALYSE STOCK ── */}
          {activeTab === 'stock' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Stock critique */}
              <div>
                <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <AlertTriangle size={14} /> Stock critique / rupture imminente
                </h3>
                {stockCritique.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-medium text-emerald-700">Aucun stock critique</p>
                      <p className="text-xs text-emerald-600">Tous les produits sont au-dessus du seuil minimum.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stockCritique.map(p => (
                      <div key={p.id} className="p-4 rounded-xl border border-red-100 bg-red-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{p.nom}</p>
                            <p className="text-xs text-gray-500">{p.categorie}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            p.jours_restants !== null && p.jours_restants <= 2
                              ? 'bg-red-600 text-white'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {p.jours_restants !== null ? `~${p.jours_restants}j` : 'Rupture'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Stock: <b className="text-red-600">{p.stock_disponible}</b></span>
                          <span>Minimum: {p.stock_minimum}</span>
                        </div>
                        <div className="w-full bg-red-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full bg-red-500"
                            style={{ width: `${Math.min((p.stock_disponible / p.stock_minimum) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stock surplus */}
              <div>
                <h3 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <ShoppingBag size={14} /> Surplus — à ne plus commander
                </h3>
                {stockSurplus.length === 0 ? (
                  <p className="text-gray-400 text-sm">Aucun surplus détecté.</p>
                ) : (
                  <div className="space-y-3">
                    {stockSurplus.map(p => (
                      <div key={p.id} className="p-4 rounded-xl border border-emerald-100 bg-emerald-50">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-gray-800 text-sm">{p.nom}</p>
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-600 text-white">
                            ×{p.ratio_surplus.toFixed(1)} le min
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Stock: <b className="text-emerald-700">{p.stock_disponible}</b></span>
                          <span>Minimum: {p.stock_minimum}</span>
                        </div>
                        <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full bg-emerald-500"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB : ALERTES & ACTIONS ── */}
          {activeTab === 'alertes' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Actions prioritaires
              </h3>

              {alertesUrgentes.length === 0 && alertesWarning.length === 0 && surplusRisque.length === 0 && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
                  <span className="text-2xl">🟢</span>
                  <p className="font-medium text-emerald-700">Tout va bien ! Aucune action urgente requise.</p>
                </div>
              )}

              {/* Urgentes */}
              {alertesUrgentes.map(p => (
                <AlerteRow
                  key={`u-${p.id}`}
                  niveau="danger"
                  titre={`Rupture imminente — ${p.nom}`}
                  desc={`Stock actuel: ${p.stock_disponible} | Minimum requis: ${p.stock_minimum} | Rupture dans ~${p.jours_restants} jour(s). Commander immédiatement.`}
                />
              ))}

              {/* Warnings stock */}
              {alertesWarning.map(p => (
                <AlerteRow
                  key={`w-${p.id}`}
                  niveau="warn"
                  titre={`Stock bas — ${p.nom}`}
                  desc={`Stock: ${p.stock_disponible} / Minimum: ${p.stock_minimum}. Planifier un réapprovisionnement.`}
                />
              ))}

              {/* Surplus */}
              {surplusRisque.map(p => (
                <AlerteRow
                  key={`s-${p.id}`}
                  niveau="info"
                  titre={`Surplus — ${p.nom}`}
                  desc={`Stock ${p.ratio_surplus.toFixed(1)}× au-dessus du minimum (${p.stock_disponible} en stock). Stopper les commandes.`}
                />
              ))}

              {/* Opportunité best-seller */}
              {bestSellers[0] && (
                <AlerteRow
                  niveau="success"
                  titre={`Opportunité — ${bestSellers[0].nom}`}
                  desc={`Best-seller avec ${bestSellers[0].total_commandes} commandes. ${bestSellers[0].evolution_pct > 0 ? `Tendance +${bestSellers[0].evolution_pct}% ce mois.` : ''} Augmenter la production préventive.`}
                />
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

// ─── Sous-composants ───────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    green:  'bg-emerald-100 text-emerald-600',
    blue:   'bg-blue-100 text-blue-600',
    purple: 'bg-violet-100 text-violet-600',
    orange: 'bg-orange-100 text-orange-600',
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function TrendIndicator({ pct }: { pct: number }) {
  if (pct > 0) return <span className="flex items-center text-xs text-emerald-600 font-medium"><ArrowUp size={11} />+{pct}%</span>;
  if (pct < 0) return <span className="flex items-center text-xs text-red-500 font-medium"><ArrowDown size={11} />{pct}%</span>;
  return <span className="flex items-center text-xs text-gray-400"><Minus size={11} /></span>;
}

function AlerteRow({ niveau, titre, desc }: { niveau: 'danger' | 'warn' | 'success' | 'info'; titre: string; desc: string }) {
  const styles = {
    danger:  { wrap: 'bg-red-50 border-l-4 border-red-500',     dot: '🔴', title: 'text-red-800' },
    warn:    { wrap: 'bg-amber-50 border-l-4 border-amber-400', dot: '🟡', title: 'text-amber-800' },
    success: { wrap: 'bg-emerald-50 border-l-4 border-emerald-500', dot: '🟢', title: 'text-emerald-800' },
    info:    { wrap: 'bg-blue-50 border-l-4 border-blue-400',   dot: '🔵', title: 'text-blue-800' },
  };
  const s = styles[niveau];
  return (
    <div className={`flex gap-3 p-4 rounded-r-xl ${s.wrap}`}>
      <span className="text-base mt-0.5">{s.dot}</span>
      <div>
        <p className={`font-semibold text-sm ${s.title}`}>{titre}</p>
        <p className="text-xs text-gray-600 mt-1">{desc}</p>
      </div>
    </div>
  );
}