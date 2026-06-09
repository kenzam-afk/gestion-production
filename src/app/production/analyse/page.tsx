"use client";

import { useEffect, useState } from "react";
import {
  Factory, RefreshCw, AlertTriangle, CheckCircle,
  Layers, TrendingUp, TrendingDown, Minus, ShoppingCart,
  ArrowLeft, Send, Calendar, BarChart2, Clock,
  Package, ChevronDown, ChevronUp, Activity,
} from "lucide-react";
import Link from "next/link";

interface LigneCommande { produit_id: number; produit_nom: string; quantite: number; prix_unitaire: number; }
interface Commande {
  id: number; statut: string; total: number; created_at: string;
  client_nom: string; client_prenom: string; client_titre: string; type_client: string;
  lignes: LigneCommande[];
}
interface Matiere { id: number; titre: string; unite: string; stock_actuel: number; stock_minimum: number; }
interface Fournisseur { id: number; nom: string; }

interface MrpBesoin {
  matiere_id: number; matiere_titre: string; unite: string;
  stock_actuel: number; stock_minimum: number; stock_securite: number;
  quantite_besoin_brut: number; quantite_besoin_reel: number;
  taux_rebut_moyen: number; score_urgence: number; stock_net: number;
  quantite_a_commander: number; suffisant: boolean; commandes_ids: number[];
  detail_par_commande: { commande_id: number; produit: string; quantite_mp: number; priorite: number; semaine: number; }[];
}
interface MrpFaisabilite {
  commande_id: number; statut: string; priorite: number; faisable: boolean;
  matieres_manquantes: { matiere: string; besoin: number; stock: number; manque: number }[];
}
interface MrpPeriode { semaine: number; debut: string; fin: string; nb_commandes: number; commandes_ids: number[]; }
interface MrpResult {
  besoins: MrpBesoin[]; commandes_concernees: number[];
  faisabilite_commandes: MrpFaisabilite[]; periodes: MrpPeriode[];
  resume: { total_matieres: number; matieres_ok: number; matieres_manquantes: number; commandes_faisables: number; commandes_bloquees: number; taux_rebut_moyen: number; commandes_urgentes?: number; commandes_normales?: number; };
  calcule_le?: string; methode?: string;
}

interface PrevisionProduit {
  produit_id: number; produit_nom: string; unite: string;
  stock_actuel: number; stock_minimum: number; total_en_cours: number; stock_apres: number;
  vm0: number; vm1: number; vm2: number; vm3: number;
  moy3mois: number; tendance: string; coeff: number; prevision: number; a_produire: number; urgence: string;
  mois_labels: { m3: string; m2: string; m1: string; m0: string };
}
interface PrevResume {
  total_produits: number; a_produire: number; critique: number; ok: number;
  tendance_hausse: number; tendance_baisse: number;
}

const STATUT_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  en_attente:    { label:'En attente',    color:'#f59e0b', bg:'rgba(245,158,11,.1)',  border:'rgba(245,158,11,.25)' },
  confirmee:     { label:'Confirmée',     color:'#a855f7', bg:'rgba(168,85,247,.1)',  border:'rgba(168,85,247,.25)' },
  en_fabrication:{ label:'Fabrication',   color:'#ec4899', bg:'rgba(236,72,153,.1)',  border:'rgba(236,72,153,.25)' },
  pret_livraison:{ label:'Prêt livraison',color:'#06b6d4', bg:'rgba(6,182,212,.1)',   border:'rgba(6,182,212,.25)'  },
  livree:        { label:'Livrée',        color:'#10b981', bg:'rgba(16,185,129,.1)',  border:'rgba(16,185,129,.25)' },
  annulee:       { label:'Annulée',       color:'#ef4444', bg:'rgba(239,68,68,.1)',   border:'rgba(239,68,68,.25)'  },
};

const PRIORITE_CFG: Record<number, { label: string; color: string; bg: string }> = {
  3: { label:'En retard', color:'#ef4444', bg:'rgba(239,68,68,.12)' },
  2: { label:'Urgent',    color:'#f59e0b', bg:'rgba(245,158,11,.12)' },
  1: { label:'Normal',    color:'#10b981', bg:'rgba(16,185,129,.12)' },
};

