'use client';

import { useEffect, useState } from 'react';
import { Factory, PlayCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface OrdreFabrication {
  id: number; produit_nom: string; produit_unite: string;
  commande_ref: number; quantite: number; statut: string;
  date_debut: string | null; date_fin: string | null;
  notes: string | null; created_at: string;
}

const STATUT_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  planifie: { label: 'Planifié',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  en_cours: { label: 'En cours',  color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
  termine:  { label: 'Terminé',   color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
};

const DS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1.5px solid #e2e8f0;color:#64748b;border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:#1a56db;color:#1a56db;background:#eff6ff}
.filter-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:20px;font-size:12px;font-weight:500;border:1.5px solid #e2e8f0;background:white;cursor:pointer;font-family:'DM Sans',sans-serif;color:#64748b;transition:all .15s}
.filter-btn.active{background:#080f1e;color:white;border-color:#080f1e}
.filter-btn:hover:not(.active){border-color:#1a56db;color:#1a56db}
.ordre-card{background:white;border-radius:14px;border:1px solid #f1f5f9;box-shadow:0 1px 4px rgba(0,0,0,.04);padding:20px;transition:box-shadow .2s,transform .2s}
.ordre-card:hover{box-shadow:0 6px 20px rgba(0,0,0,.08);transform:translateY(-2px)}
.action-btn{display:inline-flex;align-items:center;gap:6px;border:none;border-radius:9px;padding:8px 16px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function Fabrication() {
  const [ordres, setOrdres]   = useState<OrdreFabrication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'tous' | 'planifie' | 'en_cours' | 'termine'>('tous');

  async function fetchOrdres() {
    setLoading(true);
    try {
      const res  = await fetch('/api/fabrication');
      const data = await res.json();
      setOrdres(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchOrdres(); }, []);

  async function handleStatut(id: number, statut: string) {
    await fetch(`/api/fabrication/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statut }) });
    fetchOrdres();
  }

  const filtered = filter === 'tous' ? ordres : ordres.filter(o => o.statut === filter);
  const stats = {
    planifie: ordres.filter(o => o.statut === 'planifie').length,
    en_cours: ordres.filter(o => o.statut === 'en_cours').length,
    termine:  ordres.filter(o => o.statut === 'termine').length,
  };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", padding: '28px 32px', maxWidth: 1400 }}>
      <style>{DS}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Production</div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#080f1e,#7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Factory size={18} color="white" />
            </div>
            Fabrication
          </h1>
          <p style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 3 }}>
            {stats.planifie} planifiés · {stats.en_cours} en cours · {stats.termine} terminés
          </p>
        </div>
        <button onClick={fetchOrdres} className="btn-ghost">
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Planifiés',  value: stats.planifie, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          { label: 'En cours',   value: stats.en_cours,  color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'Terminés',   value: stats.termine,   color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['tous', 'planifie', 'en_cours', 'termine'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`filter-btn${filter === f ? ' active' : ''}`}>
            {f === 'tous' ? 'Tous' : STATUT_CFG[f].label}
            {f !== 'tous' && <span style={{ opacity: 0.7, fontSize: 11 }}>{stats[f]}</span>}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 13 }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, background: 'white', borderRadius: 16, border: '1px solid #f1f5f9' }}>
          <Factory size={36} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.2, color: '#94a3b8' }} />
          <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>Aucun ordre de fabrication</p>
          <p style={{ color: '#cbd5e1', fontSize: 12, marginTop: 6 }}>Les ordres sont créés automatiquement lors du passage en fabrication</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map(o => {
            const cfg = STATUT_CFG[o.statut] || { label: o.statut, color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' };
            return (
              <div key={o.id} className="ordre-card">
                {/* Barre latérale statut */}
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ width: 4, borderRadius: 2, background: cfg.color, flexShrink: 0 }} />

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <div style={{ width: 38, height: 38, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Factory size={18} color={cfg.color} />
                          </div>
                          <div>
                            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15, color: '#0f172a', margin: 0 }}>{o.produit_nom}</h3>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, marginTop: 2 }}>
                              {cfg.label}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 12.5, color: '#64748b', flexWrap: 'wrap' }}>
                          <span>Commande <strong style={{ color: '#0f172a' }}>#{o.commande_ref}</strong></span>
                          <span>Quantité : <strong style={{ color: '#0f172a' }}>{o.quantite} {o.produit_unite}</strong></span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> {new Date(o.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>

                        {(o.date_debut || o.date_fin) && (
                          <div style={{ display: 'flex', gap: 16, fontSize: 11.5, color: '#94a3b8', marginTop: 6 }}>
                            {o.date_debut && <span>Début : {new Date(o.date_debut).toLocaleDateString('fr-FR')}</span>}
                            {o.date_fin   && <span>Fin : {new Date(o.date_fin).toLocaleDateString('fr-FR')}</span>}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        {o.statut === 'planifie' && (
                          <button onClick={() => handleStatut(o.id, 'en_cours')}
                            className="action-btn"
                            style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1a56db' }}>
                            <PlayCircle size={14} /> Démarrer
                          </button>
                        )}
                        {o.statut === 'en_cours' && (
                          <button onClick={() => handleStatut(o.id, 'termine')}
                            className="action-btn"
                            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#059669' }}>
                            <CheckCircle size={14} /> Terminer
                          </button>
                        )}
                        {o.statut === 'termine' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#059669', fontWeight: 600 }}>
                            <CheckCircle size={14} /> Terminé
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}