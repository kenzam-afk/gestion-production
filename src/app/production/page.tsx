'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  Factory, CheckCircle, PlayCircle, Clock, RefreshCw,
  Layers, AlertTriangle, Package, BarChart3, LogOut,
  ChevronRight, X, Info,
} from 'lucide-react';

interface OrdreFab {
  id: number; produit_nom: string; produit_unite: string;
  commande_ref: number; quantite: number; statut: string;
  date_debut: string | null; date_fin: string | null; created_at: string;
}

interface MatiereStock {
  id: number; titre: string; unite: string;
  stock_actuel: number; stock_minimum: number; etat_stock: string;
}

interface MRPResult {
  besoins: any[]; resume: any; faisabilite_commandes: any[];
}

const STATUT_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  planifie: { label: 'Planifié',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  en_cours: { label: 'En cours',  color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
  termine:  { label: 'Terminé',   color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
};

const DS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:#f1f5f9}
.btn-primary{display:inline-flex;align-items:center;gap:6px;background:#1a56db;color:white;border:none;border-radius:9px;padding:9px 18px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:background .15s,transform .15s}
.btn-primary:hover{background:#1648c2;transform:translateY(-1px)}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1.5px solid #e2e8f0;color:#64748b;border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:#1a56db;color:#1a56db;background:#eff6ff}
.input-field{width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-family:'DM Sans',sans-serif;font-size:13.5px;color:#1e293b;outline:none;transition:border .15s;background:#f8fafc}
.input-field:focus{border-color:#1a56db;background:white;box-shadow:0 0 0 3px rgba(26,86,219,.08)}
label{font-size:11.5px;font-weight:600;color:#64748b;margin-bottom:5px;display:block;letter-spacing:.02em}
.card{background:white;border-radius:14px;border:1px solid #f1f5f9;box-shadow:0 1px 4px rgba(0,0,0,.04)}
.tab-btn{flex:1;padding:12px;font-size:13px;font-weight:500;border:none;background:transparent;cursor:pointer;font-family:'DM Sans',sans-serif;color:#64748b;transition:all .15s;border-bottom:2px solid transparent}
.tab-btn.active{color:#1a56db;border-bottom-color:#1a56db;background:#eff6ff}
.overlay{position:fixed;inset:0;background:rgba(8,15,30,.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;animation:fadeIn .2s}
.modal{background:white;border-radius:18px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;padding:28px;box-shadow:0 32px 80px rgba(0,0,0,.25);animation:slideUp .2s}
.progress-track{height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden}
.progress-fill{height:100%;border-radius:3px;transition:width .5s}
.tr-row:hover td{background:#f8fafc}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

type TabId = 'fabrication' | 'matieres' | 'mrp';

export default function ProductionPage() {
  const { data: session } = useSession();
  const [ordres, setOrdres]   = useState<OrdreFab[]>([]);
  const [matieres, setMatieres] = useState<MatiereStock[]>([]);
  const [mrp, setMrp]         = useState<MRPResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('fabrication');
  const [modalValidation, setModalValidation] = useState<OrdreFab | null>(null);
  const [valForm, setValForm] = useState({ quantite_produite: '', quantite_rebutee: '0', observations: '' });
  const [saving, setSaving]   = useState(false);
  const [mrpLoading, setMrpLoading] = useState(false);

  async function fetchAll() {
    setLoading(true);
    try {
      const [ro, rm] = await Promise.all([
        fetch('/api/fabrication').then(r => r.json()),
        fetch('/api/matieres-premieres').then(r => r.json()),
      ]);
      setOrdres(Array.isArray(ro) ? ro : []);
      setMatieres(Array.isArray(rm) ? rm : []);
    } finally { setLoading(false); }
  }

  async function fetchMRP() {
    setMrpLoading(true);
    try {
      const res = await fetch('/api/mrp');
      setMrp(await res.json());
    } finally { setMrpLoading(false); }
  }

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (activeTab === 'mrp' && !mrp) fetchMRP(); }, [activeTab]);

  async function handleStatut(id: number, statut: string) {
    await fetch(`/api/fabrication/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    });
    fetchAll();
  }

  async function handleValidation() {
    if (!modalValidation || !valForm.quantite_produite) return;
    setSaving(true);
    try {
      // 1. Valider l'ordre
      await fetch(`/api/production/valider`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ordre_fab_id:       modalValidation.id,
          responsable_id:     (session?.user as any)?.id,
          quantite_produite:  parseInt(valForm.quantite_produite),
          quantite_rebutee:   parseInt(valForm.quantite_rebutee || '0'),
          observations:       valForm.observations,
        }),
      });
      setModalValidation(null);
      setValForm({ quantite_produite: '', quantite_rebutee: '0', observations: '' });
      fetchAll();
    } finally { setSaving(false); }
  }

  async function lancerMRP() {
    setMrpLoading(true);
    await fetch('/api/mrp', { method: 'POST' });
    await fetchMRP();
  }

  const stats = {
    planifie: ordres.filter(o => o.statut === 'planifie').length,
    en_cours: ordres.filter(o => o.statut === 'en_cours').length,
    termine:  ordres.filter(o => o.statut === 'termine').length,
    critique: matieres.filter(m => m.etat_stock === 'critique' || m.etat_stock === 'rupture').length,
  };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", minHeight: '100vh', background: '#f1f5f9' }}>
      <style>{DS}</style>

      {/* Navbar */}
      <nav style={{ background: '#080f1e', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 58 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#1a56db,#7c3aed)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Factory size={17} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>Production</div>
              <div style={{ fontSize: 9, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Responsable</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{session?.user?.name}</div>
            <button onClick={() => signOut({ callbackUrl: '/' })} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>
              <LogOut size={13} /> Quitter
            </button>
          </div>
        </div>
        <div style={{ height: 2, background: 'linear-gradient(90deg,#1a56db,#7c3aed,transparent)' }} />
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Tableau de bord</div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Responsable de Production</h1>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Planifiés',        value: stats.planifie, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
            { label: 'En cours',          value: stats.en_cours,  color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
            { label: 'Terminés',          value: stats.termine,   color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Matières critiques', value: stats.critique,  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="card">
          <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
            {([
              { id: 'fabrication', label: 'Ordres de fabrication', icon: <Factory size={14} /> },
              { id: 'matieres',    label: 'Stock matières',         icon: <Layers size={14} /> },
              { id: 'mrp',         label: 'Calcul des besoins MRP', icon: <BarChart3 size={14} /> },
            ] as { id: TabId; label: string; icon: any }[]).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 24 }}>

            {/* ── FABRICATION ── */}
            {activeTab === 'fabrication' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <button onClick={fetchAll} className="btn-ghost">
                    <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser
                  </button>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Chargement...</div>
                ) : ordres.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 56 }}>
                    <Factory size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.2, color: '#94a3b8' }} />
                    <p style={{ color: '#94a3b8', fontSize: 13 }}>Aucun ordre de fabrication</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {ordres.map(o => {
                      const cfg = STATUT_CFG[o.statut] || STATUT_CFG.planifie;
                      return (
                        <div key={o.id} style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                            <div style={{ width: 4, height: 48, borderRadius: 2, background: cfg.color, flexShrink: 0 }} />
                            <div>
                              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{o.produit_nom}</div>
                              <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 3 }}>
                                Commande <strong>#{o.commande_ref}</strong> · Qté : <strong>{o.quantite} {o.produit_unite}</strong>
                              </div>
                              <div style={{ marginTop: 5 }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                                  {cfg.label}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            {o.statut === 'planifie' && (
                              <button onClick={() => handleStatut(o.id, 'en_cours')}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1a56db', borderRadius: 8, padding: '7px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                                <PlayCircle size={14} /> Démarrer
                              </button>
                            )}
                            {o.statut === 'en_cours' && (
                              <button onClick={() => { setModalValidation(o); setValForm({ quantite_produite: String(o.quantite), quantite_rebutee: '0', observations: '' }); }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#059669', borderRadius: 8, padding: '7px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                                <CheckCircle size={14} /> Valider production
                              </button>
                            )}
                            {o.statut === 'termine' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#059669', fontWeight: 600 }}>
                                <CheckCircle size={14} /> Validé
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── MATIÈRES ── */}
            {activeTab === 'matieres' && (
              <div>
                {stats.critique > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
                    <AlertTriangle size={15} color="#dc2626" />
                    <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 500 }}>
                      {stats.critique} matière{stats.critique > 1 ? 's' : ''} en état critique — vérifiez l'approvisionnement
                    </span>
                  </div>
                )}

                <div style={{ display: 'grid', gap: 10 }}>
                  {matieres.map(m => {
                    const pct = Math.min((Number(m.stock_actuel) / Math.max(Number(m.stock_minimum) * 2, 1)) * 100, 100);
                    const isOk = m.etat_stock === 'ok';
                    return (
                      <div key={m.id} style={{ background: isOk ? '#f8fafc' : '#fef2f2', border: `1px solid ${isOk ? '#f1f5f9' : '#fecaca'}`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Layers size={18} color={isOk ? '#94a3b8' : '#dc2626'} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', marginBottom: 6 }}>{m.titre}</div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${pct}%`, background: isOk ? '#10b981' : m.etat_stock === 'bas' ? '#f59e0b' : '#ef4444' }} />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: isOk ? '#0f172a' : '#dc2626' }}>{m.stock_actuel}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 3 }}>{m.unite}</span>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>min : {m.stock_minimum}</div>
                        </div>
                        <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: isOk ? '#f0fdf4' : '#fef2f2', color: isOk ? '#059669' : '#dc2626', border: `1px solid ${isOk ? '#bbf7d0' : '#fecaca'}`, flexShrink: 0 }}>
                          {m.etat_stock === 'ok' ? 'OK' : m.etat_stock === 'bas' ? 'Bas' : m.etat_stock === 'critique' ? 'Critique' : 'Rupture'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── MRP ── */}
            {activeTab === 'mrp' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15, color: '#0f172a' }}>Calcul des besoins en matières (MRP)</div>
                    <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 3 }}>Basé sur toutes les commandes actives</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={fetchMRP} className="btn-ghost" disabled={mrpLoading}>
                      <RefreshCw size={13} style={{ animation: mrpLoading ? 'spin 1s linear infinite' : 'none' }} /> Recalculer
                    </button>
                    <button onClick={lancerMRP} className="btn-primary" disabled={mrpLoading}>
                      <BarChart3 size={14} /> Générer plan appro
                    </button>
                  </div>
                </div>

                {mrpLoading ? (
                  <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Calcul en cours...</div>
                ) : !mrp ? (
                  <div style={{ textAlign: 'center', padding: 48 }}>
                    <BarChart3 size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.2, color: '#94a3b8' }} />
                    <p style={{ color: '#94a3b8', fontSize: 13 }}>Cliquez "Recalculer" pour lancer l'analyse</p>
                  </div>
                ) : (
                  <div>
                    {/* Résumé MRP */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
                      {[
                        { label: 'Matières analysées',   value: mrp.resume?.total_matieres || 0,       color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
                        { label: 'Stocks suffisants',    value: mrp.resume?.matieres_ok || 0,           color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
                        { label: 'Approvisionnements',   value: mrp.resume?.matieres_manquantes || 0,   color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                        { label: 'Commandes faisables',  value: mrp.resume?.commandes_faisables || 0,   color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
                      ].map((s, i) => (
                        <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '14px 16px' }}>
                          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Besoins par matière */}
                    {mrp.besoins?.length > 0 && (
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Détail par matière</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {mrp.besoins.map((b: any, i: number) => (
                            <div key={i} style={{ background: b.suffisant ? '#f0fdf4' : '#fef2f2', border: `1px solid ${b.suffisant ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: '14px 18px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{b.matiere_titre}</div>
                                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', gap: 16 }}>
                                    <span>Besoin : <strong style={{ color: '#0f172a' }}>{b.quantite_besoin} {b.unite}</strong></span>
                                    <span>Stock : <strong style={{ color: b.suffisant ? '#059669' : '#dc2626' }}>{b.stock_actuel} {b.unite}</strong></span>
                                    {!b.suffisant && <span>Manque : <strong style={{ color: '#dc2626' }}>{b.quantite_manque} {b.unite}</strong></span>}
                                  </div>
                                </div>
                                <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: b.suffisant ? '#059669' : '#dc2626', color: 'white', flexShrink: 0 }}>
                                  {b.suffisant ? '✓ Suffisant' : '⚠ À commander'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Faisabilité commandes */}
                    {mrp.faisabilite_commandes?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Faisabilité par commande</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {mrp.faisabilite_commandes.map((f: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', background: f.faisable ? '#f0fdf4' : '#fef2f2', border: `1px solid ${f.faisable ? '#bbf7d0' : '#fecaca'}`, borderRadius: 10 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>Commande #{f.commande_id}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {!f.faisable && <span style={{ fontSize: 11.5, color: '#dc2626' }}>{f.matieres_manquantes?.length} matière(s) manquante(s)</span>}
                                <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: f.faisable ? '#059669' : '#dc2626', color: 'white' }}>
                                  {f.faisable ? '✓ Faisable' : '✗ Bloquée'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modal validation production */}
      {modalValidation && (
        <div className="overlay" onClick={() => setModalValidation(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: '#0f172a', margin: 0 }}>Valider la production</h2>
              <button onClick={() => setModalValidation(null)} style={{ width: 28, height: 28, borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} color="#64748b" /></button>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 18, border: '1px solid #f1f5f9' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{modalValidation.produit_nom}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Commande #{modalValidation.commande_ref} · Prévu : {modalValidation.quantite} {modalValidation.produit_unite}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label>Quantité produite *</label>
                <input className="input-field" type="number" min="0" placeholder={String(modalValidation.quantite)} value={valForm.quantite_produite} onChange={e => setValForm({ ...valForm, quantite_produite: e.target.value })} />
              </div>
              <div>
                <label>Quantité rebutée (défauts)</label>
                <input className="input-field" type="number" min="0" placeholder="0" value={valForm.quantite_rebutee} onChange={e => setValForm({ ...valForm, quantite_rebutee: e.target.value })} />
              </div>
              <div>
                <label>Observations</label>
                <textarea className="input-field" rows={3} placeholder="Notes sur la production, problèmes rencontrés..." value={valForm.observations} onChange={e => setValForm({ ...valForm, observations: e.target.value } as any)} />
              </div>

              {/* Info consommation MP */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8 }}>
                <Info size={14} color="#1a56db" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: '#1e40af', margin: 0 }}>
                  La validation déduira automatiquement les matières premières consommées du stock et mettra à jour le stock produit fini.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setModalValidation(null)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Annuler</button>
              <button onClick={handleValidation} disabled={saving || !valForm.quantite_produite} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                <CheckCircle size={14} /> {saving ? 'Validation...' : 'Valider la production'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}