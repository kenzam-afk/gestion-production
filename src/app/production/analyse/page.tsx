"use client";

import { useEffect, useState } from "react";
import {
  Factory, RefreshCw, AlertTriangle, CheckCircle,
  Layers, TrendingUp, TrendingDown, Minus, ShoppingCart,
  ArrowLeft, Send, Calendar, BarChart2,
} from "lucide-react";
import Link from "next/link";

interface LigneCommande { produit_id: number; produit_nom: string; quantite: number; prix_unitaire: number; }
interface Commande {
  id: number; statut: string; total: number; created_at: string;
  client_nom: string; client_prenom: string; client_titre: string; type_client: string;
  lignes: LigneCommande[];
}
interface Produit {
  id: number; nom: string; stock_disponible: number; stock_minimum: number; prix_vente: number;
  matieres: { matiere_id: number; titre: string; quantite_necessaire: number; unite: string; stock_actuel: number }[];
}
interface Matiere { id: number; titre: string; unite: string; stock_actuel: number; stock_minimum: number; }
interface Fournisseur { id: number; nom: string; }

const STATUT_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  en_attente:    { label:'En attente',    color:'#f59e0b', bg:'rgba(245,158,11,.1)',  border:'rgba(245,158,11,.25)' },
  confirmee:     { label:'Confirmée',     color:'#a855f7', bg:'rgba(168,85,247,.1)',  border:'rgba(168,85,247,.25)' },
  en_fabrication:{ label:'Fabrication',   color:'#ec4899', bg:'rgba(236,72,153,.1)',  border:'rgba(236,72,153,.25)' },
  pret_livraison:{ label:'Prêt livraison',color:'#06b6d4', bg:'rgba(6,182,212,.1)',   border:'rgba(6,182,212,.25)'  },
  livree:        { label:'Livrée',        color:'#10b981', bg:'rgba(16,185,129,.1)',  border:'rgba(16,185,129,.25)' },
  annulee:       { label:'Annulée',       color:'#ef4444', bg:'rgba(239,68,68,.1)',   border:'rgba(239,68,68,.25)'  },
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
`;

export default function ProductionAnalysePage() {
  const [commandes,    setCommandes]    = useState<Commande[]>([]);
  const [produits,     setProduits]     = useState<Produit[]>([]);
  const [matieres,     setMatieres]     = useState<Matiere[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading,      setLoading]      = useState(true);

  async function fetchAll() {
    setLoading(true);
    try {
      const [c, p, m, f] = await Promise.all([
        fetch('/api/commandes').then(r => r.json()),
        fetch('/api/produits').then(r => r.json()),
        fetch('/api/matieres-premieres').then(r => r.json()),
        fetch('/api/fournisseurs').then(r => r.json()),
      ]);
      setCommandes(Array.isArray(c) ? c : []);
      setProduits(Array.isArray(p) ? p : []);
      setMatieres(Array.isArray(m) ? m : []);
      setFournisseurs(Array.isArray(f) ? f : []);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  async function demanderAppro(matiereId: number, quantite: number, titreMat: string) {
    const fournisseur = fournisseurs[0];
    if (!fournisseur) { alert('Aucun fournisseur disponible !'); return; }

    const qteFinale  = Math.ceil(Number(quantite));
    const matIdFinal = Number(matiereId);

    if (isNaN(matIdFinal) || isNaN(qteFinale) || qteFinale <= 0) {
      alert('Données invalides — impossible d\'envoyer la demande');
      return;
    }

    if (!confirm(`Envoyer une demande à ${fournisseur.nom} pour ${qteFinale} ${titreMat} ?`)) return;

    try {
      const body = {
        matiere_id:     matIdFinal,
        quantite:       qteFinale,
        fournisseur_id: Number(fournisseur.id),
      };
      const res  = await fetch('/api/fournisseurs/demande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) { alert(`✅ Demande envoyée à ${fournisseur.nom} !`); }
      else        { alert('Erreur : ' + (data.error || 'Inconnue')); }
    } catch(e) {
      console.error(e);
      alert('Erreur lors de l\'envoi');
    }
  }

  const now     = new Date();
  const debutM0 = new Date(now.getFullYear(), now.getMonth(),     1);
  const debutM1 = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const debutM2 = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const debutM3 = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  function ventesParProduitEtPeriode(produitId: number, debut: Date, fin: Date) {
    return commandes
      .filter(c => c.statut !== 'annulee' && new Date(c.created_at) >= debut && new Date(c.created_at) < fin)
      .flatMap(c => c.lignes || [])
      .filter(l => l.produit_id === produitId)
      .reduce((acc, l) => acc + Number(l.quantite), 0);
  }

  const produitsTriés = [...produits].sort((a, b) => {
    const va = ventesParProduitEtPeriode(a.id, debutM3, now);
    const vb = ventesParProduitEtPeriode(b.id, debutM3, now);
    return vb - va;
  });

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', fontFamily:"'Outfit',sans-serif", color:'var(--text-muted)' }}>
      <RefreshCw size={24} style={{ animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", padding:'28px 32px', maxWidth:1600 }}>
      <style>{DS}</style>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          {/* ✅ Lien retour vers /production (plus /admin/fabrication) */}
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
          <p style={{ fontSize:12.5, color:'var(--text-muted)', marginTop:3 }}>Tendances · Historique · Besoins matières · Commander au fournisseur</p>
        </div>
        <button onClick={fetchAll} className="btn-ghost"><RefreshCw size={13}/> Actualiser</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:28 }}>
        {[
          { label:'Produits analysés',    value:produits.length,    color:'#a855f7', bg:'rgba(168,85,247,.1)', border:'rgba(168,85,247,.2)' },
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

      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        {produitsTriés.map((p, rang) => {
          const vm0 = ventesParProduitEtPeriode(p.id, debutM0, now);
          const vm1 = ventesParProduitEtPeriode(p.id, debutM1, debutM0);
          const vm2 = ventesParProduitEtPeriode(p.id, debutM2, debutM1);
          const vm3 = ventesParProduitEtPeriode(p.id, debutM3, debutM2);
          const moy3mois       = Math.round((vm1 + vm2 + vm3) / 3);
          const tendance       = vm1 > vm2 * 1.15 ? 'hausse' : vm1 < vm2 * 0.85 ? 'baisse' : 'stable';
          const coeff          = tendance==='hausse'?1.2:tendance==='baisse'?0.9:1.0;
          const prevision_mois = Math.round(moy3mois * coeff);

          const commandesProduit = commandes
            .filter(c => (c.lignes||[]).some(l => l.produit_id === p.id))
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

          const totalLivre   = commandesProduit.filter(c=>c.statut==='livree').flatMap(c=>c.lignes).filter(l=>l.produit_id===p.id).reduce((acc,l)=>acc+Number(l.quantite),0);
          const totalEnCours = commandesProduit.filter(c=>['en_attente','confirmee','en_fabrication','pret_livraison'].includes(c.statut)).flatMap(c=>c.lignes).filter(l=>l.produit_id===p.id).reduce((acc,l)=>acc+Number(l.quantite),0);
          const totalAnnule  = commandesProduit.filter(c=>c.statut==='annulee').flatMap(c=>c.lignes).filter(l=>l.produit_id===p.id).reduce((acc,l)=>acc+Number(l.quantite),0);

          const stock_apres = p.stock_disponible - totalEnCours;
          const a_produire  = Math.max(0, prevision_mois + p.stock_minimum - Math.max(0, stock_apres));

          const matieresProduit = (p.matieres||[]).map(mat => {
            const qte_requise  = Number(mat.quantite_necessaire) * a_produire;
            const qte_reservee = Number(mat.quantite_necessaire) * totalEnCours;
            const stock_reel   = Number(mat.stock_actuel) - qte_reservee;
            const manque       = Math.max(0, qte_requise - Number(mat.stock_actuel));
            const suffisant    = Number(mat.stock_actuel) >= qte_requise + qte_reservee;
            return { ...mat, qte_requise, qte_reservee, stock_reel, manque, suffisant };
          });

          const matOK       = matieresProduit.every(m => m.suffisant);
          const matManquant = matieresProduit.filter(m => !m.suffisant);
          const moisLabels  = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
          const moisActuel  = now.getMonth();

          return (
            <div key={p.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:18, overflow:'hidden' }}>
              <div style={{ height:3, background:rang===0?'linear-gradient(90deg,#f59e0b,#ef4444)':rang===1?'linear-gradient(90deg,#a855f7,#ec4899)':'linear-gradient(90deg,#7c3aed,#06b6d4)' }} />

              <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)', background:'var(--bg-surface)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:rang===0?'linear-gradient(135deg,#f59e0b,#ef4444)':rang===1?'rgba(168,85,247,.2)':'var(--bg-card)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:rang<2?(rang===0?'#f59e0b':'#a855f7'):'var(--text-muted)', flexShrink:0 }}>{rang+1}</div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:16, color:'var(--text-primary)' }}>{p.nom}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:10, marginTop:2 }}>
                      <span>Stock: <strong style={{ color:'var(--text-primary)' }}>{p.stock_disponible}</strong> u (min: {p.stock_minimum})</span>
                      <span>·</span>
                      <span>Moy. 3 mois: <strong style={{ color:'var(--text-primary)' }}>{moy3mois}</strong> u/mois</span>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, background:tendance==='hausse'?'rgba(16,185,129,.1)':tendance==='baisse'?'rgba(239,68,68,.1)':'rgba(245,158,11,.1)', border:`1px solid ${tendance==='hausse'?'rgba(16,185,129,.3)':tendance==='baisse'?'rgba(239,68,68,.3)':'rgba(245,158,11,.3)'}`, borderRadius:10, padding:'6px 12px' }}>
                    {tendance==='hausse'?<TrendingUp size={14} color="#10b981"/>:tendance==='baisse'?<TrendingDown size={14} color="#ef4444"/>:<Minus size={14} color="#f59e0b"/>}
                    <span style={{ fontSize:12, fontWeight:700, color:tendance==='hausse'?'#10b981':tendance==='baisse'?'#ef4444':'#f59e0b' }}>
                      {tendance==='hausse'?'En hausse':tendance==='baisse'?'En baisse':'Stable'}
                    </span>
                  </div>
                  <div style={{ background:'rgba(124,58,237,.1)', border:'1px solid rgba(124,58,237,.2)', borderRadius:10, padding:'6px 14px', textAlign:'center' }}>
                    <div style={{ fontSize:10, color:'var(--text-muted)' }}>Prévision mois prochain</div>
                    <div style={{ fontSize:18, fontWeight:800, color:'var(--violet-light)' }}>{prevision_mois} <span style={{ fontSize:11, fontWeight:400 }}>u</span></div>
                  </div>
                  <div style={{ background:a_produire>0?'rgba(239,68,68,.1)':'rgba(16,185,129,.1)', border:`1px solid ${a_produire>0?'rgba(239,68,68,.3)':'rgba(16,185,129,.3)'}`, borderRadius:10, padding:'6px 14px', textAlign:'center' }}>
                    <div style={{ fontSize:10, color:'var(--text-muted)' }}>À produire</div>
                    <div style={{ fontSize:18, fontWeight:800, color:a_produire>0?'#ef4444':'#10b981' }}>{a_produire>0?`${a_produire} u`:'✓ OK'}</div>
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
                        { val:vm3, mois:moisLabels[(moisActuel-3+12)%12],  color:'rgba(255,255,255,.15)' },
                        { val:vm2, mois:moisLabels[(moisActuel-2+12)%12],  color:'rgba(6,182,212,.5)'    },
                        { val:vm1, mois:moisLabels[(moisActuel-1+12)%12],  color:'#a855f7'               },
                        { val:vm0, mois:moisLabels[moisActuel]+' (cours)', color:'#ec4899'               },
                      ].map((bar, i) => {
                        const max = Math.max(vm0, vm1, vm2, vm3, 1);
                        return (
                          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                            <div style={{ fontSize:10, fontWeight:700, color:'var(--text-secondary)' }}>{bar.val}u</div>
                            <div style={{ width:'100%', height:Math.max(4,(bar.val/max)*44), background:bar.color, borderRadius:'4px 4px 0 0', minHeight:4 }} />
                            <div style={{ fontSize:9.5, color:'var(--text-muted)', textAlign:'center', lineHeight:1.2 }}>{bar.mois}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(124,58,237,.06)', border:'1px solid rgba(124,58,237,.15)', borderRadius:8, fontSize:11, color:'var(--text-secondary)' }}>
                      <strong style={{ color:'var(--violet-light)' }}>Calcul tendance :</strong> {moisLabels[(moisActuel-1+12)%12]} ({vm1}u) vs {moisLabels[(moisActuel-2+12)%12]} ({vm2}u) → {vm2>0?`${Math.round(((vm1-vm2)/vm2)*100)}%`:'N/A'} {tendance==='hausse'?'↑ hausse':tendance==='baisse'?'↓ baisse':'→ stable'}<br/>
                      <strong style={{ color:'var(--violet-light)' }}>Prévision :</strong> Moy({vm1}+{vm2}+{vm3})÷3 × coeff({coeff}) = {prevision_mois}u
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
                              const ligne = (c.lignes||[]).find(l => l.produit_id === p.id);
                              const cfg   = STATUT_CFG[c.statut] || STATUT_CFG.en_attente;
                              return (
                                <tr key={c.id} className="tr">
                                  <td style={{ padding:'7px 10px', fontWeight:700, color:'var(--text-muted)' }}>#{c.id}</td>
                                  <td style={{ padding:'7px 10px', color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:4 }}><Calendar size={10}/>{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
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
                          <div style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>📊 Calcul détaillé :</div>
                          <div style={{ display:'flex', flexDirection:'column', gap:4, color:'var(--text-secondary)' }}>
                            <div>Stock actuel : <strong style={{ color:'var(--text-primary)' }}>{p.stock_disponible} u</strong></div>
                            <div>− Commandes en cours : <strong style={{ color:'#f59e0b' }}>{totalEnCours} u</strong></div>
                            <div style={{ borderTop:'1px solid var(--border)', paddingTop:4 }}>
                              = Stock après livraisons : <strong style={{ color:stock_apres<p.stock_minimum?'#ef4444':'#10b981' }}>{stock_apres} u</strong>
                              {stock_apres < p.stock_minimum && <span style={{ color:'#ef4444', fontSize:11 }}> ⚠ sous le minimum ({p.stock_minimum}u)</span>}
                            </div>
                            <div>+ Stock minimum requis : <strong style={{ color:'#f59e0b' }}>{p.stock_minimum} u</strong></div>
                            <div>− Prévision mois prochain : <strong style={{ color:'#a855f7' }}>{prevision_mois} u</strong></div>
                            <div style={{ borderTop:'1px solid var(--border)', paddingTop:4, fontWeight:700 }}>
                              = À produire : <strong style={{ color:a_produire>0?'#ef4444':'#10b981', fontSize:14 }}>{a_produire} u</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ padding:'18px 22px' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:5 }}><Layers size={11}/> Matières premières nécessaires</span>
                    {a_produire > 0 && <span style={{ fontSize:11, color:matOK?'#10b981':'#ef4444', fontWeight:600, textTransform:'none' }}>Pour produire {a_produire}u :</span>}
                  </div>
                  {matieresProduit.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'24px 0', color:'#f59e0b', fontSize:12 }}>
                      <AlertTriangle size={24} style={{ display:'block', margin:'0 auto 8px', opacity:.5 }}/>Nomenclature non définie
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {matieresProduit.map((mat, i) => (
                        <div key={i} style={{ background:mat.suffisant?'rgba(16,185,129,.06)':'rgba(239,68,68,.06)', border:`1px solid ${mat.suffisant?'rgba(16,185,129,.2)':'rgba(239,68,68,.2)'}`, borderRadius:12, padding:'12px 14px' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                            <div style={{ fontWeight:700, fontSize:13, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:6 }}>
                              {mat.suffisant ? <CheckCircle size={14} color="#10b981"/> : <AlertTriangle size={14} color="#ef4444"/>}
                              {mat.titre}
                            </div>
                            <span className="badge" style={{ background:mat.suffisant?'rgba(16,185,129,.12)':'rgba(239,68,68,.12)', color:mat.suffisant?'#10b981':'#ef4444', border:`1px solid ${mat.suffisant?'rgba(16,185,129,.3)':'rgba(239,68,68,.3)'}` }}>
                              {mat.suffisant ? '✓ Suffisant' : '⚠ Manquant'}
                            </span>
                          </div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
                            {[
                              { label:'Stock total',              value:`${Number(mat.stock_actuel).toFixed(1)} ${mat.unite}`, color:'var(--text-primary)' },
                              { label:'Réservé (en cours)',       value:`${mat.qte_reservee.toFixed(1)} ${mat.unite}`,          color:'#a855f7'            },
                              { label:`Requis (×${a_produire}u)`, value:`${mat.qte_requise.toFixed(1)} ${mat.unite}`,           color:'#06b6d4'            },
                              { label:'Stock disponible réel',    value:`${mat.stock_reel.toFixed(1)} ${mat.unite}`,            color:mat.stock_reel<0?'#ef4444':'#10b981' },
                            ].map((row, ri) => (
                              <div key={ri} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:7, padding:'5px 9px' }}>
                                <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:1 }}>{row.label}</div>
                                <div style={{ fontSize:12, fontWeight:700, color:row.color }}>{row.value}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginBottom:8 }}>
                            <div style={{ height:8, background:'var(--border)', borderRadius:4, overflow:'hidden', position:'relative' }}>
                              <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${Math.min(100,(Number(mat.stock_actuel)/Math.max(Number(mat.stock_actuel),mat.qte_requise+mat.qte_reservee,1))*100)}%`, background:'rgba(124,58,237,.25)', borderRadius:4 }} />
                              <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${Math.min(100,(mat.qte_reservee/Math.max(Number(mat.stock_actuel),1))*100)}%`, background:'#a855f7', borderRadius:4 }} />
                              {mat.qte_requise > 0 && <div style={{ position:'absolute', left:`${Math.min(100,(mat.qte_reservee/Math.max(Number(mat.stock_actuel),1))*100)}%`, top:0, height:'100%', width:`${Math.min(100-((mat.qte_reservee/Math.max(Number(mat.stock_actuel),1))*100),(mat.qte_requise/Math.max(Number(mat.stock_actuel),1))*100)}%`, background:mat.suffisant?'#10b981':'#ef4444', borderRadius:4 }} />}
                            </div>
                            <div style={{ display:'flex', gap:10, marginTop:4, fontSize:10 }}>
                              <span style={{ color:'#a855f7' }}>■ Réservé</span>
                              <span style={{ color:mat.suffisant?'#10b981':'#ef4444' }}>■ Requis prod.</span>
                              <span style={{ color:'rgba(124,58,237,.4)' }}>■ Disponible</span>
                            </div>
                          </div>
                          <div style={{ padding:'8px 10px', background:'var(--bg-surface)', borderRadius:7, fontSize:11, color:'var(--text-secondary)', marginBottom:mat.manque>0?8:0 }}>
                            Stock ({mat.stock_actuel}) − Réservé ({mat.qte_reservee.toFixed(1)}) = Dispo réel ({mat.stock_reel.toFixed(1)})
                            {mat.qte_requise>0?` | Requis: ${mat.qte_requise.toFixed(1)}`:''}
                            {mat.manque > 0 && <span style={{ color:'#ef4444', fontWeight:600 }}> → Manque: {mat.manque.toFixed(1)} {mat.unite}</span>}
                          </div>
                          {mat.manque > 0 && (
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8 }}>
                              <span style={{ fontSize:11.5, color:'#ef4444', fontWeight:600 }}>
                                ⚠ Manque {mat.manque.toFixed(1)} {mat.unite} — La fabrication sera bloquée !
                              </span>
                              <button className="btn-orange" onClick={() => demanderAppro(
                                Number(mat.matiere_id),
                                Number(mat.manque) + Number(mat.quantite_necessaire),
                                mat.titre
                              )}>
                                <Send size={11}/> Commander au fournisseur
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      <div style={{ padding:'12px 14px', background:matOK?'rgba(16,185,129,.08)':'rgba(239,68,68,.08)', border:`1px solid ${matOK?'rgba(16,185,129,.25)':'rgba(239,68,68,.25)'}`, borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ fontSize:13, fontWeight:700, color:matOK?'#10b981':'#ef4444' }}>
                          {matOK
                            ? `✓ Toutes les matières disponibles — ${a_produire>0?`Lancer la production de ${a_produire}u`:'Aucune production nécessaire'}`
                            : `⚠ ${matManquant.length} matière(s) manquante(s) — Commander avant de lancer`}
                        </div>
                        {/* ✅ Lien vers /production (plus /admin/fabrication) */}
                        {a_produire > 0 && matOK && (
                          <Link href="/production">
                            <button className="btn-violet"><Factory size={12}/> Voir les ordres</button>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}