const DS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box}
.btn-violet{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:white;border:none;border-radius:9px;padding:8px 14px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;font-size:12px;transition:all .2s}
.btn-violet:hover{transform:translateY(-1px);filter:brightness(1.1)}
.btn-orange{display:inline-flex;align-items:center;gap:6px;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.35);color:#f59e0b;border-radius:9px;padding:7px 12px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;font-size:12px}
.btn-orange:hover{background:rgba(245,158,11,.22)}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--border);color:var(--text-secondary);border-radius:9px;padding:7px 14px;font-weight:500;cursor:pointer;font-family:'Outfit',sans-serif;font-size:12px;transition:all .15s}
.btn-ghost:hover{border-color:var(--violet);color:var(--violet-light)}
.badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600}
.tr{border-bottom:1px solid var(--border)}
.tr:hover{background:var(--bg-surface)}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.pulse{animation:pulse 2s ease-in-out infinite}
`;

export default function ProductionAnalysePage() {
  const [commandes,    setCommandes]    = useState<Commande[]>([]);
  const [matieres,     setMatieres]     = useState<Matiere[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [previsions,   setPrevisions]   = useState<PrevisionProduit[]>([]);
  const [prevResume,   setPrevResume]   = useState<PrevResume | null>(null);
  const [prevLoading,  setPrevLoading]  = useState(false);
  const [mrpData,      setMrpData]      = useState<MrpResult | null>(null);
  const [mrpLoading,   setMrpLoading]   = useState(false);
  const [mrpExpanded,  setMrpExpanded]  = useState<Record<number, boolean>>({});
  const [activeTab,    setActiveTab]    = useState<'analyse' | 'mrp'>('analyse');

  async function fetchAll() {
    setLoading(true);
    try {
      const [c, m, f] = await Promise.all([
        fetch('/api/commandes').then(r => r.json()),
        fetch('/api/matieres-premieres').then(r => r.json()),
        fetch('/api/fournisseurs').then(r => r.json()),
      ]);
      setCommandes(Array.isArray(c) ? c : []);
      setMatieres(Array.isArray(m) ? m : []);
      setFournisseurs(Array.isArray(f) ? f : []);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function fetchPrevisions() {
    setPrevLoading(true);
    try {
      const res  = await fetch('/api/mrp/produits');
      const data = await res.json();
      setPrevisions(data.previsions || []);
      setPrevResume(data.resume || null);
    } catch(e) { console.error(e); }
    setPrevLoading(false);
  }

  async function fetchMRP() {
    setMrpLoading(true);
    try {
      const res  = await fetch('/api/mrp');
      const data = await res.json();
      if (res.ok) setMrpData(data);
    } catch(e) { console.error(e); }
    setMrpLoading(false);
  }

  useEffect(() => { fetchAll(); fetchPrevisions(); }, []);
  useEffect(() => { if (activeTab === 'mrp' && !mrpData) fetchMRP(); }, [activeTab]);

  async function demanderAppro(matiereId: number, quantite: number, titreMat: string) {
    const fournisseur = fournisseurs[0];
    if (!fournisseur) { alert('Aucun fournisseur disponible !'); return; }
    const qteFinale = Math.ceil(Number(quantite));
    if (isNaN(qteFinale) || qteFinale <= 0) { alert('Données invalides'); return; }
    if (!confirm(`Envoyer une demande à ${fournisseur.nom} pour ${qteFinale} ${titreMat} ?`)) return;
    try {
      const res  = await fetch('/api/fournisseurs/demande', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matiere_id: Number(matiereId), quantite: qteFinale, fournisseur_id: Number(fournisseur.id) }),
      });
      const data = await res.json();
      if (res.ok) alert(`Demande envoyée à ${fournisseur.nom} !`);
      else alert('Erreur : ' + (data.error || 'Inconnue'));
    } catch(e) { alert("Erreur lors de l'envoi"); }
  }

  const now     = new Date();
  const debutM0 = new Date(now.getFullYear(), now.getMonth(), 1);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', fontFamily:"'Outfit',sans-serif", color:'var(--text-muted)' }}>
      <RefreshCw size={24} style={{ animation:'spin 1s linear infinite', marginRight:10 }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      Chargement
    </div>
  );

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", padding:'28px 32px', maxWidth:1600 }}>
      <style>{DS}</style>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <Link href="/production">
            <button className="btn-ghost" style={{ marginBottom:10 }}><ArrowLeft size={13}/> Retour à la production</button>
          </Link>
          <div style={{ fontSize:10.5, fontWeight:700, color:'#10b981', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Responsable Production</div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', margin:0, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, background:'linear-gradient(135deg,#10b981,#06b6d4)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px rgba(16,185,129,.4)' }}>
              <BarChart2 size={18} color="white" />
            </div>
            Analyse MRP & Prédiction de Production
          </h1>
          <p style={{ fontSize:12.5, color:'var(--text-muted)', marginTop:3 }}>
            Tendances · Historique · Besoins matières · Time-Phased + Priority-Based + Yield-Based
          </p>
        </div>
        <button onClick={() => { fetchAll(); fetchPrevisions(); }} className="btn-ghost"><RefreshCw size={13}/> Actualiser</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Produits analysés',    value:previsions.length, color:'#a855f7', bg:'rgba(168,85,247,.1)', border:'rgba(168,85,247,.2)' },
          { label:'Commandes ce mois',    value:commandes.filter(c=>new Date(c.created_at)>=debutM0&&c.statut!=='annulee').length, color:'#06b6d4', bg:'rgba(6,182,212,.1)', border:'rgba(6,182,212,.2)' },
          { label:'Commandes en attente', value:commandes.filter(c=>['en_attente','confirmee','en_fabrication'].includes(c.statut)).length, color:'#f59e0b', bg:'rgba(245,158,11,.1)', border:'rgba(245,158,11,.2)' },
          { label:'Matières critiques',   value:matieres.filter(m=>Number(m.stock_actuel)<=Number(m.stock_minimum)).length, color:'#ef4444', bg:'rgba(239,68,68,.1)', border:'rgba(239,68,68,.2)' },
          { label:'Total commandes',      value:commandes.filter(c=>c.statut!=='annulee').length, color:'#10b981', bg:'rgba(16,185,129,.1)', border:'rgba(16,185,129,.2)' },
        ].map((s,i) => (
          <div key={i} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:500, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:24, borderBottom:'1px solid var(--border)' }}>
        {([
          { key:'analyse', icon:<BarChart2 size={13}/>, label:'Analyse par produit' },
          { key:'mrp',     icon:<Activity  size={13}/>, label:'MRP — Time-Phased + Priorité + Rebut' },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:'9px 9px 0 0', border:'1px solid var(--border)', borderBottom:'none', fontFamily:"'Outfit',sans-serif", fontSize:12.5, fontWeight:600, cursor:'pointer', background:activeTab===tab.key?'var(--bg-card)':'transparent', color:activeTab===tab.key?'var(--violet-light)':'var(--text-muted)', borderColor:activeTab===tab.key?'var(--border)':'transparent', transition:'all .15s' }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'analyse' && (
        <div>
          {prevResume && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
              {[
                { label:'Produits analysés', value:prevResume.total_produits, color:'#a855f7', bg:'rgba(168,85,247,.1)', border:'rgba(168,85,247,.2)' },
                { label:'À produire',        value:prevResume.a_produire,     color:'#ef4444', bg:'rgba(239,68,68,.1)',  border:'rgba(239,68,68,.2)'  },
                { label:'Tendance hausse',   value:prevResume.tendance_hausse,color:'#10b981', bg:'rgba(16,185,129,.1)', border:'rgba(16,185,129,.2)' },
                { label:'Tendance baisse',   value:prevResume.tendance_baisse,color:'#f59e0b', bg:'rgba(245,158,11,.1)', border:'rgba(245,158,11,.2)' },
              ].map((s,i) => (
                <div key={i} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:12, padding:'14px 16px' }}>
                  <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:500, marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {prevLoading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 0', color:'var(--text-muted)', gap:10, fontSize:13 }}>
              <RefreshCw size={18} style={{ animation:'spin 1s linear infinite' }}/> Calcul des prévisions
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {previsions.map((p, rang) => {
                const urgColor  = p.urgence==='critique'?'#ef4444':p.urgence==='eleve'?'#f59e0b':p.urgence==='normal'?'#a855f7':'#10b981';
                const urgBg     = p.urgence==='critique'?'rgba(239,68,68,.06)':p.urgence==='eleve'?'rgba(245,158,11,.06)':p.urgence==='normal'?'rgba(168,85,247,.06)':'rgba(16,185,129,.06)';
                const urgBorder = p.urgence==='critique'?'rgba(239,68,68,.2)':p.urgence==='eleve'?'rgba(245,158,11,.2)':p.urgence==='normal'?'rgba(168,85,247,.2)':'rgba(16,185,129,.2)';
                const max = Math.max(p.vm0, p.vm1, p.vm2, p.vm3, 1);

                const commandesProduit = commandes
                  .filter(c => (c.lignes||[]).some(l => l.produit_id === p.produit_id))
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                const totalLivre   = commandesProduit.filter(c=>c.statut==='livree').flatMap(c=>c.lignes).filter(l=>l.produit_id===p.produit_id).reduce((acc,l)=>acc+Number(l.quantite),0);
                const totalEnCours = commandesProduit.filter(c=>['en_attente','confirmee','en_fabrication','pret_livraison'].includes(c.statut)).flatMap(c=>c.lignes).filter(l=>l.produit_id===p.produit_id).reduce((acc,l)=>acc+Number(l.quantite),0);
                const totalAnnule  = commandesProduit.filter(c=>c.statut==='annulee').flatMap(c=>c.lignes).filter(l=>l.produit_id===p.produit_id).reduce((acc,l)=>acc+Number(l.quantite),0);

                return (
                  <div key={p.produit_id} style={{ background:'var(--bg-card)', border:`1px solid ${urgBorder}`, borderRadius:18, overflow:'hidden' }}>
                    <div style={{ height:3, background:rang===0?'linear-gradient(90deg,#f59e0b,#ef4444)':rang===1?'linear-gradient(90deg,#a855f7,#ec4899)':'linear-gradient(90deg,#7c3aed,#06b6d4)' }} />

                    <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)', background:'var(--bg-surface)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:36, height:36, borderRadius:'50%', background:rang===0?'linear-gradient(135deg,#f59e0b,#ef4444)':rang===1?'rgba(168,85,247,.2)':'var(--bg-card)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:rang<2?(rang===0?'#f59e0b':'#a855f7'):'var(--text-muted)', flexShrink:0 }}>{rang+1}</div>
                        <div>
                          <div style={{ fontWeight:800, fontSize:16, color:'var(--text-primary)' }}>{p.produit_nom}</div>
                          <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:10, marginTop:2 }}>
                            <span>Stock: <strong style={{ color:'var(--text-primary)' }}>{p.stock_actuel}</strong> u (min: {p.stock_minimum})</span>
                            <span>·</span>
                            <span>En cours: <strong style={{ color:'#f59e0b' }}>{p.total_en_cours}</strong> u</span>
                            <span>·</span>
                            <span>Moy. 3 mois: <strong style={{ color:'var(--text-primary)' }}>{p.moy3mois}</strong> u/mois</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <span style={{ padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:urgBg, color:urgColor, border:`1px solid ${urgBorder}` }}>
                          {p.urgence==='critique'?'Critique':p.urgence==='eleve'?'Elevé':p.urgence==='normal'?'Normal':'OK'}
                        </span>
                        <div style={{ display:'flex', alignItems:'center', gap:6, background:p.tendance==='hausse'?'rgba(16,185,129,.1)':p.tendance==='baisse'?'rgba(239,68,68,.1)':'rgba(245,158,11,.1)', border:`1px solid ${p.tendance==='hausse'?'rgba(16,185,129,.3)':p.tendance==='baisse'?'rgba(239,68,68,.3)':'rgba(245,158,11,.3)'}`, borderRadius:10, padding:'6px 12px' }}>
                          {p.tendance==='hausse'?<TrendingUp size={14} color="#10b981"/>:p.tendance==='baisse'?<TrendingDown size={14} color="#ef4444"/>:<Minus size={14} color="#f59e0b"/>}
                          <span style={{ fontSize:12, fontWeight:700, color:p.tendance==='hausse'?'#10b981':p.tendance==='baisse'?'#ef4444':'#f59e0b' }}>
                            {p.tendance==='hausse'?'En hausse':p.tendance==='baisse'?'En baisse':'Stable'}
                          </span>
                        </div>
                        <div style={{ background:'rgba(124,58,237,.1)', border:'1px solid rgba(124,58,237,.2)', borderRadius:10, padding:'6px 14px', textAlign:'center' }}>
                          <div style={{ fontSize:10, color:'var(--text-muted)' }}>Prévision mois prochain</div>
                          <div style={{ fontSize:18, fontWeight:800, color:'var(--violet-light)' }}>{p.prevision} <span style={{ fontSize:11, fontWeight:400 }}>u</span></div>
                        </div>
                        <div style={{ background:p.a_produire>0?`${urgColor}18`:'rgba(16,185,129,.1)', border:`1px solid ${p.a_produire>0?urgColor+'40':'rgba(16,185,129,.3)'}`, borderRadius:10, padding:'6px 14px', textAlign:'center' }}>
                          <div style={{ fontSize:10, color:'var(--text-muted)' }}>À produire</div>
                          <div style={{ fontSize:18, fontWeight:800, color:p.a_produire>0?urgColor:'#10b981' }}>{p.a_produire>0?`${p.a_produire} u`:'OK'}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
                      <div style={{ padding:'18px 22px', borderRight:'1px solid var(--border)' }}>
                        <div style={{ marginBottom:18 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
                            <BarChart2 size={11}/> Évolution des ventes (4 derniers mois)
                          </div>
                          <div style={{ display:'flex', gap:8, alignItems:'flex-end', height:60 }}>
                            {[
                              { val:p.vm3, mois:p.mois_labels.m3,            color:'rgba(255,255,255,.15)' },
                              { val:p.vm2, mois:p.mois_labels.m2,            color:'rgba(6,182,212,.5)'    },
                              { val:p.vm1, mois:p.mois_labels.m1,            color:'#a855f7'               },
                              { val:p.vm0, mois:p.mois_labels.m0+' (cours)', color:'#ec4899'               },
                            ].map((bar, i) => (
                              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                                <div style={{ fontSize:10, fontWeight:700, color:'var(--text-secondary)' }}>{bar.val}u</div>
                                <div style={{ width:'100%', height:Math.max(4,(bar.val/max)*44), background:bar.color, borderRadius:'4px 4px 0 0', minHeight:4 }} />
                                <div style={{ fontSize:9.5, color:'var(--text-muted)', textAlign:'center', lineHeight:1.2 }}>{bar.mois}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(124,58,237,.06)', border:'1px solid rgba(124,58,237,.15)', borderRadius:8, fontSize:11, color:'var(--text-secondary)' }}>
                            <strong style={{ color:'var(--violet-light)' }}>Calcul tendance :</strong> {p.mois_labels.m1} ({p.vm1}u) vs {p.mois_labels.m2} ({p.vm2}u) {p.vm2>0?`${Math.round(((p.vm1-p.vm2)/p.vm2)*100)}%`:'N/A'} {p.tendance==='hausse'?'hausse':p.tendance==='baisse'?'baisse':'stable'}<br/>
                            <strong style={{ color:'var(--violet-light)' }}>Prévision :</strong> Moy({p.vm1}+{p.vm2}+{p.vm3}) / 3 x coeff({p.coeff}) = {p.prevision}u
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
                            <ShoppingCart size={11}/> Historique commandes
                          </div>
                          {commandesProduit.length === 0 ? (
                            <div style={{ textAlign:'center', padding:'16px 0', color:'var(--text-muted)', fontSize:12 }}>Aucune commande pour ce produit</div>
                          ) : (
                            <div style={{ overflowX:'auto' }}>
                              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                                <thead>
                                  <tr style={{ background:'var(--bg-surface)' }}>
                                    {['#Cmd','Date','Qté','Total','Statut'].map(h => (
                                      <th key={h} style={{ padding:'7px 10px', fontSize:10.5, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', textAlign:'left', borderBottom:'1px solid var(--border)' }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {commandesProduit.map(c => {
                                    const ligne = (c.lignes||[]).find(l => l.produit_id === p.produit_id);
                                    const cfg   = STATUT_CFG[c.statut] || STATUT_CFG.en_attente;
                                    return (
                                      <tr key={c.id} className="tr">
                                        <td style={{ padding:'7px 10px', fontWeight:700, color:'var(--text-muted)' }}>#{c.id}</td>
                                        <td style={{ padding:'7px 10px', color:'var(--text-secondary)' }}><span style={{ display:'flex', alignItems:'center', gap:4 }}><Calendar size={10}/>{new Date(c.created_at).toLocaleDateString('fr-FR')}</span></td>
                                        <td style={{ padding:'7px 10px', fontWeight:800, color:'var(--violet-light)', fontSize:14 }}>{ligne?.quantite||0}</td>
                                        <td style={{ padding:'7px 10px', fontWeight:600, color:'#10b981' }}>{Number(c.total).toLocaleString('fr-DZ')} DA</td>
                                        <td style={{ padding:'7px 10px' }}><span className="badge" style={{ background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>{cfg.label}</span></td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:12 }}>
                                {[
                                  { label:'Total livré',    value:`${totalLivre} u`,   color:'#10b981', bg:'rgba(16,185,129,.08)', border:'rgba(16,185,129,.2)' },
                                  { label:'Total en cours', value:`${totalEnCours} u`, color:'#f59e0b', bg:'rgba(245,158,11,.08)', border:'rgba(245,158,11,.2)' },
                                  { label:'Total annulé',   value:`${totalAnnule} u`,  color:'#ef4444', bg:'rgba(239,68,68,.08)',  border:'rgba(239,68,68,.2)'  },
                                ].map((s,i) => (
                                  <div key={i} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                                    <div style={{ fontSize:16, fontWeight:800, color:s.color }}>{s.value}</div>
                                    <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:1 }}>{s.label}</div>
                                  </div>
                                ))}
                              </div>
                              <div style={{ marginTop:10, padding:'10px 12px', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}>
                                <div style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>Calcul détaillé :</div>
                                <div style={{ display:'flex', flexDirection:'column', gap:4, color:'var(--text-secondary)' }}>
                                  <div>Stock actuel : <strong style={{ color:'var(--text-primary)' }}>{p.stock_actuel} u</strong></div>
                                  <div>Commandes en cours : <strong style={{ color:'#f59e0b' }}>{p.total_en_cours} u</strong></div>
                                  <div style={{ borderTop:'1px solid var(--border)', paddingTop:4 }}>
                                    Stock après livraisons : <strong style={{ color:p.stock_apres<p.stock_minimum?'#ef4444':'#10b981' }}>{p.stock_apres} u</strong>
                                    {p.stock_apres < p.stock_minimum && <span style={{ color:'#ef4444', fontSize:11 }}> sous le minimum ({p.stock_minimum}u)</span>}
                                  </div>
                                  <div>Stock minimum requis : <strong style={{ color:'#f59e0b' }}>{p.stock_minimum} u</strong></div>
                                  <div>Prévision mois prochain : <strong style={{ color:'#a855f7' }}>{p.prevision} u</strong></div>
                                  <div style={{ borderTop:'1px solid var(--border)', paddingTop:4, fontWeight:700 }}>
                                    À produire : <strong style={{ color:p.a_produire>0?'#ef4444':'#10b981', fontSize:14 }}>{p.a_produire} u</strong>
                                  </div>
                                </div>
                              </div>
                              {p.a_produire > 0 && (
                                <div style={{ marginTop:12, display:'flex', justifyContent:'flex-end' }}>
                                  <button className="btn-violet" onClick={async () => {
                                    if (!confirm(`Lancer la fabrication de ${p.a_produire} ${p.unite} de "${p.produit_nom}" ?`)) return;
                                    try {
                                      const res = await fetch('/api/fabrication', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ produit_id: p.produit_id, quantite: p.a_produire })
                                      });
                                      const data = await res.json();
                                      if (res.ok) { alert(`Ordre de fabrication créé ! Ordre #${data.ordre_id}`); window.location.href = '/production'; }
                                      else alert('Erreur : ' + (data.error || 'Inconnue'));
                                    } catch(e) { alert('Erreur réseau'); }
                                  }}>
                                    <Factory size={13}/> Lancer la fabrication — {p.a_produire} {p.unite}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ padding:'18px 22px' }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <span style={{ display:'flex', alignItems:'center', gap:5 }}><Layers size={11}/> Matières premières nécessaires</span>
                          {p.a_produire > 0 && <span style={{ fontSize:11, fontWeight:600, textTransform:'none', color:'var(--text-secondary)' }}>Pour produire {p.a_produire}u :</span>}
                        </div>
                        {mrpData && mrpData.besoins.filter(b => b.detail_par_commande.some(d => d.produit === p.produit_nom)).length > 0 ? (
                          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                            {mrpData.besoins.filter(b => b.detail_par_commande.some(d => d.produit === p.produit_nom)).map((mat, i) => (
                              <div key={i} style={{ background:mat.suffisant?'rgba(16,185,129,.06)':'rgba(239,68,68,.06)', border:`1px solid ${mat.suffisant?'rgba(16,185,129,.2)':'rgba(239,68,68,.2)'}`, borderRadius:12, padding:'12px 14px' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                                  <div style={{ fontWeight:700, fontSize:13, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:6 }}>
                                    {mat.suffisant ? <CheckCircle size={14} color="#10b981"/> : <AlertTriangle size={14} color="#ef4444"/>}
                                    {mat.matiere_titre}
                                  </div>
                                  <span className="badge" style={{ background:mat.suffisant?'rgba(16,185,129,.12)':'rgba(239,68,68,.12)', color:mat.suffisant?'#10b981':'#ef4444', border:`1px solid ${mat.suffisant?'rgba(16,185,129,.3)':'rgba(239,68,68,.3)'}` }}>
                                    {mat.suffisant ? 'Suffisant' : 'Manquant'}
                                  </span>
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:8 }}>
                                  {[
                                    { label:'Stock actuel', value:`${mat.stock_actuel} ${mat.unite}`,        color:'var(--text-primary)' },
                                    { label:'Besoin réel',  value:`${mat.quantite_besoin_reel} ${mat.unite}`, color:'#06b6d4'             },
                                    { label:'Stock net',    value:`${mat.stock_net} ${mat.unite}`,            color:mat.stock_net<0?'#ef4444':'#10b981' },
                                    { label:'À commander',  value:mat.quantite_a_commander>0?`${mat.quantite_a_commander} ${mat.unite}`:'OK', color:mat.quantite_a_commander>0?'#ef4444':'#10b981' },
                                  ].map((row, ri) => (
                                    <div key={ri} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:7, padding:'5px 9px' }}>
                                      <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:1 }}>{row.label}</div>
                                      <div style={{ fontSize:12, fontWeight:700, color:row.color }}>{row.value}</div>
                                    </div>
                                  ))}
                                </div>
                                {mat.quantite_a_commander > 0 && (
                                  <div style={{ padding:'8px 10px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8 }}>
                                    <span style={{ fontSize:11.5, color:'#ef4444', fontWeight:600 }}>Manque {mat.quantite_a_commander} {mat.unite}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)', fontSize:12 }}>
                            <Package size={28} style={{ display:'block', margin:'0 auto 8px', opacity:.3 }}/>
                            Lancez le calcul MRP (onglet MRP) pour voir les besoins matières détaillés
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'mrp' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>
                Calcul MRP intelligent — <span style={{ color:'var(--violet-light)', fontWeight:600 }}>{mrpData?.methode || 'Time-Phased + Priority-Based + Yield-Based'}</span>
              </div>
              {mrpData?.calcule_le && (
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Calculé le {new Date(mrpData.calcule_le).toLocaleString('fr-FR')}</div>
              )}
            </div>
            <button onClick={fetchMRP} className="btn-ghost" disabled={mrpLoading}>
              <RefreshCw size={13} style={mrpLoading?{animation:'spin 1s linear infinite'}:{}} />
              {mrpLoading ? 'Calcul...' : 'Recalculer'}
            </button>
          </div>

          {mrpLoading && !mrpData && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 0', color:'var(--text-muted)', gap:10, fontSize:13 }}>
              <RefreshCw size={18} style={{ animation:'spin 1s linear infinite' }} /> Calcul MRP en cours
            </div>
          )}

          {mrpData && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                {[
                  { label:'Matières analysées', value:mrpData.resume.total_matieres,      color:'#a855f7', bg:'rgba(168,85,247,.1)', border:'rgba(168,85,247,.2)' },
                  { label:'Matières OK',         value:mrpData.resume.matieres_ok,         color:'#10b981', bg:'rgba(16,185,129,.1)', border:'rgba(16,185,129,.2)' },
                  { label:'Matières manquantes', value:mrpData.resume.matieres_manquantes, color:'#ef4444', bg:'rgba(239,68,68,.1)',  border:'rgba(239,68,68,.2)'  },
                  { label:'Taux rebut moyen',    value:`${mrpData.resume.taux_rebut_moyen}%`, color:'#f59e0b', bg:'rgba(245,158,11,.1)', border:'rgba(245,158,11,.2)' },
                ].map((s,i) => (
                  <div key={i} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:12, padding:'14px 16px' }}>
                    <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:500, marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
                {[
                  { label:'Cmd faisables', value:mrpData.resume.commandes_faisables,        color:'#10b981', bg:'rgba(16,185,129,.08)', border:'rgba(16,185,129,.2)' },
                  { label:'Cmd bloquées',  value:mrpData.resume.commandes_bloquees,         color:'#ef4444', bg:'rgba(239,68,68,.08)',  border:'rgba(239,68,68,.2)'  },
                  { label:'Cmd urgentes',  value:mrpData.resume.commandes_urgentes ?? '-',  color:'#ef4444', bg:'rgba(239,68,68,.06)',  border:'rgba(239,68,68,.15)' },
                  { label:'Cmd normales',  value:mrpData.resume.commandes_normales  ?? '-', color:'#10b981', bg:'rgba(16,185,129,.06)', border:'rgba(16,185,129,.15)' },
                ].map((s,i) => (
                  <div key={i} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:12, padding:'12px 16px' }}>
                    <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:500, marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {mrpData.periodes.length > 0 && (
                <div style={{ marginBottom:24 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
                    <Clock size={11}/> Planification Time-Phased — 4 semaines
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                    {mrpData.periodes.map(per => (
                      <div key={per.semaine} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px', position:'relative', overflow:'hidden' }}>
                        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:per.semaine===1?'linear-gradient(90deg,#ef4444,#f59e0b)':per.semaine===2?'linear-gradient(90deg,#f59e0b,#a855f7)':per.semaine===3?'linear-gradient(90deg,#a855f7,#06b6d4)':'linear-gradient(90deg,#06b6d4,#10b981)' }} />
                        <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:6 }}>Semaine {per.semaine}</div>
                        <div style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', marginBottom:4 }}>{per.nb_commandes}</div>
                        <div style={{ fontSize:11, color:'var(--text-secondary)' }}>commande(s)</div>
                        <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6 }}>
                          {new Date(per.debut).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})} — {new Date(per.fin).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                        </div>
                        {per.nb_commandes > 0 && (
                          <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:3 }}>
                            {per.commandes_ids.slice(0,5).map(id => (
                              <span key={id} style={{ fontSize:10, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:4, padding:'1px 5px', color:'var(--text-muted)' }}>#{id}</span>
                            ))}
                            {per.commandes_ids.length > 5 && <span style={{ fontSize:10, color:'var(--text-muted)' }}>+{per.commandes_ids.length-5}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12, display:'flex', alignItems:'center', gap:5 }}>
                  <Package size={11}/> Besoins matières — triés par score d'urgence décroissant
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {mrpData.besoins.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)', fontSize:13 }}>
                      <CheckCircle size={32} color="#10b981" style={{ display:'block', margin:'0 auto 10px', opacity:.6 }}/>
                      Aucun besoin matière détecté — tout est en ordre
                    </div>
                  ) : mrpData.besoins.map((b, i) => {
                    const expanded      = mrpExpanded[b.matiere_id] ?? false;
                    const urgenceColor  = b.score_urgence > 10 ? '#ef4444' : b.score_urgence > 5 ? '#f59e0b' : '#10b981';
                    const urgenceBg     = b.score_urgence > 10 ? 'rgba(239,68,68,.06)' : b.score_urgence > 5 ? 'rgba(245,158,11,.06)' : 'rgba(16,185,129,.06)';
                    const urgenceBorder = b.score_urgence > 10 ? 'rgba(239,68,68,.25)' : b.score_urgence > 5 ? 'rgba(245,158,11,.25)' : 'rgba(16,185,129,.25)';
                    return (
                      <div key={b.matiere_id} style={{ background:'var(--bg-card)', border:`1px solid ${b.suffisant?'var(--border)':urgenceBorder}`, borderRadius:14, overflow:'hidden' }}>
                        <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:14, cursor:'pointer', background:b.suffisant?'var(--bg-surface)':urgenceBg }}
                          onClick={() => setMrpExpanded(prev => ({ ...prev, [b.matiere_id]: !prev[b.matiere_id] }))}>
                          <div style={{ width:28, height:28, borderRadius:'50%', background:b.suffisant?'rgba(16,185,129,.15)':urgenceBg, border:`1px solid ${urgenceBorder}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:urgenceColor, flexShrink:0 }}>{i+1}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)', marginBottom:2 }}>{b.matiere_titre}</div>
                            <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                              {b.commandes_ids.length} commande(s)
                              {b.taux_rebut_moyen > 0 && <span style={{ color:'#f59e0b', marginLeft:8 }}>Rebut: {b.taux_rebut_moyen}%</span>}
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:10, alignItems:'center', flexShrink:0 }}>
                            <div style={{ textAlign:'center', minWidth:70 }}>
                              <div style={{ fontSize:10, color:'var(--text-muted)' }}>Stock</div>
                              <div style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)' }}>{b.stock_actuel} <span style={{ fontSize:10 }}>{b.unite}</span></div>
                            </div>
                            <div style={{ textAlign:'center', minWidth:80 }}>
                              <div style={{ fontSize:10, color:'var(--text-muted)' }}>Besoin réel</div>
                              <div style={{ fontSize:14, fontWeight:800, color:'#06b6d4' }}>{b.quantite_besoin_reel} <span style={{ fontSize:10 }}>{b.unite}</span></div>
                            </div>
                            <div style={{ textAlign:'center', minWidth:80 }}>
                              <div style={{ fontSize:10, color:'var(--text-muted)' }}>À commander</div>
                              <div style={{ fontSize:16, fontWeight:800, color:b.quantite_a_commander>0?urgenceColor:'#10b981' }}>
                                {b.quantite_a_commander > 0 ? `${b.quantite_a_commander} ${b.unite}` : 'OK'}
                              </div>
                            </div>
                            <div style={{ textAlign:'center', minWidth:70 }}>
                              <div style={{ fontSize:10, color:'var(--text-muted)' }}>Score urgence</div>
                              <div style={{ fontSize:16, fontWeight:800, color:urgenceColor }}>{b.score_urgence}</div>
                            </div>
                            {b.quantite_a_commander > 0 && (
                              <button className="btn-orange" onClick={e => { e.stopPropagation(); demanderAppro(b.matiere_id, b.quantite_a_commander, b.matiere_titre); }}>
                                <Send size={11}/> Commander
                              </button>
                            )}
                            <div style={{ color:'var(--text-muted)', flexShrink:0 }}>{expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</div>
                          </div>
                        </div>
                        {expanded && (
                          <div style={{ padding:'14px 18px', borderTop:'1px solid var(--border)', background:'var(--bg-surface)' }}>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                              <div>
                                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Détail stock et besoin</div>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                                  {[
                                    { label:'Stock actuel',          value:`${b.stock_actuel} ${b.unite}`,        color:'var(--text-primary)' },
                                    { label:'Stock minimum',         value:`${b.stock_minimum} ${b.unite}`,        color:'#f59e0b'             },
                                    { label:'Stock sécurité',        value:`${b.stock_securite} ${b.unite}`,       color:'#a855f7'             },
                                    { label:'Stock net',             value:`${b.stock_net} ${b.unite}`,            color:b.stock_net<0?'#ef4444':'#10b981' },
                                    { label:'Besoin brut',           value:`${b.quantite_besoin_brut} ${b.unite}`, color:'#06b6d4'             },
                                    { label:'Besoin réel (+rebut)',  value:`${b.quantite_besoin_reel} ${b.unite}`, color:'#ec4899'             },
                                  ].map((row, ri) => (
                                    <div key={ri} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:7, padding:'6px 10px' }}>
                                      <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:1 }}>{row.label}</div>
                                      <div style={{ fontSize:12, fontWeight:700, color:row.color }}>{row.value}</div>
                                    </div>
                                  ))}
                                </div>
                                {b.taux_rebut_moyen > 0 && (
                                  <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)', borderRadius:8, fontSize:11, color:'var(--text-secondary)' }}>
                                    <strong style={{ color:'#f59e0b' }}>Yield-Based :</strong> Besoin brut {b.quantite_besoin_brut} / (1 - {b.taux_rebut_moyen}%) = Besoin réel {b.quantite_besoin_reel} {b.unite}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Détail par commande (Priority-Based)</div>
                                <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:240, overflowY:'auto' }}>
                                  {b.detail_par_commande.map((d, di) => {
                                    const pCfg = PRIORITE_CFG[d.priorite] || PRIORITE_CFG[1];
                                    return (
                                      <div key={di} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, fontSize:11 }}>
                                        <span style={{ fontWeight:700, color:'var(--text-muted)', minWidth:40 }}>#{d.commande_id}</span>
                                        <span style={{ flex:1, color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.produit}</span>
                                        <span style={{ fontWeight:700, color:'#06b6d4', minWidth:60, textAlign:'right' }}>{d.quantite_mp.toFixed(1)} {b.unite}</span>
                                        <span style={{ fontSize:10, background:pCfg.bg, color:pCfg.color, borderRadius:4, padding:'1px 5px', fontWeight:600, flexShrink:0 }}>{pCfg.label}</span>
                                        <span style={{ fontSize:10, color:'var(--text-muted)', flexShrink:0 }}>S{d.semaine}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {mrpData.faisabilite_commandes.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12, display:'flex', alignItems:'center', gap:5 }}>
                    <CheckCircle size={11}/> Faisabilité par commande
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {mrpData.faisabilite_commandes.map(f => {
                      const pCfg = PRIORITE_CFG[f.priorite] || PRIORITE_CFG[1];
                      const sCfg = STATUT_CFG[f.statut]     || STATUT_CFG.en_attente;
                      return (
                        <div key={f.commande_id} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 16px', background:'var(--bg-card)', border:`1px solid ${f.faisable?'rgba(16,185,129,.2)':'rgba(239,68,68,.2)'}`, borderRadius:12 }}>
                          <div style={{ width:28, height:28, borderRadius:'50%', background:f.faisable?'rgba(16,185,129,.15)':'rgba(239,68,68,.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            {f.faisable ? <CheckCircle size={14} color="#10b981"/> : <AlertTriangle size={14} color="#ef4444"/>}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:f.matieres_manquantes.length>0?8:0 }}>
                              <span style={{ fontWeight:700, color:'var(--text-primary)', fontSize:13 }}>Commande #{f.commande_id}</span>
                              <span className="badge" style={{ background:sCfg.bg, color:sCfg.color, border:`1px solid ${sCfg.border}` }}>{sCfg.label}</span>
                              <span style={{ fontSize:11, background:pCfg.bg, color:pCfg.color, borderRadius:6, padding:'2px 8px', fontWeight:700 }}>{pCfg.label}</span>
                              <span style={{ fontSize:12, fontWeight:700, color:f.faisable?'#10b981':'#ef4444', marginLeft:'auto' }}>
                                {f.faisable ? 'Faisable' : `Bloquée (${f.matieres_manquantes.length} matière(s))`}
                              </span>
                            </div>
                            {f.matieres_manquantes.length > 0 && (
                              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                                {f.matieres_manquantes.map((mm, mi) => (
                                  <div key={mi} style={{ fontSize:11, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:6, padding:'3px 8px', color:'#ef4444' }}>
                                    {mm.matiere} — manque <strong>{mm.manque}</strong> u
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}