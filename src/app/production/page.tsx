'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  Factory, CheckCircle, PlayCircle, RefreshCw,
  Layers, AlertTriangle, LogOut, X, Info,
  BarChart2, ArrowRight, Package,
  Send,
} from 'lucide-react';
import Link from 'next/link';

interface OrdreFab {
  id: number; produit_nom: string; produit_unite: string;
  commande_ref: number; quantite: number; statut: string;
  is_urgent: boolean;
  date_debut: string | null; date_fin: string | null; created_at: string;
}
interface MatiereStock {
  id: number; titre: string; unite: string;
  stock_actuel: number; stock_minimum: number; etat_stock: string;
}
interface CommandeConfirmee {
  id: number; total: number; created_at: string;
  client_nom?: string; client_prenom?: string; client_titre?: string; type_client?: string;
  lignes?: { produit_nom: string; quantite: number; unite: string }[];
}
interface DemandeExpediee {
  id: number; matiere_id: number; matiere_titre: string; matiere_unite: string;
  quantite: number; prix_unitaire: number | null; statut: string;
  date_prevue: string | null; notes: string | null; created_at: string; fournisseur_nom: string;
}

const STATUT_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  planifie: { label: 'Planifié', color: '#f59e0b', bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.25)' },
  en_cours: { label: 'En cours', color: '#a855f7', bg: 'rgba(168,85,247,.1)', border: 'rgba(168,85,247,.25)' },
  termine:  { label: 'Terminé',  color: '#10b981', bg: 'rgba(16,185,129,.1)', border: 'rgba(16,185,129,.25)' },
  urgent:   { label: 'Urgent',   color: '#ef4444', bg: 'rgba(239,68,68,.1)',  border: 'rgba(239,68,68,.25)'  },
};

