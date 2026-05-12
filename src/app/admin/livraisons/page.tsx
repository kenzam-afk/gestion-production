'use client';

import { useEffect, useState } from 'react';
import { Truck, Plus, Trash2, CheckCircle, RefreshCw, X, MapPin } from 'lucide-react';

interface Livraison { id: number; commande_id: number; client_nom: string; commande_total: number; adresse: string; adresse_livraison: string; livreur_nom: string | null; statut: string; date_livraison: string | null; created_at: string; }
interface Commande  { id: number; client_nom: string; total: number; statut: string; }
interface Livreur   { id: number; nom: string; }

const STATUT_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  en_attente: { label: 'En attente', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  en_cours:   { label: 'En cours',   color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
  livree:     { label: 'Livrée',     color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
};

const DS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box}
.btn-primary{display:inline-flex;align-items:center;gap:6px;background:#1a56db;color:white;border:none;border-radius:9px;padding:9px 18px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:background .15s,transform .15s;box-shadow:0 2px 8px rgba(26,86,219,.25)}
.btn-primary:hover{background:#1648c2;transform:translateY(-1px)}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1.5px solid #e2e8f0;color:#64748b;border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:#1a56db;color:#1a56db;background:#eff6ff}
.btn-danger{display:inline-flex;align-items:center;gap:5px;background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:8px;padding:6px 11px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}
.btn-danger:hover{background:#fee2e2}
.input-field{width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-family:'DM Sans',sans-serif;font-size:13.5px;color:#1e293b;outline:none;transition:border .15s;background:#f8fafc}
.input-field:focus{border-color:#1a56db;background:white;box-shadow:0 0 0 3px rgba(26,86,219,.08)}
.select-field{width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-family:'DM Sans',sans-serif;font-size:13.5px;color:#1e293b;outline:none;background:#f8fafc}
.select-field:focus{border-color:#1a56db;background:white}
label{font-size:11.5px;font-weight:600;color:#64748b;margin-bottom:5px;display:block;letter-spacing:.02em}
.overlay{position:fixed;inset:0;background:rgba(8,15,30,.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;animation:fadeIn .2s}
.modal{background:white;border-radius:18px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;padding:28px;box-shadow:0 32px 80px rgba(0,0,0,.25);animation:slideUp .2s}
.close-btn{width:30px;height:30px;border-radius:8px;background:#f1f5f9;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center}
.close-btn:hover{background:#e2e8f0}
.tr-row:hover td{background:#f8fafc}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function Livraisons() {
  const [livraisons, setLivraisons] = useState<Livraison[]>([]);
  const [commandes, setCommandes]   = useState<Commande[]>([]);
  const [livreurs, setLivreurs]     = useState<Livreur[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm] = useState({ commande_id: '', livreur_id: '', adresse: '' });

  async function fetchAll() {
    setLoading(true);
    const [liv, cmd, users] = await Promise.all([
      fetch('/api/livraisons').then(r => r.json()),
      fetch('/api/commandes').then(r => r.json()),
      fetch('/api/utilisateurs').then(r => r.json()),
    ]);
    setLivraisons(Array.isArray(liv) ? liv : []);
    setCommandes(Array.isArray(cmd) ? cmd.filter((c: Commande) => ['en_fabrication', 'pret_livraison'].includes(c.statut)) : []);
    setLivreurs(Array.isArray(users) ? users.filter((u: any) => u.role === 'livreur') : []);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleSubmit() {
    if (!form.commande_id) return;
    await fetch('/api/livraisons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ commande_id: parseInt(form.commande_id), livreur_id: form.livreur_id ? parseInt(form.livreur_id) : null, adresse: form.adresse }) });
    setShowModal(false); setForm({ commande_id: '', livreur_id: '', adresse: '' }); fetchAll();
  }

  async function handleLivrer(id: number) {
    if (!confirm('Confirmer la livraison ?')) return;
    await fetch(`/api/livraisons/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statut: 'livree' }) });
    fetchAll();
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer cette livraison ?')) return;
    await fetch(`/api/livraisons/${id}`, { method: 'DELETE' });
    fetchAll();
  }

  const stats = { total: livraisons.length, attente: livraisons.filter(l => l.statut === 'en_attente').length, livrees: livraisons.filter(l => l.statut === 'livree').length };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", padding: '28px 32px', maxWidth: 1400 }}>
      <style>{DS}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Logistique</div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#080f1e,#059669)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={18} color="white" />
            </div>
            Livraisons
          </h1>
          <p style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 3 }}>{stats.total} livraisons · {stats.attente} en attente · {stats.livrees} effectuées</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchAll} className="btn-ghost">
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={15} /> Nouvelle livraison</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total',      value: stats.total,   color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'En attente', value: stats.attente,  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          { label: 'Livrées',    value: stats.livrees,  color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#080f1e' }}>
              {['#', 'Client', 'Adresse', 'Livreur', 'Statut', 'Date', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 10.5, fontWeight: 700, color: '#4d7aa3', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Chargement...</td></tr>
            ) : livraisons.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 56 }}>
                <Truck size={32} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.2, color: '#94a3b8' }} />
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Aucune livraison</span>
              </td></tr>
            ) : livraisons.map(l => {
              const cfg = STATUT_CFG[l.statut] || { label: l.statut, color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' };
              return (
                <tr key={l.id} className="tr-row" style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>#{l.id}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{l.client_nom}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Commande #{l.commande_id}</div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#64748b', maxWidth: 160 }}>
                      <MapPin size={12} color="#94a3b8" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.adresse || l.adresse_livraison || '—'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>{l.livreur_nom || '—'}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 11.5, color: '#94a3b8' }}>
                    {l.date_livraison ? new Date(l.date_livraison).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {l.statut !== 'livree' && (
                        <button onClick={() => handleLivrer(l.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#059669', borderRadius: 8, padding: '6px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
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
        {livraisons.length > 0 && <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#94a3b8' }}>{livraisons.length} livraison{livraisons.length > 1 ? 's' : ''}</div>}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: '#0f172a', margin: 0 }}>Nouvelle livraison</h2>
              <button onClick={() => setShowModal(false)} className="close-btn"><X size={15} color="#64748b" /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label>Commande *</label>
                <select className="select-field" value={form.commande_id} onChange={e => setForm({ ...form, commande_id: e.target.value })}>
                  <option value="">Sélectionner une commande</option>
                  {commandes.map(c => <option key={c.id} value={c.id}>Commande #{c.id} — {c.client_nom} ({Number(c.total).toLocaleString('fr-FR')} DA)</option>)}
                </select>
                {commandes.length === 0 && <p style={{ fontSize: 11.5, color: '#d97706', marginTop: 5 }}>Aucune commande prête. Terminez la fabrication d'abord.</p>}
              </div>
              <div>
                <label>Livreur</label>
                <select className="select-field" value={form.livreur_id} onChange={e => setForm({ ...form, livreur_id: e.target.value })}>
                  <option value="">Sans livreur assigné</option>
                  {livreurs.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
                </select>
              </div>
              <div>
                <label>Adresse de livraison</label>
                <textarea className="input-field" rows={2} placeholder="Adresse complète" value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value } as any)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setShowModal(false)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Annuler</button>
              <button onClick={handleSubmit} disabled={!form.commande_id} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>Créer la livraison</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}