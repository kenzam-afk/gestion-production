'use client';

import { useEffect, useState } from 'react';
import { Truck, Trash2, CheckCircle, RefreshCw, X, MapPin, Pencil } from 'lucide-react';

interface Livraison {
  id: number; commande_id: number; client_nom: string; commande_total: number;
  adresse: string; adresse_livraison: string; livreur_nom: string | null;
  livreur_id: number | null; statut: string; date_livraison: string | null; created_at: string;
}
interface Livreur { id: number; nom: string; }

const STATUT_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  en_attente: { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,.1)',  border: 'rgba(245,158,11,.25)' },
  en_cours:   { label: 'En cours',   color: '#a855f7', bg: 'rgba(168,85,247,.1)',  border: 'rgba(168,85,247,.25)' },
  livree:     { label: 'Livrée',     color: '#10b981', bg: 'rgba(16,185,129,.1)',  border: 'rgba(16,185,129,.25)' },
};

const DS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--border);color:var(--text-secondary);border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:var(--violet);color:var(--violet-light);background:rgba(124,58,237,.08)}
.btn-primary{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:white;border:none;border-radius:9px;padding:9px 18px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .2s;box-shadow:0 2px 12px rgba(124,58,237,.35)}
.btn-primary:hover{transform:translateY(-1px);filter:brightness(1.1)}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-danger{display:inline-flex;align-items:center;gap:5px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#ef4444;border-radius:8px;padding:6px 11px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif}
.btn-danger:hover{background:rgba(239,68,68,.2)}
.sel{width:100%;background:var(--bg-surface) !important;border:1px solid var(--border) !important;border-radius:9px;padding:10px 13px;font-family:'Outfit',sans-serif;font-size:13.5px;color:var(--text-primary) !important;outline:none}
label{font-size:11.5px;font-weight:600;color:var(--text-secondary);margin-bottom:5px;display:block;letter-spacing:.02em}
.overlay{position:fixed;inset:0;background:rgba(4,4,20,.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;animation:fadeIn .2s}
.modal{background:var(--bg-card);border:1px solid var(--border);border-radius:18px;width:100%;max-width:400px;padding:28px;box-shadow:0 32px 80px rgba(0,0,0,.5);animation:slideUp .2s}
.tr-row{border-bottom:1px solid var(--border);transition:background .15s}
.tr-row:hover td{background:var(--bg-card-hover) !important}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function Livraisons() {
  const [livraisons, setLivraisons] = useState<Livraison[]>([]);
  const [livreurs, setLivreurs]     = useState<Livreur[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [editModal, setEditModal]   = useState<Livraison | null>(null);
  const [livreurId, setLivreurId]   = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function fetchAll() {
    setLoading(true);
    const [liv, users] = await Promise.all([
      fetch('/api/livraisons').then(r => r.json()),
      fetch('/api/livraisons/livreur').then(r => r.json()),
    ]);
    setLivraisons(Array.isArray(liv) ? liv : []);
    setLivreurs(Array.isArray(users) ? users : []);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleAssignerLivreur() {
    if (!editModal) return;
    setSaving(true);

    const livreurIdEnvoi = livreurId ? parseInt(livreurId) : null;
    console.log('Assignation livreur:', { livraison_id: editModal.id, livreur_id: livreurIdEnvoi });

    const res = await fetch(`/api/livraisons/${editModal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        statut:     editModal.statut,
        livreur_id: livreurIdEnvoi,
      }),
    });

    const data = await res.json();
    console.log('Réponse API:', data);

    setSaving(false);
    setEditModal(null);

    if (res.ok) {
      setSuccessMsg('Livreur assigné avec succès !');
      setTimeout(() => setSuccessMsg(''), 3000);
    }

    fetchAll();
  }

  async function handleLivrer(id: number) {
    if (!confirm('Confirmer la livraison ?')) return;
    await fetch(`/api/livraisons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'livree' }),
    });
    fetchAll();
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer cette livraison ?')) return;
    await fetch(`/api/livraisons/${id}`, { method: 'DELETE' });
    fetchAll();
  }

  const stats = {
    total:   livraisons.length,
    attente: livraisons.filter(l => l.statut === 'en_attente').length,
    livrees: livraisons.filter(l => l.statut === 'livree').length,
  };

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", padding: '28px 32px', maxWidth: 1400 }}>
      <style>{DS}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Logistique</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#06b6d4,#7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(6,182,212,.4)' }}>
              <Truck size={18} color="white" />
            </div>
            Livraisons
          </h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>
            {stats.total} livraisons · {stats.attente} en attente · {stats.livrees} effectuées
          </p>
        </div>
        <button onClick={fetchAll} className="btn-ghost">
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser
        </button>
      </div>

      {/* Succès */}
      {successMsg && (
        <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle size={15} color="#10b981" />
          <span style={{ fontSize: 13, color: '#10b981', fontWeight: 500 }}>{successMsg}</span>
        </div>
      )}

      {/* Info */}
      <div style={{ background: 'rgba(6,182,212,.08)', border: '1px solid rgba(6,182,212,.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Truck size={15} color="#06b6d4" />
        <span style={{ fontSize: 13, color: '#06b6d4', fontWeight: 500 }}>
          Les livraisons sont créées automatiquement quand une commande passe à "Prête à livrer". Vous pouvez assigner ou modifier le livreur ici.
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total',      value: stats.total,   color: '#06b6d4', bg: 'rgba(6,182,212,.1)',   border: 'rgba(6,182,212,.2)' },
          { label: 'En attente', value: stats.attente, color: '#f59e0b', bg: 'rgba(245,158,11,.1)',  border: 'rgba(245,158,11,.2)' },
          { label: 'Livrées',    value: stats.livrees, color: '#10b981', bg: 'rgba(16,185,129,.1)',  border: 'rgba(16,185,129,.2)' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              {['#', 'Client', 'Adresse', 'Livreur', 'Statut', 'Date', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Chargement...</td></tr>
            ) : livraisons.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 56 }}>
                <Truck size={32} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.2, color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucune livraison — passez une commande à "Prête à livrer"</span>
              </td></tr>
            ) : livraisons.map(l => {
              const cfg = STATUT_CFG[l.statut] || { label: l.statut, color: 'var(--text-secondary)', bg: 'var(--bg-surface)', border: 'var(--border)' };
              return (
                <tr key={l.id} className="tr-row">
                  <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>#{l.id}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{l.client_nom}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Commande #{l.commande_id}</div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 160 }}>
                      <MapPin size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.adresse || l.adresse_livraison || '—'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    {l.livreur_nom ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#06b6d4,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>
                          {l.livreur_nom[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{l.livreur_nom}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#f59e0b', fontStyle: 'italic' }}>⚠ Non assigné</span>
                    )}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {l.date_livraison ? new Date(l.date_livraison).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {l.statut !== 'livree' && (
                        <button
                          onClick={() => { setEditModal(l); setLivreurId(l.livreur_id ? String(l.livreur_id) : ''); }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(124,58,237,.1)', border: '1px solid rgba(124,58,237,.25)', color: '#a855f7', borderRadius: 8, padding: '6px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
                        >
                          <Pencil size={12} /> Livreur
                        </button>
                      )}
                      {l.statut !== 'livree' && (
                        <button
                          onClick={() => handleLivrer(l.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)', color: '#10b981', borderRadius: 8, padding: '6px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
                        >
                          <CheckCircle size={12} /> Livrer
                        </button>
                      )}
                      <button onClick={() => handleDelete(l.id)} className="btn-danger"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {livraisons.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            {livraisons.length} livraison{livraisons.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Modal assigner livreur */}
      {editModal && (
        <div className="overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Assigner un livreur</h2>
              <button onClick={() => setEditModal(null)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '12px 14px', marginBottom: 18, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{editModal.client_nom}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Livraison #{editModal.id} · Commande #{editModal.commande_id}</div>
            </div>

            <div style={{ marginBottom: 6 }}>
              <label>Livreur assigné</label>
              <select
                className="sel"
                value={livreurId}
                onChange={e => {
                  console.log('Sélection livreur:', e.target.value);
                  setLivreurId(e.target.value);
                }}
              >
                <option value="">— Sans livreur assigné —</option>
                {livreurs.map(l => (
                  <option key={l.id} value={String(l.id)}>{l.nom}</option>
                ))}
              </select>
            </div>

            {livreurId && (
              <div style={{ fontSize: 12, color: '#10b981', marginBottom: 14 }}>
                ✓ {livreurs.find(l => String(l.id) === livreurId)?.nom} sera assigné
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setEditModal(null)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Annuler</button>
              <button onClick={handleAssignerLivreur} disabled={saving} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}