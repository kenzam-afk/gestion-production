'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Package, ShoppingCart, Clock, CheckCircle, Truck,
  Factory, X, LogOut, RefreshCw,
  MapPin, Plus, Minus, Trash2, ArrowRight, AlertCircle, XCircle,
} from 'lucide-react';

interface Commande {
  id: number; statut: string; total: number; created_at: string;
  adresse_livraison: string; livreur_nom: string | null;
  livreur_email: string | null; livraison_statut: string | null;
  date_livraison_reelle: string | null;
  numero_bon_commande: string | null; numero_bon_livraison: string | null;
  lignes: { produit_nom: string; produit_description: string; unite: string; quantite: number; prix_unitaire: number; sous_total: number; }[];
}

interface Produit {
  id: number; nom: string; description: string;
  prix_vente: number; stock_disponible: number; stock_minimum: number; unite: string;
}

type PanierItem = { produit: Produit; quantite: number };

const STATUT_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  en_attente:     { label: 'En attente',     color: '#f59e0b', bg: 'rgba(245,158,11,.1)',  border: 'rgba(245,158,11,.25)',  icon: Clock },
  confirmee:      { label: 'Confirmée',      color: '#a855f7', bg: 'rgba(168,85,247,.1)',  border: 'rgba(168,85,247,.25)',  icon: CheckCircle },
  en_fabrication: { label: 'En fabrication', color: '#ec4899', bg: 'rgba(236,72,153,.1)',  border: 'rgba(236,72,153,.25)',  icon: Factory },
  pret_livraison: { label: 'Prêt livraison', color: '#06b6d4', bg: 'rgba(6,182,212,.1)',   border: 'rgba(6,182,212,.25)',   icon: Package },
  livree:         { label: 'Livrée',         color: '#10b981', bg: 'rgba(16,185,129,.1)',  border: 'rgba(16,185,129,.25)',  icon: CheckCircle },
  annulee:        { label: 'Annulée',        color: '#ef4444', bg: 'rgba(239,68,68,.1)',   border: 'rgba(239,68,68,.25)',   icon: X },
};

const ETAPES = ['en_attente', 'confirmee', 'en_fabrication', 'pret_livraison', 'livree'];
const ETAPES_LABELS: Record<string, string> = {
  en_attente: 'Reçue', confirmee: 'Confirmée',
  en_fabrication: 'Fabrication', pret_livraison: 'Prêt', livree: 'Livrée',
};

// ✅ Seuls ces statuts permettent au client d'annuler
const PEUT_ANNULER = ['en_attente', 'confirmee'];

