"use client";

import { useEffect, useState } from "react";
import { Layers, Plus, X, RefreshCw, AlertTriangle, CheckCircle, TrendingDown, TrendingUp, Trash2 } from "lucide-react";

interface Matiere {
  id: number; titre: string; description: string;
  stock_actuel: number; stock_minimum: number; unite: string;
  cout_unitaire: number; cout_en_da: number; cout_en_euro: number;
  taux_change: number; derniere_maj_taux: string;
}

const UNITES = ['kg', 'litre', 'm²', 'm³', 'unité', 'tonne', 'boîte', 'ml'];

const DS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box}
.btn-primary{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:white;border:none;border-radius:9px;padding:9px 18px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .2s;box-shadow:0 2px 12px rgba(124,58,237,.35)}
.btn-primary:hover{transform:translateY(-1px);filter:brightness(1.1)}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--border);color:var(--text-secondary);border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:var(--violet);color:var(--violet-light);background:rgba(124,58,237,.08)}
.btn-green{display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.3);color:#10b981;border-radius:9px;padding:8px 16px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .15s}
.btn-green:hover{background:rgba(16,185,129,.22)}
.btn-danger{display:inline-flex;align-items:center;gap:5px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#ef4444;border-radius:8px;padding:6px 11px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif}
.btn-danger:hover{background:rgba(239,68,68,.2)}
.inp{width:100%;background:var(--bg-surface) !important;border:1px solid var(--border) !important;border-radius:9px;padding:10px 13px;font-family:'Outfit',sans-serif;font-size:13.5px;color:var(--text-primary) !important;outline:none;transition:all .15s}
.inp:focus{border-color:var(--violet) !important;box-shadow:0 0 0 3px rgba(124,58,237,.15) !important}
.inp::placeholder{color:var(--text-muted)}
label{font-size:11.5px;font-weight:600;color:var(--text-secondary);margin-bottom:5px;display:block;letter-spacing:.02em}
.tr-row{border-bottom:1px solid var(--border);transition:background .15s}
.tr-row:hover td{background:var(--bg-surface) !important}
.progress-track{height:5px;background:var(--border);border-radius:3px;overflow:hidden}
.progress-fill{height:100%;border-radius:3px;transition:width .5s ease}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function GestionMatieresPage() {
  const [matieres, setMatieres]       = useState<Matiere[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tauxLoading, setTauxLoading] = useState(false);
  const [taux, setTaux]               = useState<number | null>(null);
  const [error, setError]             = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [deletingId, setDeletingId]   = useState<number | null>(null);
  const [form, setForm] = useState({ titre: '', description: '', cout_en_da: '', unite: 'kg', stock_actuel: '', stock_minimum: '' });

  async function fetchMatieres() {
    setLoading(true);
    try {
      const res = await fetch('/api/matieres-premieres');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setMatieres(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function fetchTaux() {
    setTauxLoading(true);
    try {
      const res  = await fetch('/api/taux-change');
      const data = await res.json();
      if (data.success) { setTaux(data.taux_eur_dzd); await fetchMatieres(); }
    } catch (e: any) { setError(e.message); }
    finally { setTauxLoading(false); }
  }

  useEffect(() => { fetchMatieres(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/matieres-premieres', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Erreur ajout');
      setShowForm(false);
      setForm({ titre: '', description: '', cout_en_da: '', unite: 'kg', stock_actuel: '', stock_minimum: '' });
      fetchMatieres();
    } catch (e: any) { setError(e.message); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer cette matière première ?')) return;
    setDeletingId(id);
    try { await fetch(`/api/matieres-premieres/${id}`, { method: 'DELETE' }); setMatieres(prev => prev.filter(m => m.id !== id)); }
    catch (e: any) { setError(e.message); }
    finally { setDeletingId(null); }
  }

  const critique = matieres.filter(m => Number(m.stock_actuel) <= Number(m.stock_minimum)).length;
  const ok       = matieres.filter(m => Number(m.stock_actuel) > Number(m.stock_minimum)).length;
  const maxStock = Math.max(...matieres.map(m => Number(m.stock_actuel)), 1);

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", padding: '28px 32px', maxWidth: 1400 }}>
      <style>{DS}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Approvisionnement</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#06b6d4,#7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(6,182,212,.4)' }}>
              <Layers size={18} color="white" />
            </div>
            Matières Premières
          </h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>Suivi des stocks · Coûts · Taux de change EUR/DZD</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchMatieres} className="btn-ghost"><RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser</button>
          <button onClick={fetchTaux} disabled={tauxLoading} className="btn-green">
            <TrendingUp size={14} style={{ animation: tauxLoading ? 'spin 1s linear infinite' : 'none' }} />
            {tauxLoading ? 'Mise à jour...' : taux ? `1 EUR = ${taux} DA` : 'Actualiser taux EUR/DZD'}
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary"><Plus size={15} /> {showForm ? 'Annuler' : 'Ajouter'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total matières',  value: matieres.length, color: '#06b6d4', bg: 'rgba(6,182,212,.1)',   border: 'rgba(6,182,212,.2)'   },
          { label: 'Stock OK',        value: ok,              color: '#10b981', bg: 'rgba(16,185,129,.1)', border: 'rgba(16,185,129,.2)' },
          { label: 'Stock critique',  value: critique,        color: '#ef4444', bg: 'rgba(239,68,68,.1)',  border: 'rgba(239,68,68,.2)'  },
          { label: 'Taux EUR/DZD',    value: taux ? `${taux} DA` : '—', color: '#a855f7', bg: 'rgba(168,85,247,.1)', border: 'rgba(168,85,247,.2)' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: i===3?16:24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {critique > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
          <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 500 }}>{critique} matière{critique > 1 ? 's' : ''} en stock critique</span>
        </div>
      )}

      {error && <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 9, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#ef4444' }}>{error}</div>}

      {showForm && (
        <form onSubmit={handleAdd} style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', margin: 0 }}>Nouvelle matière première</h2>
            <button type="button" onClick={() => setShowForm(false)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}><X size={14} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div><label>Titre *</label><input className="inp" required placeholder="Ex: Bois Pin" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} /></div>
            <div><label>Unité *</label><select className="inp" value={form.unite} onChange={e => setForm({ ...form, unite: e.target.value })}>{UNITES.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
            <div>
              <label>Coût unitaire (DA) *</label>
              <input className="inp" type="number" placeholder="Ex: 800" value={form.cout_en_da} onChange={e => setForm({ ...form, cout_en_da: e.target.value })} />
              {taux && form.cout_en_da && <p style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>≈ {(parseFloat(form.cout_en_da) / taux).toFixed(2)} EUR</p>}
            </div>
            <div><label>Stock actuel</label><input className="inp" type="number" placeholder="0" value={form.stock_actuel} onChange={e => setForm({ ...form, stock_actuel: e.target.value })} /></div>
            <div><label>Stock minimum</label><input className="inp" type="number" placeholder="10" value={form.stock_minimum} onChange={e => setForm({ ...form, stock_minimum: e.target.value })} /></div>
            <div><label>Description</label><input className="inp" placeholder="Description optionnelle" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button type="submit" className="btn-primary">Enregistrer</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
          </div>
        </form>
      )}

      <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              {['Matière première', 'Stock actuel', 'Niveau', 'Coût (DA)', 'Coût (EUR)', 'État', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Chargement...</td></tr>
            ) : matieres.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 56 }}>
                <Layers size={32} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.2, color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucune matière première</span>
              </td></tr>
            ) : matieres.map(m => {
              const stockActuel = Number(m.stock_actuel);
              const stockMin    = Number(m.stock_minimum) || 0;
              const pct         = Math.min((stockActuel / maxStock) * 100, 100);
              const isOk        = stockActuel > stockMin;
              const isBas       = stockActuel > 0 && stockActuel <= stockMin;
              const isRupture   = stockActuel === 0;
              const coutEur     = m.cout_en_euro || (taux && m.cout_en_da ? Number(m.cout_en_da) / taux : null);

              return (
                <tr key={m.id} className="tr-row">
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, background: isOk ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)', border: `1px solid ${isOk ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)'}`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isOk ? <CheckCircle size={15} color="#10b981" /> : <TrendingDown size={15} color="#ef4444" />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{m.titre}</div>
                        {m.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: isOk ? 'var(--text-primary)' : '#ef4444' }}>{stockActuel}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>{m.unite || 'unités'}</span>
                    {stockMin > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Min: {stockMin}</div>}
                  </td>
                  <td style={{ padding: '13px 16px', minWidth: 120 }}>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: isOk ? '#10b981' : isBas ? '#f59e0b' : '#ef4444' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{Math.round(pct)}%</div>
                  </td>
                  <td style={{ padding: '13px 16px', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                    {m.cout_en_da ? `${Number(m.cout_en_da).toLocaleString('fr-DZ')} DA` : m.cout_unitaire ? `${Number(m.cout_unitaire).toLocaleString('fr-DZ')} DA` : '—'}
                  </td>
                  <td style={{ padding: '13px 16px', fontWeight: 600, fontSize: 13, color: '#10b981' }}>
                    {coutEur ? `${Number(coutEur).toFixed(2)} €` : '—'}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: isRupture ? 'rgba(239,68,68,.1)' : isBas ? 'rgba(245,158,11,.1)' : 'rgba(16,185,129,.1)', color: isRupture ? '#ef4444' : isBas ? '#f59e0b' : '#10b981', border: `1px solid ${isRupture ? 'rgba(239,68,68,.25)' : isBas ? 'rgba(245,158,11,.25)' : 'rgba(16,185,129,.25)'}` }}>
                      {isRupture ? '● Rupture' : isBas ? '⚠ Stock bas' : '✓ OK'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <button onClick={() => handleDelete(m.id)} disabled={deletingId === m.id} className="btn-danger">
                      <Trash2 size={12} /> {deletingId === m.id ? '...' : 'Supprimer'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {matieres.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{matieres.length} matière{matieres.length > 1 ? 's' : ''} première{matieres.length > 1 ? 's' : ''}</span>
            {taux && <span>Taux appliqué : 1 EUR = {taux} DA</span>}
          </div>
        )}
      </div>
    </div>
  );
}