'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ShoppingBag, CheckCircle, Truck, Clock, RefreshCw, X, Package, LogOut } from 'lucide-react';

interface DemandeAppro {
  id: number; matiere_id: number; matiere_titre: string; matiere_unite: string;
  quantite: number; prix_unitaire: number | null; statut: string;
  date_prevue: string | null; notes: string | null; created_at: string; fournisseur_nom: string;
}

const STATUT_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  en_attente: { label:'En attente', color:'#f59e0b', bg:'rgba(245,158,11,.1)',  border:'rgba(245,158,11,.25)' },
  confirmee:  { label:'Confirmée',  color:'#a855f7', bg:'rgba(168,85,247,.1)',  border:'rgba(168,85,247,.25)' },
  expediee:   { label:'Expédiée',   color:'#06b6d4', bg:'rgba(6,182,212,.1)',   border:'rgba(6,182,212,.25)'  },
  recue:      { label:'Reçue',      color:'#10b981', bg:'rgba(16,185,129,.1)',  border:'rgba(16,185,129,.25)' },
  annulee:    { label:'Annulée',    color:'#ef4444', bg:'rgba(239,68,68,.1)',   border:'rgba(239,68,68,.25)'  },
};

const DS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--bg-base)}
.btn-primary{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:9px;padding:9px 18px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .2s}
.btn-primary:hover{transform:translateY(-1px);filter:brightness(1.1)}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--border);color:var(--text-secondary);border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:#10b981;color:#10b981;background:rgba(16,185,129,.08)}
.card{background:var(--bg-card);border-radius:14px;border:1px solid var(--border)}
.tab-btn{flex:1;padding:12px;font-size:13px;font-weight:500;border:none;background:transparent;cursor:pointer;font-family:'Outfit',sans-serif;color:var(--text-secondary);transition:all .15s;border-bottom:2px solid transparent}
.tab-btn.active{color:#10b981;border-bottom-color:#10b981;background:rgba(16,185,129,.08)}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function FournisseurPage() {
  const { data: session } = useSession();
  const [demandes, setDemandes] = useState<DemandeAppro[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<'actives' | 'historique'>('actives');

  async function fetchDemandes() {
    setLoading(true);
    try {
      const userId = (session?.user as any)?.id;
      if (!userId) return;
      const res = await fetch(`/api/fournisseurs/demande?utilisateur_id=${userId}`, { cache: 'no-store' });
      const data   = await res.json();
      setDemandes(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }

  useEffect(() => {
  if (session?.user) {
    setTimeout(() => fetchDemandes(), 500);
  }
}, [session]);

useEffect(() => {
  const interval = setInterval(() => {
    if (session?.user) fetchDemandes();
  }, 30000);
  return () => clearInterval(interval);
}, [session]);

  async function confirmerDemande(id: number) {
    await fetch(`/api/fournisseurs/demande/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({statut:'confirmee'}) });
    fetchDemandes();
  }

  async function expedierDemande(id: number) {
    await fetch(`/api/fournisseurs/demande/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({statut:'expediee'}) });
    fetchDemandes();
  }

  const actives    = demandes.filter(d => !['recue','annulee'].includes(d.statut));
  const historique = demandes.filter(d =>  ['recue','annulee'].includes(d.statut));
  const stats = {
    en_attente: demandes.filter(d => d.statut==='en_attente').length,
    confirmees: demandes.filter(d => d.statut==='confirmee').length,
    expediees:  demandes.filter(d => d.statut==='expediee').length,
    recues:     demandes.filter(d => d.statut==='recue').length,
  };

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", minHeight:'100vh', background:'var(--bg-base)' }}>
      <style>{DS}</style>
      <div style={{ height:2, background:'linear-gradient(90deg,#10b981,#06b6d4,transparent)' }} />
      <nav style={{ background:'var(--bg-base)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:58 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, background:'linear-gradient(135deg,#10b981,#06b6d4)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px rgba(16,185,129,.4)' }}>
              <ShoppingBag size={17} color="white" />
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:14, color:'var(--text-primary)' }}>Espace Fournisseur</div>
              <div style={{ fontSize:9, color:'#10b981', textTransform:'uppercase', letterSpacing:'0.06em' }}>{session?.user?.name}</div>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl:'/' })} style={{ background:'rgba(255,255,255,.06)', border:'1px solid var(--border)', color:'var(--text-secondary)', borderRadius:8, padding:'6px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:12, fontFamily:"'Outfit',sans-serif" }}>
            <LogOut size={13}/> Quitter
          </button>
        </div>
      </nav>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 24px' }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:10.5, fontWeight:700, color:'#10b981', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Tableau de bord</div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', margin:0 }}>Demandes d'approvisionnement</h1>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
          {[
            { label:'En attente', value:stats.en_attente, color:'#f59e0b', bg:'rgba(245,158,11,.1)',  border:'rgba(245,158,11,.2)'  },
            { label:'Confirmées', value:stats.confirmees, color:'#a855f7', bg:'rgba(168,85,247,.1)', border:'rgba(168,85,247,.2)' },
            { label:'Expédiées',  value:stats.expediees,  color:'#06b6d4', bg:'rgba(6,182,212,.1)',  border:'rgba(6,182,212,.2)'  },
            { label:'Reçues',     value:stats.recues,     color:'#10b981', bg:'rgba(16,185,129,.1)', border:'rgba(16,185,129,.2)' },
          ].map((s,i) => (
            <div key={i} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:14, padding:'16px 18px' }}>
              <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:12, color:'var(--text-secondary)', fontWeight:500, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)' }}>
            <button onClick={() => setActiveTab('actives')}    className={`tab-btn${activeTab==='actives'?' active':''}`}>Actives ({actives.length})</button>
            <button onClick={() => setActiveTab('historique')} className={`tab-btn${activeTab==='historique'?' active':''}`}>Historique ({historique.length})</button>
          </div>
          <div style={{ padding:24 }}>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
              <button onClick={fetchDemandes} className="btn-ghost">
                <RefreshCw size={13} style={{ animation:loading?'spin 1s linear infinite':'none' }}/> Actualiser
              </button>
            </div>
            {loading ? (
              <div style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>Chargement...</div>
            ) : (activeTab==='actives'?actives:historique).length === 0 ? (
              <div style={{ textAlign:'center', padding:56 }}>
                <ShoppingBag size={36} style={{ display:'block', margin:'0 auto 10px', opacity:.2, color:'var(--text-muted)' }}/>
                <p style={{ color:'var(--text-muted)', fontSize:13 }}>Aucune demande</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {(activeTab==='actives'?actives:historique).map(d => {
                  const cfg = STATUT_CFG[d.statut]||STATUT_CFG.en_attente;
                  return (
                    <div key={d.id} style={{ background:'var(--bg-surface)', borderRadius:12, border:'1px solid var(--border)', padding:'18px 20px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:34, height:34, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Package size={16} color="#10b981"/>
                          </div>
                          <div>
                            <div style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)' }}>{d.matiere_titre}</div>
                            <div style={{ fontSize:12, color:'var(--text-secondary)' }}>Quantité : <strong>{d.quantite} {d.matiere_unite}</strong></div>
                          </div>
                        </div>
                        <span style={{ display:'inline-flex', padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:600, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`, flexShrink:0 }}>{cfg.label}</span>
                      </div>
                      {d.date_prevue && (
                        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>
                          <Clock size={12}/> Livraison prévue : {new Date(d.date_prevue).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', alignItems:'center' }}>
                        {d.statut==='en_attente' && (
                          <button onClick={() => confirmerDemande(d.id)} style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(168,85,247,.1)', border:'1px solid rgba(168,85,247,.25)', color:'#a855f7', borderRadius:8, padding:'7px 14px', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                            <CheckCircle size={13}/> Confirmer
                          </button>
                        )}
                        {d.statut==='confirmee' && (
                          <button onClick={() => expedierDemande(d.id)} style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(6,182,212,.1)', border:'1px solid rgba(6,182,212,.25)', color:'#06b6d4', borderRadius:8, padding:'7px 14px', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                            <Truck size={13}/> Marquer expédié
                          </button>
                        )}
                        {/* ✅ Expédiée : le fournisseur ne confirme plus la réception — c'est le responsable prod */}
                        {d.statut==='expediee' && (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, color:'#06b6d4', fontWeight:600, padding:'6px 12px', background:'rgba(6,182,212,.08)', borderRadius:8, border:'1px solid rgba(6,182,212,.2)' }}>
                            <Truck size={13}/> Expédiée — réception en attente
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}