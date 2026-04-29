'use client';

import { useState, useEffect } from 'react';
import { Truck, Plus, X, Phone, Mail, User, CheckCircle, XCircle, Package } from 'lucide-react';

interface Livreur {
  id: number;
  nom: string;
  email: string;
  role: string;
  created_at: string;
  livraisons_count?: number;
  livraisons_terminees?: number;
}

const S = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box}
.pc{background:white;border-radius:20px;box-shadow:0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04)}
.inp{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 13px;font-family:'Sora',sans-serif;font-size:13px;color:#1e293b;outline:none;transition:border .2s;background:#f8fafc;box-sizing:border-box}
.inp:focus{border-color:#3b82f6;background:white}
.lbl{font-size:11px;font-weight:600;color:#64748b;margin-bottom:5px;display:block}
.bmain{display:flex;align-items:center;gap:7px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:white;border:none;border-radius:11px;padding:11px 20px;font-weight:600;cursor:pointer;font-family:'Sora',sans-serif;font-size:13px;transition:all .2s;box-shadow:0 4px 12px rgba(59,130,246,.3)}
.bmain:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(59,130,246,.4)}
.bmain:disabled{opacity:.5;cursor:not-allowed;transform:none}
.bghost{display:flex;align-items:center;gap:7px;background:transparent;border:1.5px solid #e2e8f0;color:#64748b;border-radius:11px;padding:10px 18px;font-weight:500;cursor:pointer;font-family:'Sora',sans-serif;font-size:13px;transition:all .2s}
.bghost:hover{border-color:#3b82f6;color:#3b82f6;background:#eff6ff}
.trh:hover{background:#f8fafc}
.bdg{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600}
`;

export default function LivreursPage() {
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', email: '', mot_de_passe: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchLivreurs(); }, []);

  const fetchLivreurs = async () => {
    try {
      const res = await fetch('/api/livreurs');
      const data = await res.json();
      setLivreurs(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.nom || !form.email || !form.mot_de_passe) {
      setError('Tous les champs sont obligatoires');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/livreurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ nom: '', email: '', mot_de_passe: '' });
        setShowForm(false);
        fetchLivreurs();
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la création');
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce livreur ?')) return;
    await fetch(`/api/livreurs/${id}`, { method: 'DELETE' });
    fetchLivreurs();
  };

  return (
    <div style={{ fontFamily: "'Sora',sans-serif", maxWidth: 1100, margin: '0 auto' }}>
      <style>{S}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            Administration
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#0f2547,#1e40af)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={22} color="white" />
            </div>
            Livreurs
          </h1>
        </div>
        <button className="bmain" onClick={() => { setShowForm(!showForm); setError(''); }}>
          <Plus size={16} /> Ajouter un livreur
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total livreurs', value: livreurs.length, color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'Livraisons totales', value: livreurs.reduce((a, l) => a + (l.livraisons_count || 0), 0), color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
          { label: 'Livraisons terminées', value: livreurs.reduce((a, l) => a + (l.livraisons_terminees || 0), 0), color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
        ].map((s, i) => (
          <div key={i} className="pc" style={{ padding: '20px 24px', border: `1px solid ${s.border}`, background: s.bg }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="pc" style={{ padding: 28, marginBottom: 24, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontWeight: 800, fontSize: 17, color: '#0f172a', margin: 0 }}>Nouveau livreur</h2>
            <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} color="#64748b" />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="lbl">Nom complet *</label>
              <input className="inp" placeholder="Ex: Karim Benali" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div>
              <label className="lbl">Email *</label>
              <input className="inp" type="email" placeholder="livreur@gestion.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="lbl">Mot de passe *</label>
              <input className="inp" type="password" placeholder="Minimum 6 caractères" value={form.mot_de_passe} onChange={e => setForm({ ...form, mot_de_passe: e.target.value })} />
            </div>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginTop: 12 }}>
              <XCircle size={15} color="#dc2626" />
              <span style={{ fontSize: 13, color: '#dc2626' }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="bmain" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Création...' : 'Créer le compte livreur'}
            </button>
            <button className="bghost" onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="pc" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 13 }}>Chargement...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(90deg,#0d1f3c,#0f2547)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                {['Livreur', 'Email', 'Livraisons', 'Statut', 'Inscrit le', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '13px 16px', fontSize: 11, fontWeight: 700, color: '#7ea6cc', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {livreurs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 14 }}>
                    <Truck size={32} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                    Aucun livreur enregistré
                  </td>
                </tr>
              ) : livreurs.map(l => (
                <tr key={l.id} className="trh" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#1e3a6e,#2d5a9e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#93c5fd', flexShrink: 0 }}>
                        {l.nom?.[0]?.toUpperCase() || 'L'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{l.nom}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>ID #{l.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#3b82f6' }}>
                      <Mail size={13} />
                      {l.email}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Package size={14} color="#94a3b8" />
                      <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
                        {l.livraisons_count || 0}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>au total</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="bdg" style={{ background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0' }}>
                      <CheckCircle size={11} /> Actif
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 11, color: '#94a3b8' }}>
                    {new Date(l.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => handleDelete(l.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Sora',sans-serif" }}
                    >
                      <X size={12} /> Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {livreurs.length > 0 && (
          <div style={{ padding: '11px 16px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{livreurs.length} livreur{livreurs.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}