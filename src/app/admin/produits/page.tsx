'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Package, X, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';

interface Produit { id: number; nom: string; description: string; categorie: string; unite: string; cout_matieres_premieres: number; cout_fabrication: number; cout_total: number; marge_base: number; marge_dynamique: number; prix_vente: number; stock_disponible: number; stock_minimum: number; }
interface PrixCalc { cout_total: string; marge_dynamique: number; prix_vente: string; raisons: string[]; }

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
.btn-calc{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.25);color:var(--violet-light);border-radius:9px;padding:10px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;width:100%;transition:all .15s}
.btn-calc:hover{background:rgba(124,58,237,.15)}
.btn-calc:disabled{opacity:.5;cursor:not-allowed}
.inp{width:100%;background:var(--bg-surface) !important;border:1px solid var(--border) !important;border-radius:9px;padding:10px 13px;font-family:'Outfit',sans-serif;font-size:13.5px;color:var(--text-primary) !important;outline:none;transition:all .15s}
.inp:focus{border-color:var(--violet) !important;box-shadow:0 0 0 3px rgba(124,58,237,.15) !important}
.inp::placeholder{color:var(--text-muted)}
label{font-size:11.5px;font-weight:600;color:var(--text-secondary);margin-bottom:5px;display:block;letter-spacing:.02em}
.overlay{position:fixed;inset:0;background:rgba(4,4,20,.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;animation:fadeIn .2s}
.modal{background:var(--bg-card);border:1px solid var(--border);border-radius:18px;width:100%;max-width:540px;max-height:90vh;overflow-y:auto;padding:28px;box-shadow:0 32px 80px rgba(0,0,0,.5);animation:slideUp .2s}
.tr-row{border-bottom:1px solid var(--border);transition:background .15s}
.tr-row:hover td{background:var(--bg-surface) !important}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function Produits() {
  const [produits, setProduits]   = useState<Produit[]>([]);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [prixCalc, setPrixCalc]   = useState<PrixCalc | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [form, setForm] = useState({ nom: '', description: '', categorie: '', unite: 'unité', cout_matieres_premieres: '', cout_fabrication: '', marge_base: '20', stock_disponible: '', stock_minimum: '10' });

  async function fetchProduits() {
    setLoading(true);
    try {
      const res = await fetch('/api/produits');
      const data = await res.json();
      setProduits(Array.isArray(data) ? data : []);
      if (!res.ok) setError(data?.error || 'Erreur');
    } catch { setError('Erreur réseau'); }
    setLoading(false);
  }

  useEffect(() => { fetchProduits(); }, []);

  async function calculerPrix() {
    if (!form.cout_matieres_premieres || !form.cout_fabrication) return;
    setCalcLoading(true);
    try {
      const res  = await fetch('/api/produits/prix', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cout_matieres_premieres: parseFloat(form.cout_matieres_premieres), cout_fabrication: parseFloat(form.cout_fabrication), categorie: form.categorie, marge_base: parseFloat(form.marge_base) }) });
      const data = await res.json();
      if (data.success) setPrixCalc(data);
    } finally { setCalcLoading(false); }
  }

  async function handleSubmit() {
    const res = await fetch('/api/produits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, cout_matieres_premieres: parseFloat(form.cout_matieres_premieres || '0'), cout_fabrication: parseFloat(form.cout_fabrication || '0'), marge_base: parseFloat(form.marge_base || '20'), stock_disponible: parseInt(form.stock_disponible || '0'), stock_minimum: parseInt(form.stock_minimum || '10') }) });
    if (res.ok) { setShowModal(false); setPrixCalc(null); setForm({ nom: '', description: '', categorie: '', unite: 'unité', cout_matieres_premieres: '', cout_fabrication: '', marge_base: '20', stock_disponible: '', stock_minimum: '10' }); fetchProduits(); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer ce produit ?')) return;
    await fetch('/api/produits/' + id, { method: 'DELETE' });
    fetchProduits();
  }

  const stockBas = produits.filter(p => p.stock_disponible <= p.stock_minimum).length;

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", padding: '28px 32px', maxWidth: 1400 }}>
      <style>{DS}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Catalogue</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(124,58,237,.4)' }}>
              <Package size={18} color="white" />
            </div>
            Produits
          </h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>{produits.length} produits · {stockBas} en stock bas</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchProduits} className="btn-ghost"><RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser</button>
          <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={15} /> Ajouter un produit</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total produits', value: produits.length, color: '#a855f7', bg: 'rgba(168,85,247,.1)', border: 'rgba(168,85,247,.2)' },
          { label: 'En stock OK',    value: produits.filter(p => p.stock_disponible > p.stock_minimum).length, color: '#10b981', bg: 'rgba(16,185,129,.1)', border: 'rgba(16,185,129,.2)' },
          { label: 'Stock bas',      value: stockBas, color: '#ef4444', bg: 'rgba(239,68,68,.1)', border: 'rgba(239,68,68,.2)' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 9, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#ef4444' }}>{error}</div>}

      <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              {['Produit', 'Catégorie', 'Coût MP', 'Coût Fab.', 'Marge', 'Prix Vente', 'Stock', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Chargement...</td></tr>
            ) : produits.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 56 }}>
                <Package size={32} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.2, color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucun produit</span>
              </td></tr>
            ) : produits.map(p => {
              const bas = p.stock_disponible <= p.stock_minimum;
              return (
                <tr key={p.id} className="tr-row">
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, background: 'rgba(124,58,237,.12)', border: '1px solid rgba(124,58,237,.25)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Package size={15} color="#a855f7" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{p.nom}</div>
                        {p.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{p.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12.5, color: 'var(--text-secondary)' }}>{p.categorie || '—'}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12.5, color: 'var(--text-secondary)' }}>{Number(p.cout_matieres_premieres).toLocaleString('fr-DZ')} DA</td>
                  <td style={{ padding: '13px 16px', fontSize: 12.5, color: 'var(--text-secondary)' }}>{Number(p.cout_fabrication).toLocaleString('fr-DZ')} DA</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(16,185,129,.1)', color: '#10b981', border: '1px solid rgba(16,185,129,.25)' }}>
                      <TrendingUp size={10} /> {p.marge_dynamique}%
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#10b981' }}>{Number(p.prix_vente).toLocaleString('fr-DZ')} DA</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {bas && <AlertTriangle size={12} color="#ef4444" />}
                      <span style={{ fontWeight: 700, fontSize: 14, color: bas ? '#ef4444' : 'var(--text-primary)' }}>{p.stock_disponible}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>/ min {p.stock_minimum}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <button onClick={() => handleDelete(p.id)} className="btn-danger"><Trash2 size={12} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {produits.length > 0 && <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>{produits.length} produit{produits.length > 1 ? 's' : ''}</div>}
      </div>

      {showModal && (
        <div className="overlay" onClick={() => { setShowModal(false); setPrixCalc(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', margin: 0 }}>Ajouter un produit</h2>
              <button onClick={() => { setShowModal(false); setPrixCalc(null); }} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div><label>Nom du produit *</label><input className="inp" placeholder="Ex: Table en bois" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}><label>Catégorie</label><input className="inp" placeholder="Ex: mobilier" value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} /></div>
                <div style={{ flex: 1 }}>
                  <label>Unité</label>
                  <select className="inp" value={form.unite} onChange={e => setForm({ ...form, unite: e.target.value })}>
                    <option value="unité">Unité</option><option value="kg">Kilogramme</option><option value="litre">Litre</option><option value="m2">Mètre carré</option>
                  </select>
                </div>
              </div>
              <div><label>Description</label><textarea className="inp" placeholder="Description" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value } as any)} /></div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}><label>Coût matières (DA)</label><input className="inp" type="number" placeholder="500" value={form.cout_matieres_premieres} onChange={e => setForm({ ...form, cout_matieres_premieres: e.target.value })} /></div>
                <div style={{ flex: 1 }}><label>Coût fabrication (DA)</label><input className="inp" type="number" placeholder="200" value={form.cout_fabrication} onChange={e => setForm({ ...form, cout_fabrication: e.target.value })} /></div>
              </div>
              <div><label>Marge de base (%)</label><input className="inp" type="number" placeholder="20" value={form.marge_base} onChange={e => setForm({ ...form, marge_base: e.target.value })} /></div>
              <button onClick={calculerPrix} disabled={calcLoading || !form.cout_matieres_premieres || !form.cout_fabrication} className="btn-calc">
                {calcLoading ? '⏳ Calcul...' : '🧮 Calculer le prix dynamique'}
              </button>
              {prixCalc && (
                <div style={{ background: 'rgba(124,58,237,.08)', border: '1px solid rgba(124,58,237,.2)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {[
                      { label: 'Coût total',      value: prixCalc.cout_total + ' DA' },
                      { label: 'Marge appliquée', value: prixCalc.marge_dynamique + '%', color: '#a855f7' },
                      { label: 'Prix de vente',   value: prixCalc.prix_vente + ' DA',   color: '#10b981' },
                    ].map((item, i) => (
                      <div key={i} style={{ textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 9, padding: '10px 8px' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: item.color || 'var(--text-primary)' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}><label>Stock disponible</label><input className="inp" type="number" placeholder="0" value={form.stock_disponible} onChange={e => setForm({ ...form, stock_disponible: e.target.value })} /></div>
                <div style={{ flex: 1 }}><label>Stock minimum</label><input className="inp" type="number" placeholder="10" value={form.stock_minimum} onChange={e => setForm({ ...form, stock_minimum: e.target.value })} /></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => { setShowModal(false); setPrixCalc(null); }} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Annuler</button>
              <button onClick={handleSubmit} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>Enregistrer le produit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}