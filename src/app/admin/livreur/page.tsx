'use client';

import { useState, useEffect } from 'react';
import { Truck, Plus, X, Mail, CheckCircle, Package, RefreshCw } from 'lucide-react';

interface Livreur { id: number; nom: string; email: string; role: string; created_at: string; livraisons_count?: number; livraisons_terminees?: number; }

const DS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box}
.btn-primary{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:white;border:none;border-radius:9px;padding:9px 18px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .2s;box-shadow:0 2px 12px rgba(124,58,237,.35)}
.btn-primary:hover{transform:translateY(-1px);filter:brightness(1.1)}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--border);color:var(--text-secondary);border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:var(--violet);color:var(--violet-light);background:rgba(124,58,237,.08)}
.btn-danger{display:inline-flex;align-items:center;gap:5px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#ef4444;border-radius:8px;padding:6px 11px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif}
.btn-danger:hover{background:rgba(239,68,68,.2)}
.inp{width:100%;background:var(--bg-surface) !important;border:1px solid var(--border) !important;border-radius:9px;padding:10px 13px;font-family:'Outfit',sans-serif;font-size:13.5px;color:var(--text-primary) !important;outline:none;transition:all .15s}
.inp:focus{border-color:var(--violet) !important;box-shadow:0 0 0 3px rgba(124,58,237,.15) !important}
.inp::placeholder{color:var(--text-muted)}
label{font-size:11.5px;font-weight:600;color:var(--text-secondary);margin-bottom:5px;display:block;letter-spacing:.02em}
.tr-row{border-bottom:1px solid var(--border);transition:background .15s}
.tr-row:hover td{background:var(--bg-card-hover) !important}
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
    try {
      const res = await fetch('/api/livraisons/livreur');
      const data = await res.json();
      setLivreurs(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }

  async function handleSubmit() {
    if (!form.nom || !form.email || !form.mot_de_passe) { setError('Tous les champs sont obligatoires'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/livraisons/livreur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ nom: '', email: '', mot_de_passe: '' });
        setShowForm(false);
        fetchLivreurs();
      } else {
        const d = await res.json();
        setError(d.error || 'Erreur');
      }
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer ce livreur ?')) return;
    await fetch('/api/livraisons/livreur/' + id, { method: 'DELETE' });
    fetchLivreurs();
  }

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", padding: '28px 32px', maxWidth: 1400 }}>
      <style>{DS}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Équipe</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#06b6d4,#7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(6,182,212,.4)' }}>
              <Truck size={18} color="white" />
            </div>
            Livreurs
          </h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>{livreurs.length} livreurs enregistrés</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchLivreurs} className="btn-ghost">
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser
          </button>
          <button onClick={() => { setShowForm(!showForm); setError(''); }} className="btn-primary">
            <Plus size={15} /> Ajouter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total livreurs',       value: livreurs.length, color: '#06b6d4', bg: 'rgba(6,182,212,.1)',   border: 'rgba(6,182,212,.2)' },
          { label: 'Livraisons totales',   value: livreurs.reduce((a, l) => a + Number(l.livraisons_count || 0), 0), color: '#a855f7', bg: 'rgba(168,85,247,.1)', border: 'rgba(168,85,247,.2)' },
          { label: 'Livraisons terminées', value: livreurs.reduce((a, l) => a + Number(l.livraisons_terminees || 0), 0), color: '#10b981', bg: 'rgba(16,185,129,.1)', border: 'rgba(16,185,129,.2)' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Nouveau livreur</h2>
            <button onClick={() => setShowForm(false)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label>Nom complet *</label><input className="inp" placeholder="Karim Benali" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
            <div><label>Email *</label><input className="inp" type="email" placeholder="livreur@gestion.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div style={{ gridColumn: 'span 2' }}><label>Mot de passe *</label><input className="inp" type="password" placeholder="Minimum 6 caractères" value={form.mot_de_passe} onChange={e => setForm({ ...form, mot_de_passe: e.target.value })} /></div>
          </div>
          {error && (
            <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 8, padding: '9px 12px', marginTop: 12, fontSize: 13, color: '#ef4444' }}>{error}</div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary">{saving ? 'Création...' : 'Créer le compte'}</button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              {['Livreur', 'Email', 'Livraisons', 'Statut', 'Inscrit le', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Chargement...</td></tr>
            ) : livreurs.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 56 }}>
                <Truck size={32} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.2, color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucun livreur</span>
              </td></tr>
            ) : livreurs.map(l => (
              <tr key={l.id} className="tr-row">
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#06b6d4,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {l.nom?.[0]?.toUpperCase() || 'L'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{l.nom}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID #{l.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--cyan)' }}>
                    <Mail size={12} /> {l.email}
                  </div>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Package size={13} color="var(--text-muted)" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{l.livraisons_count || 0}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>total</span>
                  </div>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(16,185,129,.1)', color: '#10b981', border: '1px solid rgba(16,185,129,.25)' }}>
                    <CheckCircle size={11} /> Actif
                  </span>
                </td>
                <td style={{ padding: '13px 16px', fontSize: 11.5, color: 'var(--text-muted)' }}>
                  {new Date(l.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <button onClick={() => handleDelete(l.id)} className="btn-danger"><X size={12} /> Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {livreurs.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            {livreurs.length} livreur{livreurs.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}