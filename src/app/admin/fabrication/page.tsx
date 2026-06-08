"use client";

import { useEffect, useState } from "react";
import { Factory, RefreshCw, Package, AlertTriangle, CheckCircle, Layers, Clock, ShoppingCart } from "lucide-react";

interface Matiere {
  matiere_id: number; titre: string; unite: string;
  quantite_necessaire: number; quantite_requise: number;
  stock_actuel: number; stock_suffisant: boolean;
}
interface OrdreFab {
  id: number; produit_nom: string; produit_id: number;
  commande_ref: number; quantite: number; statut: string;
  date_debut: string | null; date_fin: string | null;
  created_at: string; matieres: Matiere[];
}

const STATUT_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  planifie: { label: 'Planifié',  color: '#f59e0b', bg: 'rgba(245,158,11,.1)',  border: 'rgba(245,158,11,.25)' },
  en_cours: { label: 'En cours',  color: '#a855f7', bg: 'rgba(168,85,247,.1)',  border: 'rgba(168,85,247,.25)' },
  termine:  { label: 'Terminé',   color: '#10b981', bg: 'rgba(16,185,129,.1)',  border: 'rgba(16,185,129,.25)' },
};

const DS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--border);color:var(--text-secondary);border-radius:9px;padding:8px 14px;font-weight:500;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:var(--violet);color:var(--violet-light)}
.badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600}
.readonly-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);color:#f59e0b;border-radius:8px;padding:5px 11px;font-size:11.5px;font-weight:600;font-family:'Outfit',sans-serif}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function FabricationPage() {
  const [ordres, setOrdres]   = useState<OrdreFab[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats]     = useState({ planifie: 0, en_cours: 0, termine: 0 });

  async function fetchOrdres() {
    setLoading(true);
    try {
      const res  = await fetch('/api/fabrication');
      const data = await res.json();
      const arr  = Array.isArray(data) ? data : [];
      setOrdres(arr);
      setStats({
        planifie: arr.filter((o: OrdreFab) => o.statut === 'planifie').length,
        en_cours: arr.filter((o: OrdreFab) => o.statut === 'en_cours').length,
        termine:  arr.filter((o: OrdreFab) => o.statut === 'termine').length,
      });
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { fetchOrdres(); }, []);

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", padding:'28px 32px', maxWidth:1300 }}>
      <style>{DS}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:10.5, fontWeight:700, color:'#ec4899', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Production</div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', margin:0, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, background:'linear-gradient(135deg,#ec4899,#7c3aed)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px rgba(236,72,153,.4)' }}>
              <Factory size={18} color="white" />
            </div>
            Ordres de Fabrication
          </h1>
          <p style={{ fontSize:12.5, color:'var(--text-muted)', marginTop:3 }}>Suivi en lecture seule — la gestion est assurée par le responsable de production</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={fetchOrdres} className="btn-ghost">
            <RefreshCw size={13} style={{ animation:loading?'spin 1s linear infinite':'none' }} /> Actualiser
          </button>
        </div>
      </div>

      {/* ✅ Bandeau info — explique que les actions sont côté responsable prod */}
      <div style={{ background:'rgba(245,158,11,.07)', border:'1px solid rgba(245,158,11,.22)', borderRadius:12, padding:'12px 18px', marginBottom:24, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:16 }}>ℹ️</span>
        <div style={{ fontSize:13, color:'var(--text-secondary)' }}>
          <strong style={{ color:'var(--text-primary)' }}>Accès superviseur uniquement.</strong> Le lancement, le suivi et la validation des ordres de fabrication sont gérés par le <strong style={{ color:'#f59e0b' }}>responsable de production</strong>.
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Total ordres', value:ordres.length,  color:'#a855f7', bg:'rgba(168,85,247,.1)', border:'rgba(168,85,247,.2)' },
          { label:'Planifiés',    value:stats.planifie, color:'#f59e0b', bg:'rgba(245,158,11,.1)', border:'rgba(245,158,11,.2)' },
          { label:'En cours',     value:stats.en_cours, color:'#ec4899', bg:'rgba(236,72,153,.1)', border:'rgba(236,72,153,.2)' },
          { label:'Terminés',     value:stats.termine,  color:'#10b981', bg:'rgba(16,185,129,.1)', border:'rgba(16,185,129,.2)' },
        ].map((s,i) => (
          <div key={i} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:14, padding:'16px 18px' }}>
            <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:'var(--text-secondary)', fontWeight:500, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Liste ordres — lecture seule */}
      {loading ? (
        <div style={{ textAlign:'center', padding:56, color:'var(--text-muted)' }}>Chargement...</div>
      ) : ordres.length === 0 ? (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:56, textAlign:'center' }}>
          <Factory size={36} style={{ display:'block', margin:'0 auto 12px', opacity:.2, color:'var(--text-muted)' }} />
          <p style={{ color:'var(--text-muted)', fontSize:14, margin:0 }}>Aucun ordre de fabrication en cours</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {ordres.map(o => {
            const cfg = STATUT_CFG[o.statut] || STATUT_CFG.planifie;
            const stockMissing = (o.matieres||[]).filter(m => !m.stock_suffisant);
            return (
              <div key={o.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
                <div style={{ height:3, background:cfg.color }} />
                <div style={{ padding:'18px 22px' }}>

                  {/* En-tête */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:38, height:38, background:'rgba(236,72,153,.1)', border:'1px solid rgba(236,72,153,.2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Package size={17} color="#ec4899" />
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15, color:'var(--text-primary)' }}>{o.produit_nom}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                          <ShoppingCart size={11}/> Commande #{o.commande_ref}
                          {o.date_debut && (
                            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                              <Clock size={11}/> Démarré le {new Date(o.date_debut).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                          {o.date_fin && (
                            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                              <CheckCircle size={11} color="#10b981"/> Terminé le {new Date(o.date_fin).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="badge" style={{ background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>{cfg.label}</span>
                      {stockMissing.length > 0 && (
                        <span className="badge" style={{ background:'rgba(239,68,68,.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,.25)' }}>
                          <AlertTriangle size={10}/> {stockMissing.length} matière(s) manquante(s)
                        </span>
                      )}
                    </div>

                    {/* ✅ Quantité uniquement — plus de boutons Lancer / Terminer */}
                    <div style={{ background:'rgba(124,58,237,.1)', border:'1px solid rgba(124,58,237,.2)', borderRadius:10, padding:'8px 16px', textAlign:'center' }}>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>À produire</div>
                      <div style={{ fontSize:20, fontWeight:800, color:'var(--violet-light)' }}>{o.quantite} <span style={{ fontSize:12, fontWeight:400 }}>u</span></div>
                    </div>
                  </div>

                  {/* Matières — lecture seule */}
                  {(o.matieres||[]).length > 0 ? (
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
                        <Layers size={11}/> Matières nécessaires
                      </div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {o.matieres.map((m, i) => (
                          <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:6, background:m.stock_suffisant?'rgba(16,185,129,.08)':'rgba(239,68,68,.08)', border:`1px solid ${m.stock_suffisant?'rgba(16,185,129,.2)':'rgba(239,68,68,.2)'}`, borderRadius:9, padding:'6px 12px', fontSize:12 }}>
                            {m.stock_suffisant ? <CheckCircle size={12} color="#10b981"/> : <AlertTriangle size={12} color="#ef4444"/>}
                            <span style={{ fontWeight:600, color:'var(--text-primary)' }}>{m.titre}</span>
                            <span style={{ color:'var(--text-muted)' }}>Requis: {Number(m.quantite_requise).toFixed(1)} {m.unite}</span>
                            <span style={{ color:m.stock_suffisant?'#10b981':'#ef4444', fontWeight:600 }}>Stock: {Number(m.stock_actuel).toFixed(1)} {m.unite}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize:12, color:'#f59e0b', fontStyle:'italic', display:'flex', alignItems:'center', gap:6 }}>
                      <AlertTriangle size={13} color="#f59e0b"/> Nomenclature non définie pour ce produit
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}