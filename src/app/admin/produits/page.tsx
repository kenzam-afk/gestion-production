'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Package, X, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';

interface Produit { id: number; nom: string; description: string; categorie: string; unite: string; cout_matieres_premieres: number; cout_fabrication: number; cout_total: number; marge_base: number; marge_dynamique: number; prix_vente: number; stock_disponible: number; stock_minimum: number; }
interface PrixCalc { cout_total: string; marge_dynamique: number; prix_vente: string; raisons: string[]; }

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
.btn-calc{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#f8fafc;border:1.5px solid #e2e8f0;color:#475569;border-radius:9px;padding:10px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;width:100%;transition:all .15s}
.btn-calc:hover{border-color:#1a56db;color:#1a56db;background:#eff6ff}
.btn-calc:disabled{opacity:.5;cursor:not-allowed}
.input-field{width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-family:'DM Sans',sans-serif;font-size:13.5px;color:#1e293b;outline:none;transition:border .15s;background:#f8fafc}
.input-field:focus{border-color:#1a56db;background:white;box-shadow:0 0 0 3px rgba(26,86,219,.08)}
.select-field{width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-family:'DM Sans',sans-serif;font-size:13.5px;color:#1e293b;outline:none;background:#f8fafc}
.select-field:focus{border-color:#1a56db;background:white}
label{font-size:11.5px;font-weight:600;color:#64748b;margin-bottom:5px;display:block;letter-spacing:.02em}
.overlay{position:fixed;inset:0;background:rgba(8,15,30,.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;animation:fadeIn .2s}
.modal{background:white;border-radius:18px;width:100%;max-width:540px;max-height:90vh;overflow-y:auto;padding:28px;box-shadow:0 32px 80px rgba(0,0,0,.25);animation:slideUp .2s}
.close-btn{width:30px;height:30px;border-radius:8px;background:#f1f5f9;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center}
.close-btn:hover{background:#e2e8f0}
.tr-row:hover td{background:#f8fafc}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function Produits() {
  const [produits, setProduits]     = useState<Produit[]>([]);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [prixCalc, setPrixCalc]     = useState<PrixCalc | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [form, setForm] = useState({ nom: '', description: '', categorie: '', unite: 'unité', cout_matieres_premieres: '', cout_fabrication: '', marge_base: '20', stock_disponible: '', stock_minimum: '10' });

  async function fetchProduits() {
    setLoading(true);
    try { const res = await fetch('/api/produits'); const data = await res.json(); setProduits(Array.isArray(data) ? data : []); if (!res.ok) setError(data?.error || 'Erreur'); }
    catch { setError('Erreur réseau'); }
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
    <div style={{ fontFamily: "'DM Sans',sans-serif", padding: '28px 32px', maxWidth: 1400 }}>
      <style>{DS}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Catalogue</div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#080f1e,#7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={18} color="white" />
            </div>
            Produits
          </h1>
          <p style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 3 }}>{produits.length} produits · {stockBas} en stock bas</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchProduits} className="btn-ghost"><RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser</button>
          <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={15} /> Ajouter un produit</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total produits',  value: produits.length, color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'En stock OK',     value: produits.filter(p => p.stock_disponible > p.stock_minimum).length, color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Stock bas',       value: stockBas, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#dc2626' }}>{error}</div>}

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#080f1e' }}>
              {['Produit', 'Catégorie', 'Coût MP', 'Coût Fab.', 'Marge', 'Prix Vente', 'Stock', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 10.5, fontWeight: 700, color: '#4d7aa3', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Chargement...</td></tr>
            ) : produits.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 56 }}>
                <Package size={32} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.2, color: '#94a3b8' }} />
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Aucun produit</span>
              </td></tr>
            ) : produits.map(p => {
              const stockBas = p.stock_disponible <= p.stock_minimum;
              return (
                <tr key={p.id} className="tr-row" style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Package size={15} color="#1a56db" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{p.nom}</div>
                        {p.description && <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{p.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12.5, color: '#64748b' }}>{p.categorie || '—'}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12.5, color: '#475569' }}>{Number(p.cout_matieres_premieres).toLocaleString('fr-DZ')} DA</td>
                  <td style={{ padding: '13px 16px', fontSize: 12.5, color: '#475569' }}>{Number(p.cout_fabrication).toLocaleString('fr-DZ')} DA</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#eff6ff', color: '#1a56db', border: '1px solid #bfdbfe' }}>
                      <TrendingUp size={10} /> {p.marge_dynamique}%
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: '#059669' }}>{Number(p.prix_vente).toLocaleString('fr-DZ')} DA</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {stockBas && <AlertTriangle size={12} color="#dc2626" />}
                      <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: stockBas ? '#dc2626' : '#0f172a' }}>{p.stock_disponible}</span>
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>/ min {p.stock_minimum}</span>
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
        {produits.length > 0 && <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#94a3b8' }}>{produits.length} produit{produits.length > 1 ? 's' : ''}</div>}
      </div>

      {/* Modal ajout produit */}
      {showModal && (
        <div className="overlay" onClick={() => { setShowModal(false); setPrixCalc(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: '#0f172a', margin: 0 }}>Ajouter un produit</h2>
              <button onClick={() => { setShowModal(false); setPrixCalc(null); }} className="close-btn"><X size={15} color="#64748b" /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div><label>Nom du produit *</label><input className="input-field" placeholder="Ex: Table en bois rouge" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}><label>Catégorie</label><input className="input-field" placeholder="Ex: mobilier, luxe..." value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} /></div>
                <div style={{ flex: 1 }}>
                  <label>Unité</label>
                  <select className="select-field" value={form.unite} onChange={e => setForm({ ...form, unite: e.target.value })}>
                    <option value="unité">Unité</option><option value="kg">Kilogramme</option><option value="litre">Litre</option><option value="m2">Mètre carré</option><option value="tonne">Tonne</option>
                  </select>
                </div>
              </div>
              <div><label>Description</label><textarea className="input-field" placeholder="Description du produit" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value } as any)} /></div>

              <div style={{ height: 1, background: '#f1f5f9' }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Coûts & Marge</div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}><label>Coût matières premières (DA)</label><input className="input-field" type="number" placeholder="500" value={form.cout_matieres_premieres} onChange={e => setForm({ ...form, cout_matieres_premieres: e.target.value })} /></div>
                <div style={{ flex: 1 }}><label>Coût fabrication (DA)</label><input className="input-field" type="number" placeholder="200" value={form.cout_fabrication} onChange={e => setForm({ ...form, cout_fabrication: e.target.value })} /></div>
              </div>
              <div><label>Marge de base (%)</label><input className="input-field" type="number" placeholder="20" value={form.marge_base} onChange={e => setForm({ ...form, marge_base: e.target.value })} /></div>

              <button onClick={calculerPrix} disabled={calcLoading || !form.cout_matieres_premieres || !form.cout_fabrication} className="btn-calc">
                {calcLoading ? '⏳ Calcul...' : '🧮 Calculer le prix dynamique'}
              </button>

              {prixCalc && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 600, color: '#1a56db', marginBottom: 10 }}>Résultat du calcul</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 10 }}>
                    {[
                      { label: 'Coût total',      value: prixCalc.cout_total + ' DA' },
                      { label: 'Marge appliquée', value: prixCalc.marge_dynamique + '%', color: '#1a56db' },
                      { label: 'Prix de vente',   value: prixCalc.prix_vente + ' DA',   color: '#059669' },
                    ].map((item, i) => (
                      <div key={i} style={{ textAlign: 'center', background: 'white', borderRadius: 9, padding: '10px 8px' }}>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: item.color || '#0f172a' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  {prixCalc.raisons.map((r, i) => <div key={i} style={{ fontSize: 11.5, color: '#1a56db', marginBottom: 2 }}>→ {r}</div>)}
                </div>
              )}

              <div style={{ height: 1, background: '#f1f5f9' }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Stock</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}><label>Stock disponible</label><input className="input-field" type="number" placeholder="0" value={form.stock_disponible} onChange={e => setForm({ ...form, stock_disponible: e.target.value })} /></div>
                <div style={{ flex: 1 }}><label>Stock minimum</label><input className="input-field" type="number" placeholder="10" value={form.stock_minimum} onChange={e => setForm({ ...form, stock_minimum: e.target.value })} /></div>
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