"use client";

import { useEffect, useState } from "react";
import {
  BarChart2, TrendingUp, TrendingDown, ShoppingCart,
  Package, Truck, Layers, RefreshCw, Award, DollarSign,
  CheckCircle, Clock, Factory, AlertTriangle,
} from "lucide-react";

interface Stats {
  // Commandes
  total_commandes: number;
  commandes_ce_mois: number;
  commandes_en_cours: number;
  commandes_livrees: number;
  commandes_annulees: number;
  ca_total: number;
  ca_ce_mois: number;
  ca_mois_dernier: number;
  taux_livraison: number;
  // Produits
  top_produits: { nom: string; total_vendu: number; ca: number }[];
  // Stock
  total_produits: number;
  produits_en_rupture: number;
  produits_stock_bas: number;
  // Matières
  total_matieres: number;
  matieres_critiques: number;
  // Fabrication
  ordres_actifs: number;
  ordres_termines: number;
  // Livraisons
  livraisons_total: number;
  livraisons_en_attente: number;
  livraisons_effectuees: number;
}

const DS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.kpi-card{border-radius:16px;padding:20px 22px;animation:fadeIn .4s ease forwards}
.section-card{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:20px}
.bar{height:8px;border-radius:4px;background:var(--border);overflow:hidden;margin-top:8px}
.bar-fill{height:100%;border-radius:4px;transition:width .6s ease}
`;

export default function RapportsPage() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    setLoading(true);
    try {
      const [commandesRes, produitsRes, matieresRes, fabricationRes, livraisonsRes] = await Promise.all([
        fetch('/api/commandes').then(r => r.json()),
        fetch('/api/produits').then(r => r.json()),
        fetch('/api/matieres-premieres').then(r => r.json()),
        fetch('/api/fabrication').then(r => r.json()),
        fetch('/api/livraisons').then(r => r.json()),
      ]);

      const commandes  = Array.isArray(commandesRes)  ? commandesRes  : [];
      const produits   = Array.isArray(produitsRes)   ? produitsRes   : [];
      const matieres   = Array.isArray(matieresRes)   ? matieresRes   : [];
      const fabrication= Array.isArray(fabricationRes)? fabricationRes: [];
      const livraisons = Array.isArray(livraisonsRes) ? livraisonsRes : [];

      const now        = new Date();
      const debutMois  = new Date(now.getFullYear(), now.getMonth(), 1);
      const debutMoisD = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const cmdMois     = commandes.filter((c: any) => new Date(c.created_at) >= debutMois && c.statut !== 'annulee');
      const cmdMoisD    = commandes.filter((c: any) => new Date(c.created_at) >= debutMoisD && new Date(c.created_at) < debutMois && c.statut !== 'annulee');
      const cmdLivrees  = commandes.filter((c: any) => c.statut === 'livree');
      const cmdEnCours  = commandes.filter((c: any) => ['en_attente','confirmee','en_fabrication','pret_livraison'].includes(c.statut));
      const cmdAnnulees = commandes.filter((c: any) => c.statut === 'annulee');

      const ca_total      = commandes.filter((c: any) => c.statut !== 'annulee').reduce((acc: number, c: any) => acc + Number(c.total), 0);
      const ca_ce_mois    = cmdMois.reduce((acc: number, c: any) => acc + Number(c.total), 0);
      const ca_mois_dernier = cmdMoisD.reduce((acc: number, c: any) => acc + Number(c.total), 0);
      const taux_livraison = commandes.length > 0 ? Math.round((cmdLivrees.length / commandes.filter((c:any) => c.statut !== 'annulee').length) * 100) : 0;

      // Top produits
      const produitMap: Record<string, { nom: string; total_vendu: number; ca: number }> = {};
      commandes.filter((c: any) => c.statut !== 'annulee').forEach((c: any) => {
        (c.lignes || []).forEach((l: any) => {
          if (!produitMap[l.produit_id]) produitMap[l.produit_id] = { nom: l.produit_nom, total_vendu: 0, ca: 0 };
          produitMap[l.produit_id].total_vendu += Number(l.quantite);
          produitMap[l.produit_id].ca += Number(l.quantite) * Number(l.prix_unitaire);
        });
      });
      const top_produits = Object.values(produitMap).sort((a, b) => b.total_vendu - a.total_vendu).slice(0, 5);

      // Mois glissants pour graphique
      const moisLabels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

      setStats({
        total_commandes:      commandes.length,
        commandes_ce_mois:    cmdMois.length,
        commandes_en_cours:   cmdEnCours.length,
        commandes_livrees:    cmdLivrees.length,
        commandes_annulees:   cmdAnnulees.length,
        ca_total,
        ca_ce_mois,
        ca_mois_dernier,
        taux_livraison,
        top_produits,
        total_produits:       produits.length,
        produits_en_rupture:  produits.filter((p: any) => p.stock_disponible === 0).length,
        produits_stock_bas:   produits.filter((p: any) => p.stock_disponible > 0 && p.stock_disponible <= p.stock_minimum).length,
        total_matieres:       matieres.length,
        matieres_critiques:   matieres.filter((m: any) => Number(m.stock_actuel) <= Number(m.stock_minimum)).length,
        ordres_actifs:        fabrication.filter((o: any) => o.statut !== 'termine').length,
        ordres_termines:      fabrication.filter((o: any) => o.statut === 'termine').length,
        livraisons_total:     livraisons.length,
        livraisons_en_attente:livraisons.filter((l: any) => l.statut === 'en_attente').length,
        livraisons_effectuees:livraisons.filter((l: any) => l.statut === 'livree').length,
      });
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { fetchStats(); }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', fontFamily:"'Outfit',sans-serif", color:'var(--text-muted)' }}>
      <RefreshCw size={24} style={{ animation:'spin 1s linear infinite', marginRight:10 }} />
      Chargement des rapports...
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!stats) return null;

  const caTendance = stats.ca_mois_dernier > 0
    ? Math.round(((stats.ca_ce_mois - stats.ca_mois_dernier) / stats.ca_mois_dernier) * 100)
    : 0;

  const maxVentes = Math.max(...stats.top_produits.map(p => p.total_vendu), 1);

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", padding:'28px 32px', maxWidth:1300 }}>
      <style>{DS}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:10.5, fontWeight:700, color:'#a855f7', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Tableau de bord</div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', margin:0, letterSpacing:'-0.02em', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, background:'linear-gradient(135deg,#a855f7,#06b6d4)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px rgba(168,85,247,.4)' }}>
              <BarChart2 size={18} color="white" />
            </div>
            Rapports & Statistiques
          </h1>
          <p style={{ fontSize:12.5, color:'var(--text-muted)', marginTop:3 }}>Vue synthétique de toute l'activité de la plateforme</p>
        </div>
        <button onClick={fetchStats} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'transparent', border:'1px solid var(--border)', color:'var(--text-secondary)', borderRadius:9, padding:'8px 16px', fontWeight:500, cursor:'pointer', fontFamily:"'Outfit',sans-serif", fontSize:13 }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* ── KPIs PRINCIPAUX ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        {/* CA Total */}
        <div className="kpi-card" style={{ background:'linear-gradient(135deg,rgba(124,58,237,.15),rgba(236,72,153,.1))', border:'1px solid rgba(124,58,237,.25)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>CA Total</div>
            <DollarSign size={16} color="#a855f7" />
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', marginBottom:4 }}>
            {stats.ca_total.toLocaleString('fr-DZ')} DA
          </div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>Toutes commandes confondues</div>
        </div>

        {/* CA Ce Mois */}
        <div className="kpi-card" style={{ background: caTendance >= 0 ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)', border:`1px solid ${caTendance >= 0 ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)'}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>CA Ce Mois</div>
            {caTendance >= 0 ? <TrendingUp size={16} color="#10b981" /> : <TrendingDown size={16} color="#ef4444" />}
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', marginBottom:4 }}>
            {stats.ca_ce_mois.toLocaleString('fr-DZ')} DA
          </div>
          <div style={{ fontSize:11, color: caTendance >= 0 ? '#10b981' : '#ef4444', fontWeight:600 }}>
            {caTendance >= 0 ? '+' : ''}{caTendance}% vs mois dernier
          </div>
        </div>

        {/* Commandes */}
        <div className="kpi-card" style={{ background:'rgba(6,182,212,.08)', border:'1px solid rgba(6,182,212,.2)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Commandes</div>
            <ShoppingCart size={16} color="#06b6d4" />
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', marginBottom:4 }}>
            {stats.total_commandes}
          </div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>
            <span style={{ color:'#06b6d4', fontWeight:600 }}>{stats.commandes_ce_mois}</span> ce mois · <span style={{ color:'#f59e0b', fontWeight:600 }}>{stats.commandes_en_cours}</span> en cours
          </div>
        </div>

        {/* Taux livraison */}
        <div className="kpi-card" style={{ background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Taux livraison</div>
            <Truck size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', marginBottom:4 }}>
            {stats.taux_livraison}%
          </div>
          <div className="bar">
            <div className="bar-fill" style={{ width:`${stats.taux_livraison}%`, background: stats.taux_livraison >= 70 ? '#10b981' : stats.taux_livraison >= 40 ? '#f59e0b' : '#ef4444' }} />
          </div>
        </div>
      </div>

      {/* ── LIGNE 2 : COMMANDES + TOP PRODUITS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>

        {/* Répartition commandes */}
        <div className="section-card">
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
            <ShoppingCart size={15} color="#a855f7" />
            <div style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)' }}>Répartition des commandes</div>
          </div>
          <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { label:'Livrées',        value:stats.commandes_livrees,  color:'#10b981', pct: Math.round((stats.commandes_livrees / Math.max(stats.total_commandes,1)) * 100) },
              { label:'En cours',       value:stats.commandes_en_cours, color:'#f59e0b', pct: Math.round((stats.commandes_en_cours / Math.max(stats.total_commandes,1)) * 100) },
              { label:'Annulées',       value:stats.commandes_annulees, color:'#ef4444', pct: Math.round((stats.commandes_annulees / Math.max(stats.total_commandes,1)) * 100) },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:13, color:'var(--text-secondary)', fontWeight:500 }}>{s.label}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{s.value}</span>
                    <span style={{ fontSize:11, color:s.color, fontWeight:600 }}>{s.pct}%</span>
                  </div>
                </div>
                <div className="bar">
                  <div className="bar-fill" style={{ width:`${s.pct}%`, background:s.color }} />
                </div>
              </div>
            ))}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:8 }}>
              {[
                { label:'Total',    value:stats.total_commandes,    color:'#a855f7' },
                { label:'Ce mois',  value:stats.commandes_ce_mois,  color:'#06b6d4' },
                { label:'Livrées',  value:stats.commandes_livrees,  color:'#10b981' },
              ].map((s,i) => (
                <div key={i} style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10, padding:'10px', textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top produits */}
        <div className="section-card">
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
            <Award size={15} color="#f59e0b" />
            <div style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)' }}>Top 5 produits vendus</div>
          </div>
          <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
            {stats.top_produits.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text-muted)', fontSize:13 }}>Aucune vente enregistrée</div>
            ) : stats.top_produits.map((p, i) => (
              <div key={i}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background: i===0?'linear-gradient(135deg,#f59e0b,#ef4444)':i===1?'rgba(168,85,247,.2)':'var(--bg-surface)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color: i<2?(i===0?'#f59e0b':'#a855f7'):'var(--text-muted)', flexShrink:0 }}>
                      {i+1}
                    </div>
                    <span style={{ fontSize:12.5, color:'var(--text-primary)', fontWeight:600 }}>{p.nom}</span>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--violet-light)' }}>{p.total_vendu} u</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)' }}>{p.ca.toLocaleString('fr-DZ')} DA</div>
                  </div>
                </div>
                <div className="bar">
                  <div className="bar-fill" style={{ width:`${(p.total_vendu / maxVentes) * 100}%`, background: i===0?'linear-gradient(90deg,#f59e0b,#ec4899)':i===1?'#a855f7':'#06b6d4' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── LIGNE 3 : STOCK + FABRICATION + LIVRAISONS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>

        {/* Stock */}
        <div className="section-card">
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
            <Package size={14} color="#06b6d4" />
            <div style={{ fontWeight:700, fontSize:13, color:'var(--text-primary)' }}>État du stock</div>
          </div>
          <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { label:'Produits catalogue',  value:stats.total_produits,      color:'#06b6d4', bg:'rgba(6,182,212,.1)',   border:'rgba(6,182,212,.2)'   },
              { label:'En rupture',          value:stats.produits_en_rupture, color:'#ef4444', bg:'rgba(239,68,68,.1)',  border:'rgba(239,68,68,.2)'  },
              { label:'Stock bas',           value:stats.produits_stock_bas,  color:'#f59e0b', bg:'rgba(245,158,11,.1)', border:'rgba(245,158,11,.2)' },
              { label:'Matières premières',  value:stats.total_matieres,      color:'#a855f7', bg:'rgba(168,85,247,.1)', border:'rgba(168,85,247,.2)' },
              { label:'Matières critiques',  value:stats.matieres_critiques,  color:'#ef4444', bg:'rgba(239,68,68,.1)',  border:'rgba(239,68,68,.2)'  },
            ].map((s, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:s.bg, border:`1px solid ${s.border}`, borderRadius:9, padding:'8px 12px' }}>
                <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{s.label}</span>
                <span style={{ fontSize:16, fontWeight:800, color:s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fabrication */}
        <div className="section-card">
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
            <Factory size={14} color="#ec4899" />
            <div style={{ fontWeight:700, fontSize:13, color:'var(--text-primary)' }}>Fabrication</div>
          </div>
          <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { label:'Ordres actifs',   value:stats.ordres_actifs,   color:'#ec4899', bg:'rgba(236,72,153,.1)', border:'rgba(236,72,153,.2)' },
              { label:'Ordres terminés', value:stats.ordres_termines, color:'#10b981', bg:'rgba(16,185,129,.1)', border:'rgba(16,185,129,.2)' },
            ].map((s, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:s.bg, border:`1px solid ${s.border}`, borderRadius:9, padding:'8px 12px' }}>
                <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{s.label}</span>
                <span style={{ fontSize:16, fontWeight:800, color:s.color }}>{s.value}</span>
              </div>
            ))}

            {/* Taux complétion fabrication */}
            <div style={{ marginTop:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginBottom:5 }}>
                <span>Taux de complétion</span>
                <span style={{ fontWeight:600, color:'#10b981' }}>
                  {stats.ordres_actifs + stats.ordres_termines > 0
                    ? Math.round((stats.ordres_termines / (stats.ordres_actifs + stats.ordres_termines)) * 100)
                    : 0}%
                </span>
              </div>
              <div className="bar">
                <div className="bar-fill" style={{ width:`${stats.ordres_actifs + stats.ordres_termines > 0 ? Math.round((stats.ordres_termines / (stats.ordres_actifs + stats.ordres_termines)) * 100) : 0}%`, background:'linear-gradient(90deg,#ec4899,#10b981)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Livraisons */}
        <div className="section-card">
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
            <Truck size={14} color="#06b6d4" />
            <div style={{ fontWeight:700, fontSize:13, color:'var(--text-primary)' }}>Livraisons</div>
          </div>
          <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { label:'Total livraisons',  value:stats.livraisons_total,      color:'#06b6d4', bg:'rgba(6,182,212,.1)',   border:'rgba(6,182,212,.2)'   },
              { label:'En attente',        value:stats.livraisons_en_attente, color:'#f59e0b', bg:'rgba(245,158,11,.1)', border:'rgba(245,158,11,.2)' },
              { label:'Effectuées',        value:stats.livraisons_effectuees, color:'#10b981', bg:'rgba(16,185,129,.1)', border:'rgba(16,185,129,.2)' },
            ].map((s, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:s.bg, border:`1px solid ${s.border}`, borderRadius:9, padding:'8px 12px' }}>
                <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{s.label}</span>
                <span style={{ fontSize:16, fontWeight:800, color:s.color }}>{s.value}</span>
              </div>
            ))}

            {/* Taux livraison */}
            <div style={{ marginTop:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginBottom:5 }}>
                <span>Taux de livraison</span>
                <span style={{ fontWeight:600, color:'#10b981' }}>
                  {stats.livraisons_total > 0
                    ? Math.round((stats.livraisons_effectuees / stats.livraisons_total) * 100)
                    : 0}%
                </span>
              </div>
              <div className="bar">
                <div className="bar-fill" style={{ width:`${stats.livraisons_total > 0 ? Math.round((stats.livraisons_effectuees / stats.livraisons_total) * 100) : 0}%`, background:'#06b6d4' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}