const DS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--bg-base)}
.btn-primary{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:white;border:none;border-radius:9px;padding:9px 18px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .2s;box-shadow:0 2px 12px rgba(124,58,237,.35)}
.btn-primary:hover{transform:translateY(-1px);filter:brightness(1.1)}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--border);color:var(--text-secondary);border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:var(--violet);color:var(--violet-light);background:rgba(124,58,237,.08)}
.btn-danger{display:inline-flex;align-items:center;gap:5px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);color:#ef4444;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .15s}
.btn-danger:hover{background:rgba(239,68,68,.18)}
.inp{width:100%;background:var(--bg-surface) !important;border:1px solid var(--border) !important;border-radius:9px;padding:10px 13px;font-family:'Outfit',sans-serif;font-size:13.5px;color:var(--text-primary) !important;outline:none;transition:all .15s}
.inp:focus{border-color:var(--violet) !important;box-shadow:0 0 0 3px rgba(124,58,237,.15) !important}
.card{background:var(--bg-card);border-radius:16px;border:1px solid var(--border)}
.overlay{position:fixed;inset:0;background:rgba(4,4,20,.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;animation:fadeIn .2s}
.modal{background:var(--bg-card);border:1px solid var(--border);border-radius:18px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;padding:28px;box-shadow:0 32px 80px rgba(0,0,0,.5);animation:slideUp .2s}
.modal-sm{max-width:420px}
.tab-btn{flex:1;padding:11px;font-size:13px;font-weight:500;border:none;background:transparent;cursor:pointer;font-family:'Outfit',sans-serif;color:var(--text-secondary);transition:all .15s;border-bottom:2px solid transparent}
.tab-btn.active{color:var(--violet-light);border-bottom-color:var(--violet);background:rgba(124,58,237,.08)}
.product-card{background:var(--bg-card);border-radius:14px;border:1px solid var(--border);overflow:hidden;transition:all .2s}
.product-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(124,58,237,.15);border-color:rgba(124,58,237,.3)}
.qty-btn{width:26px;height:26px;border-radius:7px;border:1px solid var(--border);background:var(--bg-surface);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-secondary);transition:all .15s}
.qty-btn:hover{border-color:var(--violet);color:var(--violet-light)}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function ClientPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [commandes, setCommandes]   = useState<Commande[]>([]);
  const [produits, setProduits]     = useState<Produit[]>([]);
  const [clientId, setClientId]     = useState<number | null>(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<'commandes' | 'catalogue'>('commandes');
  const [panier, setPanier]         = useState<PanierItem[]>([]);
  const [showPanier, setShowPanier] = useState(false);
  const [commandeOk, setCommandeOk] = useState<number | null>(null);
  const [cmdLoading, setCmdLoading] = useState(false);
  const [cmdError, setCmdError]     = useState('');

  // ✅ Modal confirmation annulation
  const [modalAnnulation, setModalAnnulation] = useState<Commande | null>(null);
  const [annulLoading, setAnnulLoading]       = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'client') router.push('/');
      else { fetchCommandes(); fetchProduits(); }
    }
  }, [status]);

  async function fetchCommandes() {
    setLoading(true);
    try {
      const userId = (session?.user as any)?.id;
      const res    = await fetch(`/api/client/commandes?utilisateur_id=${userId}`);
      const data   = await res.json();
      if (data.client_id) setClientId(data.client_id);
      setCommandes(data.commandes || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function fetchProduits() {
    const res  = await fetch('/api/produits');
    const data = await res.json();
    if (Array.isArray(data)) setProduits(data);
  }

  // ✅ Annuler commande
  async function annulerCommande() {
    if (!modalAnnulation) return;
    setAnnulLoading(true);
    try {
      await fetch(`/api/commandes/${modalAnnulation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'annulee' }),
      });
      setModalAnnulation(null);
      fetchCommandes();
    } finally { setAnnulLoading(false); }
  }

  function ajouterAuPanier(produit: Produit) {
    setPanier(prev => {
      const e = prev.find(p => p.produit.id === produit.id);
      if (e) return prev.map(p => p.produit.id === produit.id ? { ...p, quantite: p.quantite + 1 } : p);
      return [...prev, { produit, quantite: 1 }];
    });
  }
  const setQte     = (id: number, q: number) => { if (q < 1) return; setPanier(prev => prev.map(p => p.produit.id === id ? { ...p, quantite: q } : p)); };
  const supprimer  = (id: number) => setPanier(prev => prev.filter(p => p.produit.id !== id));
  const total      = panier.reduce((a, p) => a + Number(p.produit.prix_vente) * p.quantite, 0);
  const totalItems = panier.reduce((a, p) => a + p.quantite, 0);

  async function passerCommande() {
    if (panier.length === 0) return;
    setCmdLoading(true); setCmdError('');
    try {
      let cid = clientId;
      if (!cid) {
        const userId = (session?.user as any)?.id;
        const res    = await fetch(`/api/client/commandes?utilisateur_id=${userId}`);
        const data   = await res.json();
        cid = data.client_id;
        if (cid) setClientId(cid);
      }
      if (!cid) { setCmdError('Impossible de trouver votre profil client.'); setCmdLoading(false); return; }
      const res = await fetch('/api/commandes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: cid,
          produits: panier.map(p => ({ produit_id: p.produit.id, quantite: p.quantite, prix_unitaire: p.produit.prix_vente })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCmdError(data.error || 'Erreur lors de la commande'); return; }
      setPanier([]); setShowPanier(false); setCommandeOk(data.id); fetchCommandes();
    } catch (e: any) { setCmdError('Erreur réseau : ' + e.message); }
    finally { setCmdLoading(false); }
  }

  const enCours   = commandes.filter(c => !['livree', 'annulee'].includes(c.statut));
  const terminees = commandes.filter(c =>  ['livree', 'annulee'].includes(c.statut));

  if (status === 'loading') return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div style={{ width:36, height:36, border:'3px solid #7c3aed', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", minHeight:'100vh', background:'var(--bg-base)' }}>
      <style>{DS}</style>

      {/* Navbar */}
      <div style={{ height:2, background:'linear-gradient(90deg,#7c3aed,#ec4899,#06b6d4,transparent)' }} />
      <nav style={{ background:'var(--bg-base)', position:'sticky', top:0, zIndex:100, borderBottom:'1px solid var(--border)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px', height:58, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, background:'linear-gradient(135deg,#7c3aed,#ec4899)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px rgba(124,58,237,.4)' }}>
              <Package size={17} color="white" />
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:14, color:'var(--text-primary)' }}>Gestion Pro</div>
              <div style={{ fontSize:9, color:'var(--violet)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Espace Client</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={() => setShowPanier(true)} style={{ position:'relative', display:'flex', alignItems:'center', gap:6, background:'rgba(124,58,237,.1)', border:'1px solid rgba(124,58,237,.25)', color:'var(--violet-light)', borderRadius:9, padding:'7px 14px', cursor:'pointer', fontSize:13, fontFamily:"'Outfit',sans-serif" }}>
              <ShoppingCart size={15} /><span>Panier</span>
              {totalItems > 0 && <span style={{ background:'#ef4444', color:'white', fontSize:10, fontWeight:700, width:18, height:18, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginLeft:2 }}>{totalItems}</span>}
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:9, padding:'6px 12px' }}>
              <div style={{ width:26, height:26, borderRadius:7, background:'linear-gradient(135deg,#7c3aed,#ec4899)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'white' }}>
                {session?.user?.name?.[0]?.toUpperCase() || 'C'}
              </div>
              <span style={{ fontSize:12, color:'var(--text-primary)', fontWeight:500 }}>{session?.user?.name}</span>
            </div>
            <button onClick={() => signOut({ callbackUrl:'/' })} style={{ display:'inline-flex', alignItems:'center', gap:5, background:'transparent', border:'1px solid var(--border)', color:'var(--text-secondary)', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, fontFamily:"'Outfit',sans-serif" }}>
              <LogOut size={13} /> Quitter
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 24px' }}>

        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:10.5, fontWeight:700, color:'var(--violet)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Bienvenue</div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', margin:0, letterSpacing:'-0.02em' }}>{session?.user?.name} 👋</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>{commandes.length} commande{commandes.length > 1 ? 's' : ''} au total</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
          {[
            { label:'Total commandes', value:commandes.length, color:'#a855f7', bg:'rgba(168,85,247,.1)', border:'rgba(168,85,247,.2)' },
            { label:'En cours',        value:enCours.length,   color:'#ec4899', bg:'rgba(236,72,153,.1)', border:'rgba(236,72,153,.2)' },
            { label:'Livrées',         value:terminees.filter(c => c.statut === 'livree').length, color:'#10b981', bg:'rgba(16,185,129,.1)', border:'rgba(16,185,129,.2)' },
            { label:'Total dépensé',   value:`${commandes.reduce((a,c) => a + Number(c.total), 0).toLocaleString('fr-DZ')} DA`, color:'#06b6d4', bg:'rgba(6,182,212,.1)', border:'rgba(6,182,212,.2)' },
          ].map((s,i) => (
            <div key={i} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:14, padding:'16px 18px' }}>
              <div style={{ fontSize: i===3 ? 14 : 24, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:11.5, color:'var(--text-secondary)', fontWeight:500, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {commandeOk && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <CheckCircle size={18} color="#10b981" />
              <div>
                <span style={{ fontWeight:600, fontSize:13, color:'#10b981' }}>Commande #{commandeOk} envoyée !</span>
                <p style={{ fontSize:12, color:'var(--text-muted)', margin:'2px 0 0' }}>Votre commande est en cours de traitement.</p>
              </div>
            </div>
            <button onClick={() => setCommandeOk(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={16} /></button>
          </div>
        )}

        <div className="card">
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)' }}>
            <button onClick={() => setActiveTab('commandes')} className={`tab-btn${activeTab==='commandes'?' active':''}`}>Mes commandes ({commandes.length})</button>
            <button onClick={() => setActiveTab('catalogue')} className={`tab-btn${activeTab==='catalogue'?' active':''}`}>Catalogue & Commander</button>
          </div>

          <div style={{ padding:24 }}>

            {activeTab === 'commandes' && (
              <div>
                <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
                  <button onClick={fetchCommandes} className="btn-ghost">
                    <RefreshCw size={13} style={{ animation:loading?'spin 1s linear infinite':'none' }} /> Actualiser
                  </button>
                </div>

                {loading ? (
                  <div style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>Chargement...</div>
                ) : commandes.length === 0 ? (
                  <div style={{ textAlign:'center', padding:56 }}>
                    <ShoppingCart size={40} style={{ display:'block', margin:'0 auto 12px', opacity:.2, color:'var(--text-muted)' }} />
                    <p style={{ color:'var(--text-muted)', fontSize:14, margin:0 }}>Aucune commande pour le moment</p>
                    <button onClick={() => setActiveTab('catalogue')} className="btn-primary" style={{ marginTop:16 }}>
                      Commander maintenant <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {commandes.map(cmd => {
                      const cfg         = STATUT_CFG[cmd.statut] || STATUT_CFG.en_attente;
                      const Icon        = cfg.icon;
                      const etapeIdx    = ETAPES.indexOf(cmd.statut);
                      const peutAnnuler = PEUT_ANNULER.includes(cmd.statut);

                      return (
                        <div key={cmd.id} style={{ background:'var(--bg-surface)', borderRadius:14, border:`1px solid ${cmd.statut==='annulee'?'rgba(239,68,68,.2)':'var(--border)'}`, overflow:'hidden' }}>
                          <div style={{ height:3, background:cfg.color }} />
                          <div style={{ padding:'16px 20px' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                              <div>
                                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                                  <span style={{ fontWeight:700, fontSize:15, color:'var(--text-primary)' }}>Commande #{cmd.id}</span>
                                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>
                                    <Icon size={11} /> {cfg.label}
                                  </span>
                                </div>
                                <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                                  {new Date(cmd.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })}
                                </div>
                              </div>
                              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                                <div style={{ fontSize:18, fontWeight:800, color:'var(--violet-light)' }}>{Number(cmd.total).toLocaleString('fr-DZ')} DA</div>
                                {/* ✅ Bouton annuler — uniquement si en_attente ou confirmee */}
                                {peutAnnuler && (
                                  <button onClick={() => setModalAnnulation(cmd)} className="btn-danger">
                                    <XCircle size={12} /> Annuler
                                  </button>
                                )}
                              </div>
                            </div>

                            {cmd.lignes && cmd.lignes.length > 0 && (
                              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
                                {cmd.lignes.map((l,i) => (
                                  <div key={i} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'5px 10px', fontSize:12 }}>
                                    <Package size={12} color="var(--violet)" />
                                    <span style={{ fontWeight:500, color:'var(--text-primary)' }}>{l.produit_nom}</span>
                                    <span style={{ color:'var(--text-muted)' }}>×{l.quantite}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {cmd.statut !== 'annulee' && (
                              <div style={{ marginBottom:12 }}>
                                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                                  {ETAPES.map((etape,i) => {
                                    const done = i <= etapeIdx;
                                    return (
                                      <div key={etape} style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1 }}>
                                        <div style={{ width:24, height:24, borderRadius:'50%', background:done?'var(--violet)':'var(--border)', color:done?'white':'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, marginBottom:4 }}>
                                          {done?'✓':i+1}
                                        </div>
                                        <span style={{ fontSize:9, color:done?'var(--violet-light)':'var(--text-muted)', fontWeight:done?600:400, textAlign:'center' }}>{ETAPES_LABELS[etape]}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div style={{ height:4, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
                                  <div style={{ height:'100%', borderRadius:2, background:'linear-gradient(90deg,var(--violet),var(--rose))', width:`${Math.max(0,(etapeIdx/(ETAPES.length-1))*100)}%`, transition:'width .5s' }} />
                                </div>
                              </div>
                            )}

                            <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:12, color:'var(--text-secondary)' }}>
                              {cmd.livreur_nom && <div style={{ display:'flex', alignItems:'center', gap:5 }}><Truck size={12} color="var(--cyan)" /><span>Livreur : <strong style={{ color:'var(--text-primary)' }}>{cmd.livreur_nom}</strong></span></div>}
                              {cmd.adresse_livraison && <div style={{ display:'flex', alignItems:'center', gap:5 }}><MapPin size={12} color="var(--text-muted)" /><span style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cmd.adresse_livraison}</span></div>}
                              {cmd.numero_bon_commande && <span style={{ background:'rgba(124,58,237,.1)', color:'var(--violet-light)', padding:'2px 7px', borderRadius:6, fontSize:11, fontWeight:600 }}>{cmd.numero_bon_commande}</span>}
                            </div>

                            {cmd.statut === 'annulee' && (
                              <div style={{ marginTop:10, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#ef4444', fontWeight:500 }}>
                                Cette commande a été annulée.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'catalogue' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <div>
                    <div style={{ fontSize:10.5, fontWeight:700, color:'var(--violet)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>Catalogue</div>
                    <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)' }}>{produits.length} produits disponibles</div>
                  </div>
                  {totalItems > 0 && (
                    <button onClick={() => setShowPanier(true)} className="btn-primary">
                      <ShoppingCart size={14} /> Voir panier ({totalItems})
                    </button>
                  )}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
                  {produits.map(p => {
                    const inPanier = panier.find(x => x.produit.id === p.id);
                    const rupture  = p.stock_disponible === 0;
                    const stockBas = p.stock_disponible <= p.stock_minimum;
                    return (
                      <div key={p.id} className="product-card">
                        <div style={{ height:3, background:rupture?'#ef4444':stockBas?'#f59e0b':'linear-gradient(90deg,#7c3aed,#ec4899)' }} />
                        <div style={{ padding:18 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                            <div style={{ width:40, height:40, background:'rgba(124,58,237,.1)', border:'1px solid rgba(124,58,237,.2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <Package size={18} color="var(--violet)" />
                            </div>
                            <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:20, fontSize:10.5, fontWeight:600, background:rupture?'rgba(239,68,68,.1)':stockBas?'rgba(245,158,11,.1)':'rgba(16,185,129,.1)', color:rupture?'#ef4444':stockBas?'#f59e0b':'#10b981', border:`1px solid ${rupture?'rgba(239,68,68,.25)':stockBas?'rgba(245,158,11,.25)':'rgba(16,185,129,.25)'}` }}>
                              {rupture?'Rupture':stockBas?'Stock bas':'Disponible'}
                            </span>
                          </div>
                          <div style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)', marginBottom:4 }}>{p.nom}</div>
                          <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:14, lineHeight:1.5 }}>{p.description || 'Produit de qualité'}</div>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <div>
                              <div style={{ fontSize:18, fontWeight:800, color:'var(--violet-light)' }}>{Number(p.prix_vente).toLocaleString('fr-DZ')} DA</div>
                              {p.stock_disponible > 0 && <div style={{ fontSize:10.5, color:'var(--text-muted)', marginTop:1 }}>{p.stock_disponible} dispo.</div>}
                            </div>
                            {!rupture && (
                              inPanier ? (
                                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                  <button className="qty-btn" onClick={() => setQte(p.id, inPanier.quantite-1)}><Minus size={11} /></button>
                                  <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', minWidth:20, textAlign:'center' }}>{inPanier.quantite}</span>
                                  <button className="qty-btn" onClick={() => setQte(p.id, inPanier.quantite+1)}><Plus size={11} /></button>
                                </div>
                              ) : (
                                <button onClick={() => ajouterAuPanier(p)} className="btn-primary" style={{ padding:'7px 14px', fontSize:12.5 }}>
                                  <Plus size={13} /> Ajouter
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Modal confirmation annulation */}
      {modalAnnulation && (
        <div className="overlay" onClick={() => setModalAnnulation(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign:'center', padding:'8px 0 4px' }}>
              <div style={{ width:56, height:56, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <XCircle size={26} color="#ef4444" />
              </div>
              <h3 style={{ fontWeight:800, fontSize:18, color:'var(--text-primary)', marginBottom:8 }}>Annuler la commande ?</h3>
              <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:6 }}>
                Commande <strong style={{ color:'var(--text-primary)' }}>#{modalAnnulation.id}</strong>
              </p>
              <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:20 }}>
                {modalAnnulation.lignes?.map(l => `${l.produit_nom} ×${l.quantite}`).join(', ')}
              </p>
              <div style={{ background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.15)', borderRadius:10, padding:'10px 14px', marginBottom:20, fontSize:12, color:'#ef4444' }}>
                ⚠ Cette action est irréversible. Le stock sera remis à disposition.
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setModalAnnulation(null)} className="btn-ghost" style={{ flex:1, justifyContent:'center' }}>
                  Garder
                </button>
                <button
                  onClick={annulerCommande}
                  disabled={annulLoading}
                  style={{ flex:2, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.3)', color:'#ef4444', borderRadius:9, padding:'10px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif", opacity:annulLoading?.6:1 }}>
                  <XCircle size={14} /> {annulLoading ? 'Annulation...' : "Confirmer l'annulation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Panier */}
      {showPanier && (
        <div className="overlay" onClick={() => setShowPanier(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontWeight:700, fontSize:19, color:'var(--text-primary)', margin:0 }}>
                Mon panier {totalItems > 0 && <span style={{ color:'var(--violet-light)' }}>({totalItems})</span>}
              </h2>
              <button onClick={() => setShowPanier(false)} style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,.06)', border:'1px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}><X size={14} /></button>
            </div>
            {panier.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)' }}>
                <ShoppingCart size={36} style={{ display:'block', margin:'0 auto 10px', opacity:.3 }} />
                <p style={{ fontSize:13 }}>Panier vide</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom:16 }}>
                  {panier.map(p => (
                    <div key={p.produit.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ width:32, height:32, background:'rgba(124,58,237,.1)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Package size={14} color="var(--violet)" />
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:13, color:'var(--text-primary)' }}>{p.produit.nom}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{Number(p.produit.prix_vente).toLocaleString('fr-DZ')} DA / u</div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <button className="qty-btn" onClick={() => setQte(p.produit.id, p.quantite-1)}><Minus size={11} /></button>
                        <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', minWidth:18, textAlign:'center' }}>{p.quantite}</span>
                        <button className="qty-btn" onClick={() => setQte(p.produit.id, p.quantite+1)}><Plus size={11} /></button>
                      </div>
                      <div style={{ fontWeight:700, color:'var(--violet-light)', fontSize:13, minWidth:70, textAlign:'right' }}>
                        {(Number(p.produit.prix_vente)*p.quantite).toLocaleString('fr-DZ')} DA
                      </div>
                      <button onClick={() => supprimer(p.produit.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444' }}><Trash2 size={13} /></button>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:15, padding:'12px 0 4px', color:'var(--text-primary)' }}>
                    <span>Total</span>
                    <span style={{ color:'var(--violet-light)' }}>{total.toLocaleString('fr-DZ')} DA</span>
                  </div>
                </div>
                {cmdError && (
                  <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', borderRadius:8, padding:'9px 12px', marginBottom:12 }}>
                    <AlertCircle size={14} color="#ef4444" />
                    <span style={{ fontSize:12.5, color:'#ef4444' }}>{cmdError}</span>
                  </div>
                )}
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setShowPanier(false)} className="btn-ghost" style={{ flex:1, justifyContent:'center' }}>Fermer</button>
                  <button onClick={passerCommande} disabled={cmdLoading} className="btn-primary" style={{ flex:2, justifyContent:'center' }}>
                    {cmdLoading ? 'Envoi en cours...' : `Commander — ${total.toLocaleString('fr-DZ')} DA`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}