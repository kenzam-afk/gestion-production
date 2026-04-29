'use client';

import { useState, useEffect } from 'react';
import { Layers, Plus, X, RefreshCw, TrendingUp, AlertTriangle, Package, Trash2 } from 'lucide-react';

interface MatierePremiere {
  id: number; titre: string; description: string;
  cout_unitaire: number; unite: string;
  cout_en_da: number; cout_en_euro: number;
  taux_change: number; derniere_maj_taux: string;
  stock_actuel?: number; stock_minimum?: number;
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
.bghost{display:flex;align-items:center;gap:7px;background:transparent;border:1.5px solid #e2e8f0;color:#64748b;border-radius:11px;padding:10px 18px;font-weight:500;cursor:pointer;font-family:'Sora',sans-serif;font-size:13px;transition:all .2s}
.bghost:hover{border-color:#3b82f6;color:#3b82f6;background:#eff6ff}
.bgreen{display:flex;align-items:center;gap:7px;background:linear-gradient(135deg,#059669,#10b981);color:white;border:none;border-radius:11px;padding:11px 20px;font-weight:600;cursor:pointer;font-family:'Sora',sans-serif;font-size:13px;transition:all .2s;box-shadow:0 4px 12px rgba(16,185,129,.3)}
.bgreen:hover{transform:translateY(-1px)}
.trh:hover{background:#f8fafc}
.stock-bar{height:6px;border-radius:3px;background:#e2e8f0;overflow:hidden;margin-top:4px}
.bdg{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600}
.btn-del{background:transparent;border:none;cursor:pointer;padding:7px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:background .15s}
.btn-del:hover{background:#fef2f2}
`;

const UNITES = ['kg','litre','m²','m³','unité','tonne','boîte','ml'];

export default function MatieresPremieres() {
  const [matieres, setMatieres] = useState<MatierePremiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [taux, setTaux] = useState<number | null>(null);
  const [tauxLoading, setTauxLoading] = useState(false);
  const [form, setForm] = useState({ titre:'', description:'', cout_en_da:'', unite:'kg', stock_actuel:'', stock_minimum:'' });

  useEffect(() => { fetchMatieres(); fetchTaux(); }, []);

  const fetchMatieres = async () => {
    const res = await fetch('/api/matieres-premieres');
    const data = await res.json();
    setMatieres(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const fetchTaux = async () => {
    setTauxLoading(true);
    try {
      const res = await fetch('/api/taux-change');
      const data = await res.json();
      if (data.success) setTaux(data.taux_eur_dzd);
    } finally { setTauxLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.titre || !form.cout_en_da) return;
    const res = await fetch('/api/matieres-premieres', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ titre:'', description:'', cout_en_da:'', unite:'kg', stock_actuel:'', stock_minimum:'' });
      fetchMatieres();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette matière première ?')) return;
    await fetch(`/api/matieres-premieres/${id}`, { method: 'DELETE' });
    fetchMatieres();
  };

  const alertes = matieres.filter(m => m.stock_actuel !== undefined && m.stock_minimum !== undefined && m.stock_actuel <= m.stock_minimum);

  return (
    <div style={{ fontFamily:"'Sora',sans-serif", maxWidth:1100, margin:'0 auto' }}>
      <style>{S}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Administration</div>
          <h1 style={{ fontSize:28, fontWeight:800, color:'#0f172a', margin:0, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:42, height:42, background:'linear-gradient(135deg,#0f2547,#1e40af)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Layers size={22} color="white" />
            </div>
            Matières Premières
          </h1>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="bgreen" onClick={fetchTaux} disabled={tauxLoading}>
            <RefreshCw size={15} style={{ animation: tauxLoading ? 'spin 1s linear infinite' : 'none' }} />
            Actualiser taux
          </button>
          <button className="bmain" onClick={() => setShowForm(!showForm)}><Plus size={16}/> Ajouter</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        <div className="pc" style={{ padding:'18px 22px', border:'1px solid #bfdbfe', background:'#eff6ff' }}>
          <div style={{ fontSize:28, fontWeight:800, color:'#1e40af' }}>{matieres.length}</div>
          <div style={{ fontSize:12, color:'#64748b', fontWeight:500, marginTop:2 }}>Total matières</div>
        </div>
        <div className="pc" style={{ padding:'18px 22px', border:'1px solid #bbf7d0', background:'#f0fdf4' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
            <TrendingUp size={16} color="#059669" />
            <span style={{ fontSize:11, fontWeight:700, color:'#059669', textTransform:'uppercase', letterSpacing:'0.06em' }}>Taux EUR/DZD</span>
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:'#059669' }}>{taux ? `${taux} DA` : '—'}</div>
          <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>1 EUR = {taux ? `${taux} DA` : 'N/A'}</div>
        </div>
        <div className="pc" style={{ padding:'18px 22px', border:'1px solid #fde68a', background:'#fffbeb' }}>
          <div style={{ fontSize:28, fontWeight:800, color:'#d97706' }}>{alertes.length}</div>
          <div style={{ fontSize:12, color:'#64748b', fontWeight:500, marginTop:2 }}>Stock(s) faible(s)</div>
        </div>
        <div className="pc" style={{ padding:'18px 22px', border:'1px solid #e2e8f0' }}>
          <div style={{ fontSize:28, fontWeight:800, color:'#475569' }}>
            {matieres.filter(m => (m.stock_actuel ?? 0) > (m.stock_minimum ?? 0)).length}
          </div>
          <div style={{ fontSize:12, color:'#64748b', fontWeight:500, marginTop:2 }}>Stock(s) OK</div>
        </div>
      </div>

      {/* Alerte stock faible */}
      {alertes.length > 0 && (
        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:14, padding:'14px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
          <AlertTriangle size={18} color="#d97706" style={{ flexShrink:0 }} />
          <div>
            <span style={{ fontWeight:700, fontSize:13, color:'#92400e' }}>Réapprovisionnement requis : </span>
            <span style={{ fontSize:13, color:'#78350f' }}>{alertes.map(a => a.titre).join(', ')}</span>
          </div>
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="pc" style={{ padding:28, marginBottom:24, border:'1px solid #e2e8f0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2 style={{ fontWeight:800, fontSize:17, color:'#0f172a', margin:0 }}>Nouvelle matière première</h2>
            <button onClick={()=>setShowForm(false)} style={{ background:'#f1f5f9', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14} color="#64748b"/></button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div><label className="lbl">Titre *</label><input className="inp" placeholder="Ex: Bois Pin, Vernis..." value={form.titre} onChange={e=>setForm({...form,titre:e.target.value})} /></div>
            <div>
              <label className="lbl">Unité *</label>
              <select className="inp" value={form.unite} onChange={e=>setForm({...form,unite:e.target.value})}>
                {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl">Coût unitaire (DA) *</label>
              <input className="inp" type="number" placeholder="Ex: 800" value={form.cout_en_da} onChange={e=>setForm({...form,cout_en_da:e.target.value})} />
              {taux && form.cout_en_da && (
                <p style={{ fontSize:11, color:'#059669', marginTop:4 }}>≈ {(parseFloat(form.cout_en_da)/taux).toFixed(2)} EUR</p>
              )}
            </div>
            <div><label className="lbl">Description</label><input className="inp" placeholder="Description optionnelle" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
            <div><label className="lbl">Stock actuel</label><input className="inp" type="number" placeholder="0" value={form.stock_actuel} onChange={e=>setForm({...form,stock_actuel:e.target.value})} /></div>
            <div><label className="lbl">Stock minimum (seuil alerte)</label><input className="inp" type="number" placeholder="10" value={form.stock_minimum} onChange={e=>setForm({...form,stock_minimum:e.target.value})} /></div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:20 }}>
            <button className="bmain" onClick={handleSubmit} disabled={!form.titre||!form.cout_en_da}>Enregistrer</button>
            <button className="bghost" onClick={()=>setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="pc" style={{ overflow:'hidden' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:48, color:'#94a3b8', fontSize:13 }}>Chargement...</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'linear-gradient(90deg,#0d1f3c,#0f2547)', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
                {['Matière première','Unité','Coût unitaire (DA)','Équivalent EUR','Stock actuel','Seuil alerte','Dernière MAJ','Actions'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'13px 16px', fontSize:11, fontWeight:700, color:'#7ea6cc', textTransform:'uppercase', letterSpacing:'0.07em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matieres.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:48, color:'#94a3b8', fontSize:14 }}>
                  <Layers size={32} style={{ display:'block', margin:'0 auto 10px', opacity:0.3 }}/>
                  Aucune matière première enregistrée
                </td></tr>
              ) : matieres.map(m => {
                const stockPct = m.stock_actuel !== undefined && m.stock_minimum !== undefined
                  ? Math.min(100, Math.round((m.stock_actuel / Math.max(m.stock_minimum * 2, 1)) * 100)) : null;
                const stockBas = m.stock_actuel !== undefined && m.stock_minimum !== undefined && m.stock_actuel <= m.stock_minimum;
                return (
                  <tr key={m.id} className="trh" style={{ borderBottom:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'14px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, background: stockBas ? '#fef3c7' : '#eff6ff', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Package size={16} color={stockBas ? '#d97706' : '#3b82f6'} />
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13, color:'#0f172a' }}>{m.titre}</div>
                          {m.description && <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{m.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <span className="bdg" style={{ background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0' }}>{m.unite}</span>
                    </td>
                    <td style={{ padding:'14px 16px', fontWeight:700, fontSize:13, color:'#0f172a' }}>
                      {Number(m.cout_en_da || m.cout_unitaire).toLocaleString('fr-DZ')} DA
                    </td>
                    <td style={{ padding:'14px 16px', color:'#059669', fontWeight:600, fontSize:13 }}>
                      {m.cout_en_euro ? `${m.cout_en_euro} €` : taux ? `${(Number(m.cout_en_da || m.cout_unitaire) / taux).toFixed(2)} €` : '—'}
                    </td>
                    <td style={{ padding:'14px 16px', minWidth:100 }}>
                      {m.stock_actuel !== undefined ? (
                        <>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontWeight:700, fontSize:13, color: stockBas ? '#d97706' : '#0f172a' }}>{m.stock_actuel}</span>
                            <span style={{ fontSize:11, color:'#94a3b8' }}>{m.unite}</span>
                            {stockBas && <AlertTriangle size={13} color="#d97706" />}
                          </div>
                          {stockPct !== null && (
                            <div className="stock-bar">
                              <div style={{ height:'100%', width:`${stockPct}%`, background: stockBas ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#3b82f6,#1e40af)', borderRadius:3 }} />
                            </div>
                          )}
                        </>
                      ) : <span style={{ color:'#cbd5e1', fontSize:12 }}>—</span>}
                    </td>
                    <td style={{ padding:'14px 16px', fontSize:12, color:'#64748b' }}>
                      {m.stock_minimum !== undefined ? `${m.stock_minimum} ${m.unite}` : '—'}
                    </td>
                    <td style={{ padding:'14px 16px', fontSize:11, color:'#94a3b8' }}>
                      {m.derniere_maj_taux ? new Date(m.derniere_maj_taux).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <button
                        className="btn-del"
                        onClick={() => handleDelete(m.id)}
                        title="Supprimer"
                      >
                        <Trash2 size={15} color="#ef4444" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {matieres.length > 0 && (
          <div style={{ padding:'11px 16px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:'#94a3b8' }}>{matieres.length} matière{matieres.length>1?'s':''} première{matieres.length>1?'s':''}</span>
            {taux && <span style={{ fontSize:11, color:'#94a3b8' }}>Taux appliqué : 1 EUR = {taux} DA</span>}
          </div>
        )}
      </div>
    </div>
  );
}