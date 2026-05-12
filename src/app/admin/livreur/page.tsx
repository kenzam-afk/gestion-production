'use client';

import { useState, useEffect } from 'react';
import { Truck, Plus, X, Mail, CheckCircle, Package, RefreshCw } from 'lucide-react';

interface Livreur { id: number; nom: string; email: string; role: string; created_at: string; livraisons_count?: number; livraisons_terminees?: number; }

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
label{font-size:11.5px;font-weight:600;color:#64748b;margin-bottom:5px;display:block;letter-spacing:.02em}
.tr-row:hover td{background:#f8fafc}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function LivreursPage() {
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', email: '', mot_de_passe: '' });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => { fetchLivreurs(); }, []);

  async function fetchLivreurs() {
    setLoading(true);
    try { const res = await fetch('/api/livreurs'); const data = await res.json(); setLivreurs(Array.isArray(data) ? data : []); }
    finally { setLoading(false); }
  }

  async function handleSubmit() {
    if (!form.nom || !form.email || !form.mot_de_passe) { setError('Tous les champs sont obligatoires'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/livreurs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { setForm({ nom: '', email: '', mot_de_passe: '' }); setShowForm(false); fetchLivreurs(); }
      else { const d = await res.json(); setError(d.error || 'Erreur'); }
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer ce livreur ?')) return;
    await fetch('/api/livreurs/' + id, { method: 'DELETE' });
    fetchLivreurs();
  }

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", padding: '28px 32px', maxWidth: 1400 }}>
      <style>{DS}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Équipe</div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#080f1e,#0e7490)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={18} color="white" />
            </div>
            Livreurs
          </h1>
          <p style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 3 }}>{livreurs.length} livreurs enregistrés</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchLivreurs} className="btn-ghost"><RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser</button>
          <button onClick={() => { setShowForm(!showForm); setError(''); }} className="btn-primary"><Plus size={15} /> Ajouter</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total livreurs', value: livreurs.length, color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'Livraisons totales', value: livreurs.reduce((a, l) => a + (l.livraisons_count || 0), 0), color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
          { label: 'Livraisons terminées', value: livreurs.reduce((a, l) => a + (l.livraisons_terminees || 0), 0), color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,.04)', padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16, color: '#0f172a', margin: 0 }}>Nouveau livreur</h2>
            <button onClick={() => setShowForm(false)} style={{ width: 28, height: 28, borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} color="#64748b" /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label>Nom complet *</label><input className="input-field" placeholder="Karim Benali" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
            <div><label>Email *</label><input className="input-field" type="email" placeholder="livreur@gestion.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div style={{ gridColumn: 'span 2' }}><label>Mot de passe *</label><input className="input-field" type="password" placeholder="Minimum 6 caractères" value={form.mot_de_passe} onChange={e => setForm({ ...form, mot_de_passe: e.target.value })} /></div>
          </div>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '9px 12px', marginTop: 12, fontSize: 13, color: '#dc2626' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary">{saving ? 'Création...' : 'Créer le compte'}</button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#080f1e' }}>
              {['Livreur', 'Email', 'Livraisons', 'Statut', 'Inscrit le', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 10.5, fontWeight: 700, color: '#4d7aa3', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Chargement...</td></tr>
            ) : livreurs.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 56 }}>
                <Truck size={32} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.2, color: '#94a3b8' }} />
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Aucun livreur</span>
              </td></tr>
            ) : livreurs.map(l => (
              <tr key={l.id} className="tr-row" style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#0d1f3c,#0e7490)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#67e8f9', flexShrink: 0, fontFamily: "'Space Grotesk',sans-serif" }}>
                      {l.nom?.[0]?.toUpperCase() || 'L'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{l.nom}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>ID #{l.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#1a56db' }}><Mail size={12} /> {l.email}</div>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Package size={13} color="#94a3b8" />
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{l.livraisons_count || 0}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>total</span>
                  </div>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0' }}>
                    <CheckCircle size={11} /> Actif
                  </span>
                </td>
                <td style={{ padding: '13px 16px', fontSize: 11.5, color: '#94a3b8' }}>{new Date(l.created_at).toLocaleDateString('fr-FR')}</td>
                <td style={{ padding: '13px 16px' }}>
                  <button onClick={() => handleDelete(l.id)} className="btn-danger"><X size={12} /> Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {livreurs.length > 0 && <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#94a3b8' }}>{livreurs.length} livreur{livreurs.length > 1 ? 's' : ''}</div>}
      </div>
    </div>
  );
}