const DS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--bg-base)}
.btn-primary{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:white;border:none;border-radius:9px;padding:9px 18px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .2s}
.btn-primary:hover{transform:translateY(-1px);filter:brightness(1.1)}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-green{display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.3);color:#10b981;border-radius:9px;padding:8px 16px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .2s}
.btn-green:hover{background:rgba(16,185,129,.22);transform:translateY(-1px)}
.btn-pink{display:inline-flex;align-items:center;gap:6px;background:rgba(236,72,153,.12);border:1px solid rgba(236,72,153,.3);color:#ec4899;border-radius:9px;padding:8px 16px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .2s}
.btn-pink:hover{background:rgba(236,72,153,.22);transform:translateY(-1px)}
.btn-orange{display:inline-flex;align-items:center;gap:6px;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.35);color:#f59e0b;border-radius:9px;padding:7px 12px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;font-size:12px}
.btn-orange:hover{background:rgba(245,158,11,.22)}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--border);color:var(--text-secondary);border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:var(--violet);color:var(--violet-light)}
.input-field{width:100%;background:var(--bg-surface) !important;border:1px solid var(--border) !important;border-radius:9px;padding:10px 13px;font-family:'Outfit',sans-serif;font-size:13.5px;color:var(--text-primary) !important;outline:none;transition:all .15s}
.input-field:focus{border-color:var(--violet) !important;box-shadow:0 0 0 3px rgba(124,58,237,.15) !important}
.card{background:var(--bg-card);border-radius:14px;border:1px solid var(--border)}
.tab-btn{flex:1;padding:12px;font-size:13px;font-weight:500;border:none;background:transparent;cursor:pointer;font-family:'Outfit',sans-serif;color:var(--text-secondary);transition:all .15s;border-bottom:2px solid transparent}
.tab-btn.active{color:var(--violet-light);border-bottom-color:var(--violet);background:rgba(124,58,237,.08)}
.overlay{position:fixed;inset:0;background:rgba(4,4,20,.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;animation:fadeIn .2s}
.modal{background:var(--bg-card);border:1px solid var(--border);border-radius:18px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;padding:28px;box-shadow:0 32px 80px rgba(0,0,0,.5);animation:slideUp .2s}
.progress-track{height:6px;background:var(--border);border-radius:3px;overflow:hidden}
.progress-fill{height:100%;border-radius:3px;transition:width .5s}
label{font-size:11.5px;font-weight:600;color:var(--text-secondary);margin-bottom:5px;display:block;letter-spacing:.02em}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

type TabId = 'receptions' | 'fabrication' | 'matieres';

// Helper pour détecter is_urgent peu importe le type retourné par PostgreSQL
const checkUrgent = (o: OrdreFab) =>
  o.is_urgent === true || 
  String(o.is_urgent) === 'true' || 
  (o as any).is_urgent === 't' ||
  o.statut === 'urgent';
export default function ProductionPage() {
  const { data: session } = useSession();
  const [ordres, setOrdres]                       = useState<OrdreFab[]>([]);
  const [matieres, setMatieres]                   = useState<MatiereStock[]>([]);
  const [commandes, setCommandes]                 = useState<CommandeConfirmee[]>([]);
  const [demandesExpediees, setDemandesExpediees] = useState<DemandeExpediee[]>([]);
  const [fournisseurs, setFournisseurs]           = useState<any[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [activeTab, setActiveTab]                 = useState<TabId>('fabrication');

  const [modalValidation, setModalValidation]   = useState<OrdreFab | null>(null);
  const [valForm, setValForm]                   = useState({ quantite_produite: '', quantite_rebutee: '0', observations: '' });
  const [modalReception, setModalReception]     = useState<DemandeExpediee | null>(null);
  const [recForm, setRecForm]                   = useState({ quantite_recue: '', notes: '' });
  const [saving, setSaving]                     = useState(false);
  const [launching, setLaunching]               = useState<number | null>(null);
  const [commandesEnFab, setCommandesEnFab]     = useState<CommandeConfirmee[]>([]);

  const [modalMatieres, setModalMatieres] = useState<{
    commande_id: number;
    matieres: { matiere: string; stock_actuel: number; quantite_requise: number; manque: number; unite: string }[];
  } | null>(null);

  async function fetchAll() {
    setLoading(true);
    try {
      const [ro, rm, rc, rd, rf] = await Promise.all([
        fetch('/api/fabrication').then(r => r.json()),
        fetch('/api/matieres-premieres').then(r => r.json()),
        fetch('/api/commandes').then(r => r.json()),
        fetch('/api/fournisseurs/demande?statut=expediee').then(r => r.json()),
        fetch('/api/fournisseurs').then(r => r.json()),
      ]);
      setOrdres(Array.isArray(ro) ? ro : []);
      setMatieres(Array.isArray(rm) ? rm : []);
      const all = Array.isArray(rc) ? rc : [];
      setCommandes(all.filter((c: any) => c.statut === 'confirmee' && c.source_urgence === true));
      setCommandesEnFab(all.filter((c: any) => c.statut === 'en_fabrication'));
      setDemandesExpediees(Array.isArray(rd) ? rd : []);
      setFournisseurs(Array.isArray(rf) ? rf : []);
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, []);

  async function lancerFabrication(commandeId: number) {
    setLaunching(commandeId);
    try {
      const res = await fetch(`/api/commandes/${commandeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'en_fabrication' }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'MATIERES_INSUFFISANTES') {
          setModalMatieres({ commande_id: commandeId, matieres: data.matieres_manquantes });
        } else {
          alert('Erreur : ' + (data.error || 'Inconnue'));
        }
        return;
      }
      setActiveTab('fabrication');
      await fetchAll();
    } finally { setLaunching(null); }
  }

  async function handleStatut(id: number, statut: string) {
    await fetch(`/api/fabrication/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
      credentials: 'include',
    });
    fetchAll();
  }

  async function handleValidation() {
    if (!modalValidation || !valForm.quantite_produite) return;
    setSaving(true);
    try {
      await fetch('/api/production/valider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ordre_fab_id:      modalValidation.id,
          responsable_id:    (session?.user as any)?.id,
          quantite_produite: parseInt(valForm.quantite_produite),
          quantite_rebutee:  parseInt(valForm.quantite_rebutee || '0'),
          observations:      valForm.observations,
        }),
      });
      setModalValidation(null);
      setValForm({ quantite_produite: '', quantite_rebutee: '0', observations: '' });
      fetchAll();
    } finally { setSaving(false); }
  }

  async function confirmerReception() {
    if (!modalReception) return;
    setSaving(true);
    try {
      await fetch(`/api/fournisseurs/demande/${modalReception.id}/reception`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          quantite_recue: parseFloat(recForm.quantite_recue) || modalReception.quantite,
          notes: recForm.notes,
        }),
      });
      setModalReception(null);
      setRecForm({ quantite_recue: '', notes: '' });
      fetchAll();
    } finally { setSaving(false); }
  }

  async function commanderFournisseur(matiereId: number, quantite: number, titreMat: string) {
    const fournisseur = fournisseurs[0];
    if (!fournisseur) { alert('Aucun fournisseur disponible !'); return; }
    if (!confirm(`Envoyer une demande à ${fournisseur.nom} pour ${Math.ceil(quantite)} ${titreMat} ?`)) return;
    try {
      const res = await fetch('/api/fournisseurs/demande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ matiere_id: Number(matiereId), quantite: Math.ceil(quantite), fournisseur_id: Number(fournisseur.id) }),
      });
      const data = await res.json();
      if (res.ok) alert(`Demande envoyée à ${fournisseur.nom} !`);
      else alert('Erreur : ' + (data.error || 'Inconnue'));
    } catch { alert("Erreur lors de l'envoi"); }
  }

  // ─── Filtres unifiés avec checkUrgent ───
  const urgentsOrdres = ordres.filter(o => checkUrgent(o));
  const mrpOrdres     = ordres.filter(o => !checkUrgent(o));

  const stats = {
    confirmees: commandes.length,
    receptions: demandesExpediees.length,
    planifie:   ordres.filter(o => o.statut === 'planifie').length,
    en_cours:   ordres.filter(o => o.statut === 'en_cours').length,
    termine:    ordres.filter(o => o.statut === 'termine').length,
    critique:   matieres.filter(m => m.etat_stock === 'critique' || m.etat_stock === 'rupture').length,
  };

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", minHeight:'100vh', background:'var(--bg-base)' }}>
      <style>{DS}</style>
      <div style={{ height:2, background:'linear-gradient(90deg,#7c3aed,#ec4899,transparent)' }} />

      <nav style={{ background:'var(--bg-base)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:58 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, background:'linear-gradient(135deg,#7c3aed,#ec4899)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 14px rgba(124,58,237,.4)' }}>
              <Factory size={17} color="white" />
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:14, color:'var(--text-primary)' }}>Production</div>
              <div style={{ fontSize:9, color:'var(--violet)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Responsable</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Link href="/production/analyse">
              <button className="btn-pink"><BarChart2 size={14}/> Analyse MRP <ArrowRight size={13}/></button>
            </Link>
            <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{session?.user?.name}</span>
            <button onClick={() => signOut({ callbackUrl:'/' })} style={{ background:'rgba(255,255,255,.06)', border:'1px solid var(--border)', color:'var(--text-secondary)', borderRadius:8, padding:'6px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:12, fontFamily:"'Outfit',sans-serif" }}>
              <LogOut size={13}/> Quitter
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 24px' }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:10.5, fontWeight:700, color:'var(--violet)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Tableau de bord</div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', margin:0 }}>Responsable de Production</h1>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:14, marginBottom:20 }}>
          {[
            { label:'À lancer',           value:stats.confirmees, color:'#a855f7', bg:'rgba(168,85,247,.1)', border:'rgba(168,85,247,.2)' },
            { label:'Réceptions',         value:stats.receptions, color:'#10b981', bg:'rgba(16,185,129,.1)', border:'rgba(16,185,129,.2)' },
            { label:'Planifiés',          value:stats.planifie,   color:'#f59e0b', bg:'rgba(245,158,11,.1)', border:'rgba(245,158,11,.2)' },
            { label:'En cours',           value:stats.en_cours,   color:'#ec4899', bg:'rgba(236,72,153,.1)', border:'rgba(236,72,153,.2)' },
            { label:'Terminés',           value:stats.termine,    color:'#06b6d4', bg:'rgba(6,182,212,.1)',  border:'rgba(6,182,212,.2)'  },
            { label:'Matières critiques', value:stats.critique,   color:'#ef4444', bg:'rgba(239,68,68,.1)',  border:'rgba(239,68,68,.2)'  },
          ].map((s,i) => (
            <div key={i} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:14, padding:'16px 18px' }}>
              <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:11.5, color:'var(--text-secondary)', fontWeight:500, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)', overflowX:'auto' }}>
            {([
              { id:'fabrication', label:'Ordres fabrication',  icon:<Factory size={13}/>,  badge: 0 },
              { id:'receptions',  label:'Réceptions matières', icon:<Package size={13}/>,  badge: stats.receptions },
              { id:'matieres',    label:'Stock matières',      icon:<Layers size={13}/>,   badge: 0 },
            ] as {id:TabId;label:string;icon:any;badge:number}[]).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`tab-btn${activeTab===tab.id?' active':''}`}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, whiteSpace:'nowrap' }}>
                {tab.icon} {tab.label}
                {tab.badge > 0 && (
                  <span style={{ background:'#10b981', color:'white', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:20, marginLeft:2 }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ padding:24 }}>

            {/* TAB Réceptions */}
            {activeTab === 'receptions' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <div style={{ fontSize:13, color:'var(--text-secondary)' }}>Livraisons expédiées par les fournisseurs</div>
                  <button onClick={fetchAll} className="btn-ghost"><RefreshCw size={13} style={{ animation:loading?'spin 1s linear infinite':'none' }}/> Actualiser</button>
                </div>
                {demandesExpediees.length === 0 ? (
                  <div style={{ textAlign:'center', padding:56 }}>
                    <Package size={36} style={{ display:'block', margin:'0 auto 10px', opacity:.2, color:'var(--text-muted)' }}/>
                    <p style={{ color:'var(--text-muted)', fontSize:13 }}>Aucune livraison en attente de réception</p>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {demandesExpediees.map(d => (
                      <div key={d.id} style={{ background:'var(--bg-surface)', borderRadius:12, border:'1px solid rgba(16,185,129,.2)', padding:'18px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16 }}>
                        <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                          <div style={{ width:4, height:52, borderRadius:2, background:'#10b981', flexShrink:0 }}/>
                          <div>
                            <div style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:8 }}>
                              {d.matiere_titre}
                              <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:'rgba(6,182,212,.12)', color:'#06b6d4', border:'1px solid rgba(6,182,212,.3)' }}>Expédiée</span>
                            </div>
                            <div style={{ fontSize:12.5, color:'var(--text-secondary)', marginTop:4 }}>Fournisseur : <strong>{d.fournisseur_nom}</strong></div>
                            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3, display:'flex', gap:12 }}>
                              <span>Qté : <strong>{d.quantite} {d.matiere_unite}</strong></span>
                              {d.date_prevue && <span>Prévue : <strong>{new Date(d.date_prevue).toLocaleDateString('fr-FR')}</strong></span>}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => { setModalReception(d); setRecForm({ quantite_recue: String(d.quantite), notes: '' }); }} className="btn-green">
                          <CheckCircle size={14}/> Confirmer réception
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB Fabrication */}
            {activeTab === 'fabrication' && (
              <div>
                <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
                  <button onClick={fetchAll} className="btn-ghost">
                    <RefreshCw size={13} style={{ animation:loading?'spin 1s linear infinite':'none' }}/> Actualiser
                  </button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

                  {/* Colonne Urgences */}
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:'#ef4444', boxShadow:'0 0 8px #ef4444' }}/>
                      <span style={{ fontWeight:700, fontSize:13, color:'#ef4444' }}>Urgences admin</span>
                      <span style={{ background:'rgba(239,68,68,.15)', color:'#ef4444', border:'1px solid rgba(239,68,68,.3)', borderRadius:20, fontSize:11, fontWeight:700, padding:'1px 8px' }}>
                        {urgentsOrdres.length}
                      </span>
                    </div>
                    <div style={{ fontSize:11.5, color:'var(--text-muted)', marginBottom:12 }}>
                      Commandes transmises par l'admin — stock insuffisant détecté
                    </div>
                    {urgentsOrdres.length === 0 ? (
                      <div style={{ textAlign:'center', padding:'40px 20px', background:'rgba(239,68,68,.04)', border:'1px dashed rgba(239,68,68,.2)', borderRadius:12 }}>
                        <span style={{ fontSize:12.5, color:'var(--text-muted)' }}>Aucune urgence en cours ✓</span>
                      </div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {urgentsOrdres
                          .sort((a, b) => {
                            const scoreA = a.quantite * 10 + Math.floor((Date.now() - new Date(a.created_at).getTime()) / 3600000);
                            const scoreB = b.quantite * 10 + Math.floor((Date.now() - new Date(b.created_at).getTime()) / 3600000);
                            return scoreB - scoreA;
                          })
                          .map((o, idx) => {
                            const cfg   = STATUT_CFG[o.statut] || STATUT_CFG.urgent;
                            const score = o.quantite * 10 + Math.floor((Date.now() - new Date(o.created_at).getTime()) / 3600000);
                            return (
                              <div key={o.id} style={{ background:'rgba(239,68,68,.06)', borderRadius:12, border:'1px solid rgba(239,68,68,.25)', padding:'16px 18px', position:'relative', overflow:'hidden' }}>
                                <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background:idx===0?'#ef4444':idx===1?'#f97316':'#f59e0b' }}/>
                                <div style={{ paddingLeft:8 }}>
                                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                                    <div>
                                      <div style={{ fontWeight:700, fontSize:13.5, color:'var(--text-primary)' }}>{o.produit_nom}</div>
                                      <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:3 }}>
                                        Commande <strong style={{ color:'#ef4444' }}>#{o.commande_ref}</strong> · <strong>{o.quantite} {o.produit_unite}</strong> à fabriquer
                                      </div>
                                    </div>
                                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:600, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>
                                        {cfg.label}
                                      </span>
                                      <div style={{ fontSize:10, color:'var(--text-muted)' }}>Score : <strong style={{ color:'#ef4444' }}>{score}</strong></div>
                                    </div>
                                  </div>
                                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10 }}>
                                    <span style={{ fontSize:11, color:'#f59e0b', fontWeight:600 }}>
                                      🕐 {new Date(o.created_at).toLocaleDateString('fr-FR')}
                                    </span>
                                    <div style={{ display:'flex', gap:6 }}>
                                      {o.statut !== 'en_cours' && o.statut !== 'termine' && (
                                        <button onClick={() => handleStatut(o.id, 'en_cours')}
                                          style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(239,68,68,.15)', border:'1px solid rgba(239,68,68,.4)', color:'#ef4444', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                                          <PlayCircle size={13}/> Démarrer
                                        </button>
                                      )}
                                      {o.statut !== 'termine' && (
                                        <button onClick={() => { setModalValidation(o); setValForm({ quantite_produite:String(o.quantite), quantite_rebutee:'0', observations:'' }); }}
                                          style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', color:'#10b981', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                                          <CheckCircle size={13}/> Valider
                                        </button>
                                      )}
                                      {o.statut === 'termine' && (
                                        <span style={{ fontSize:12, color:'#10b981', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                                          <CheckCircle size={13}/> Terminé
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Colonne MRP */}
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:'#a855f7', boxShadow:'0 0 8px #a855f7' }}/>
                      <span style={{ fontWeight:700, fontSize:13, color:'#a855f7' }}>Planification MRP</span>
                      <span style={{ background:'rgba(168,85,247,.15)', color:'#a855f7', border:'1px solid rgba(168,85,247,.3)', borderRadius:20, fontSize:11, fontWeight:700, padding:'1px 8px' }}>
                        {mrpOrdres.length}
                      </span>
                    </div>
                    <div style={{ fontSize:11.5, color:'var(--text-muted)', marginBottom:12 }}>
                      Ordres prévisionnels issus de l'analyse et du forecasting mensuel
                    </div>
                    {mrpOrdres.length === 0 ? (
                      <div style={{ textAlign:'center', padding:'40px 20px', background:'rgba(168,85,247,.04)', border:'1px dashed rgba(168,85,247,.2)', borderRadius:12 }}>
                        <span style={{ fontSize:12.5, color:'var(--text-muted)' }}>Aucun ordre planifié</span>
                      </div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {mrpOrdres.map(o => {
                          const cfg = STATUT_CFG[o.statut] || STATUT_CFG.planifie;
                          return (
                            <div key={o.id} style={{ background:'var(--bg-surface)', borderRadius:12, border:'1px solid var(--border)', padding:'16px 18px', position:'relative', overflow:'hidden' }}>
                              <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background:cfg.color }}/>
                              <div style={{ paddingLeft:8 }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                                  <div>
                                    <div style={{ fontWeight:700, fontSize:13.5, color:'var(--text-primary)' }}>{o.produit_nom}</div>
                                    <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:3 }}>
                                      Qté prévue : <strong>{o.quantite} {o.produit_unite}</strong>
                                    </div>
                                  </div>
                                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:600, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`, flexShrink:0 }}>
                                    {cfg.label}
                                  </span>
                                </div>
                                {o.date_debut && o.date_fin && (
                                  <div style={{ fontSize:11.5, color:'var(--text-muted)', marginBottom:10 }}>
                                    📅 {new Date(o.date_debut).toLocaleDateString('fr-FR')} → {new Date(o.date_fin).toLocaleDateString('fr-FR')}
                                  </div>
                                )}
                                <div style={{ display:'flex', justifyContent:'flex-end', gap:6 }}>
                                  {o.statut === 'planifie' && (
                                    <button onClick={() => handleStatut(o.id, 'en_cours')}
                                      style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(168,85,247,.1)', border:'1px solid rgba(168,85,247,.25)', color:'#a855f7', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                                      <PlayCircle size={13}/> Démarrer
                                    </button>
                                  )}
                                  {o.statut === 'en_cours' && (
                                    <button onClick={() => { setModalValidation(o); setValForm({ quantite_produite:String(o.quantite), quantite_rebutee:'0', observations:'' }); }}
                                      style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', color:'#10b981', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                                      <CheckCircle size={13}/> Valider
                                    </button>
                                  )}
                                  {o.statut === 'termine' && (
                                    <span style={{ fontSize:12, color:'#10b981', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                                      <CheckCircle size={13}/> Terminé
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB Matières */}
            {activeTab === 'matieres' && (
              <div>
                {stats.critique > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.25)', borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
                    <AlertTriangle size={15} color="#ef4444"/>
                    <span style={{ fontSize:13, color:'#ef4444', fontWeight:500 }}>{stats.critique} matière{stats.critique>1?'s':''} en état critique</span>
                  </div>
                )}
                <div style={{ display:'grid', gap:10 }}>
                  {matieres.map(m => {
                    const pct  = Math.min((Number(m.stock_actuel)/Math.max(Number(m.stock_minimum)*2,1))*100, 100);
                    const isOk = m.etat_stock === 'ok';
                    return (
                      <div key={m.id} style={{ background:isOk?'var(--bg-surface)':'rgba(239,68,68,.05)', border:`1px solid ${isOk?'var(--border)':'rgba(239,68,68,.2)'}`, borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', gap:16 }}>
                        <Layers size={18} color={isOk?'var(--text-muted)':'#ef4444'} style={{ flexShrink:0 }}/>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600, fontSize:13, color:'var(--text-primary)', marginBottom:6 }}>{m.titre}</div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width:`${pct}%`, background:isOk?'#10b981':m.etat_stock==='bas'?'#f59e0b':'#ef4444' }}/>
                          </div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <span style={{ fontWeight:700, fontSize:15, color:isOk?'var(--text-primary)':'#ef4444' }}>{m.stock_actuel}</span>
                          <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:3 }}>{m.unite}</span>
                          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>min : {m.stock_minimum}</div>
                        </div>
                        <span style={{ display:'inline-flex', padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:600, background:isOk?'rgba(16,185,129,.1)':'rgba(239,68,68,.1)', color:isOk?'#10b981':'#ef4444', border:`1px solid ${isOk?'rgba(16,185,129,.25)':'rgba(239,68,68,.25)'}`, flexShrink:0 }}>
                          {m.etat_stock==='ok'?'OK':m.etat_stock==='bas'?'Bas':m.etat_stock==='critique'?'Critique':'Rupture'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modal matières manquantes */}
      {modalMatieres && (
        <div className="overlay" onClick={() => setModalMatieres(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:520 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontWeight:700, fontSize:18, color:'#ef4444', margin:0, display:'flex', alignItems:'center', gap:8 }}>
                <AlertTriangle size={18}/> Matières insuffisantes
              </h2>
              <button onClick={() => setModalMatieres(null)} style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,.06)', border:'1px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}><X size={14}/></button>
            </div>
            <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:12.5, color:'var(--text-secondary)' }}>
              La fabrication de la commande <strong style={{ color:'var(--text-primary)' }}>#{modalMatieres.commande_id}</strong> ne peut pas démarrer — stocks insuffisants :
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
              {modalMatieres.matieres.map((m, i) => (
                <div key={i} style={{ background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.2)', borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontWeight:700, fontSize:13, color:'var(--text-primary)', marginBottom:6 }}>{m.matiere}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                    {[
                      { label:'Stock actuel', value:`${m.stock_actuel} ${m.unite}`,     color:'var(--text-primary)' },
                      { label:'Requis',       value:`${m.quantite_requise} ${m.unite}`, color:'#06b6d4'             },
                      { label:'Manque',       value:`${m.manque} ${m.unite}`,           color:'#ef4444'             },
                    ].map((s, j) => (
                      <div key={j} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:7, padding:'6px 10px', textAlign:'center' }}>
                        <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:2 }}>{s.label}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:10, display:'flex', justifyContent:'flex-end' }}>
                    <button className="btn-orange" onClick={() => commanderFournisseur(0, m.manque, m.matiere)}>
                      <Send size={11}/> Commander au fournisseur
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button onClick={() => setModalMatieres(null)} className="btn-ghost">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal réception */}
      {modalReception && (
        <div className="overlay" onClick={() => setModalReception(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontWeight:700, fontSize:18, color:'var(--text-primary)', margin:0 }}>Confirmer la réception</h2>
              <button onClick={() => setModalReception(null)} style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,.06)', border:'1px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}><X size={14}/></button>
            </div>
            <div style={{ background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', borderRadius:10, padding:'12px 14px', marginBottom:18 }}>
              <div style={{ fontWeight:600, fontSize:13, color:'var(--text-primary)' }}>{modalReception.matiere_titre}</div>
              <div style={{ fontSize:12, color:'#10b981', marginTop:3, display:'flex', gap:12 }}>
                <span>Commandé : <strong>{modalReception.quantite} {modalReception.matiere_unite}</strong></span>
                <span>Fournisseur : <strong>{modalReception.fournisseur_nom}</strong></span>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
              <div>
                <label>Quantité réellement reçue *</label>
                <input className="input-field" type="number" min="0" step="0.01" value={recForm.quantite_recue} onChange={e => setRecForm({ ...recForm, quantite_recue: e.target.value })}/>
              </div>
              <div>
                <label>Notes / observations</label>
                <textarea className="input-field" rows={3} value={recForm.notes} onChange={e => setRecForm({ ...recForm, notes: e.target.value } as any)}/>
              </div>
              <div style={{ background:'rgba(16,185,129,.08)', border:'1px solid rgba(16,185,129,.2)', borderRadius:10, padding:'10px 14px', display:'flex', gap:8 }}>
                <Info size={14} color="#10b981" style={{ flexShrink:0, marginTop:1 }}/>
                <p style={{ fontSize:12, color:'#10b981', margin:0 }}>La confirmation mettra à jour le stock de cette matière première.</p>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={() => setModalReception(null)} className="btn-ghost" style={{ flex:1, justifyContent:'center' }}>Annuler</button>
              <button onClick={confirmerReception} disabled={saving} className="btn-primary" style={{ flex:2, justifyContent:'center' }}>
                <CheckCircle size={14}/> {saving ? 'Enregistrement...' : 'Confirmer la réception'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal validation */}
      {modalValidation && (
        <div className="overlay" onClick={() => setModalValidation(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontWeight:700, fontSize:18, color:'var(--text-primary)', margin:0 }}>Valider la production</h2>
              <button onClick={() => setModalValidation(null)} style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,.06)', border:'1px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}><X size={14}/></button>
            </div>
            <div style={{ background:'var(--bg-surface)', borderRadius:10, padding:'12px 14px', marginBottom:18, border:'1px solid var(--border)' }}>
              <div style={{ fontWeight:600, fontSize:13, color:'var(--text-primary)' }}>{modalValidation.produit_nom}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>
                Commande #{modalValidation.commande_ref} · Prévu : {modalValidation.quantite} {modalValidation.produit_unite}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
              <div>
                <label>Quantité produite *</label>
                <input className="input-field" type="number" min="0" value={valForm.quantite_produite} onChange={e => setValForm({...valForm, quantite_produite:e.target.value})}/>
              </div>
              <div>
                <label>Quantité rebutée</label>
                <input className="input-field" type="number" min="0" value={valForm.quantite_rebutee} onChange={e => setValForm({...valForm, quantite_rebutee:e.target.value})}/>
              </div>
              <div>
                <label>Observations</label>
                <textarea className="input-field" rows={3} value={valForm.observations} onChange={e => setValForm({...valForm, observations:e.target.value} as any)}/>
              </div>
              <div style={{ background:'rgba(124,58,237,.08)', border:'1px solid rgba(124,58,237,.2)', borderRadius:10, padding:'10px 14px', display:'flex', gap:8 }}>
                <Info size={14} color="#a855f7" style={{ flexShrink:0, marginTop:1 }}/>
                <p style={{ fontSize:12, color:'var(--violet-light)', margin:0 }}>La validation déduira automatiquement les matières consommées et mettra à jour le stock produit fini.</p>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={() => setModalValidation(null)} className="btn-ghost" style={{ flex:1, justifyContent:'center' }}>Annuler</button>
              <button onClick={handleValidation} disabled={saving||!valForm.quantite_produite} className="btn-primary" style={{ flex:2, justifyContent:'center' }}>
                <CheckCircle size={14}/> {saving?'Validation...':'Valider la production'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}