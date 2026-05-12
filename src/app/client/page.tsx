'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Package, ShoppingCart, Clock, CheckCircle, Truck,
  Factory, X, LogOut, RefreshCw,
  MapPin, Plus, Minus, Trash2, ArrowRight, AlertCircle,
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
  en_attente:     { label: 'En attente',     color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: Clock },
  confirmee:      { label: 'Confirmée',      color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe', icon: CheckCircle },
  en_fabrication: { label: 'En fabrication', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: Factory },
  pret_livraison: { label: 'Prêt livraison', color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc', icon: Package },
  livree:         { label: 'Livrée',         color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', icon: CheckCircle },
  annulee:        { label: 'Annulée',        color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: X },
};

const ETAPES = ['en_attente', 'confirmee', 'en_fabrication', 'pret_livraison', 'livree'];
const ETAPES_LABELS: Record<string, string> = {
  en_attente: 'Reçue', confirmee: 'Confirmée',
  en_fabrication: 'Fabrication', pret_livraison: 'Prêt', livree: 'Livrée',
};

const DS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:#f8fafc}
.btn-primary{display:inline-flex;align-items:center;gap:6px;background:#1a56db;color:white;border:none;border-radius:9px;padding:9px 18px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:background .15s,transform .15s;box-shadow:0 2px 8px rgba(26,86,219,.25)}
.btn-primary:hover{background:#1648c2;transform:translateY(-1px)}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1.5px solid #e2e8f0;color:#64748b;border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:#1a56db;color:#1a56db;background:#eff6ff}
.input-field{width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-family:'DM Sans',sans-serif;font-size:13.5px;color:#1e293b;outline:none;transition:border .15s;background:#f8fafc}
.input-field:focus{border-color:#1a56db;background:white;box-shadow:0 0 0 3px rgba(26,86,219,.08)}
label{font-size:11.5px;font-weight:600;color:#64748b;margin-bottom:5px;display:block;letter-spacing:.02em}
.card{background:white;border-radius:16px;border:1px solid #f1f5f9;box-shadow:0 1px 4px rgba(0,0,0,.04)}
.overlay{position:fixed;inset:0;background:rgba(8,15,30,.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;animation:fadeIn .2s}
.modal{background:white;border-radius:18px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;padding:28px;box-shadow:0 32px 80px rgba(0,0,0,.25);animation:slideUp .2s}
.tab-btn{flex:1;padding:11px;font-size:13px;font-weight:500;border:none;background:transparent;cursor:pointer;font-family:'DM Sans',sans-serif;color:#64748b;transition:all .15s;border-bottom:2px solid transparent}
.tab-btn.active{color:#1a56db;border-bottom-color:#1a56db;background:#eff6ff}
.product-card{background:white;border-radius:14px;border:1px solid #f1f5f9;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;transition:transform .2s,box-shadow .2s}
.product-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08)}
.qty-btn{width:26px;height:26px;border-radius:7px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#475569;transition:all .15s}
.qty-btn:hover{border-color:#1a56db;color:#1a56db}
.progress-track{height:4px;background:#e2e8f0;border-radius:2px;overflow:hidden}
.progress-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,#1a56db,#3b82f6);transition:width .5s}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function ClientPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [produits, setProduits]   = useState<Produit[]>([]);
  const [clientId, setClientId]   = useState<number | null>(null);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<'commandes' | 'catalogue'>('commandes');
  const [panier, setPanier]       = useState<PanierItem[]>([]);
  const [showPanier, setShowPanier] = useState(false);
  const [commandeOk, setCommandeOk] = useState<number | null>(null);
  const [cmdLoading, setCmdLoading] = useState(false);
  const [cmdError, setCmdError]   = useState('');

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
    } catch (e) {
      console.error('fetchCommandes error:', e);
    } finally { setLoading(false); }
  }

  async function fetchProduits() {
    const res  = await fetch('/api/produits');
    const data = await res.json();
    if (Array.isArray(data)) setProduits(data);
  }

  // Panier
  function ajouterAuPanier(produit: Produit) {
    setPanier(prev => {
      const e = prev.find(p => p.produit.id === produit.id);
      if (e) return prev.map(p => p.produit.id === produit.id ? { ...p, quantite: p.quantite + 1 } : p);
      return [...prev, { produit, quantite: 1 }];
    });
  }
  const setQte    = (id: number, q: number) => { if (q < 1) return; setPanier(prev => prev.map(p => p.produit.id === id ? { ...p, quantite: q } : p)); };
  const supprimer = (id: number) => setPanier(prev => prev.filter(p => p.produit.id !== id));
  const total     = panier.reduce((a, p) => a + Number(p.produit.prix_vente) * p.quantite, 0);
  const totalItems = panier.reduce((a, p) => a + p.quantite, 0);

  async function passerCommande() {
    if (panier.length === 0) return;
    setCmdLoading(true);
    setCmdError('');

    try {
      // Utiliser le clientId déjà récupéré ou le re-fetcher
      let cid = clientId;
      if (!cid) {
        const userId = (session?.user as any)?.id;
        const res    = await fetch(`/api/client/commandes?utilisateur_id=${userId}`);
        const data   = await res.json();
        cid = data.client_id;
        if (cid) setClientId(cid);
      }

      if (!cid) {
        setCmdError('Impossible de trouver votre profil client. Contactez le support.');
        setCmdLoading(false);
        return;
      }

      const res = await fetch('/api/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: cid,
          produits: panier.map(p => ({
            produit_id:    p.produit.id,
            quantite:      p.quantite,
            prix_unitaire: p.produit.prix_vente,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCmdError(data.error || 'Erreur lors de la commande');
        return;
      }

      setPanier([]);
      setShowPanier(false);
      setCommandeOk(data.id);
      fetchCommandes();

    } catch (e: any) {
      setCmdError('Erreur réseau : ' + e.message);
    } finally {
      setCmdLoading(false);
    }
  }

  const enCours   = commandes.filter(c => !['livree', 'annulee'].includes(c.statut));
  const terminees = commandes.filter(c =>  ['livree', 'annulee'].includes(c.statut));

  if (status === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: 36, height: 36, border: '3px solid #1a56db', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", minHeight: '100vh', background: '#f8fafc' }}>
      <style>{DS}</style>

      {/* Navbar */}
      <nav style={{ background: '#080f1e', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#1a56db,#3b82f6)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={17} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>Gestion Pro</div>
              <div style={{ fontSize: 9, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Espace Client</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setShowPanier(true)} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', borderRadius: 9, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
              <ShoppingCart size={15} /><span>Panier</span>
              {totalItems > 0 && <span style={{ background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 2 }}>{totalItems}</span>}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '6px 12px' }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#1e3a6e,#1a56db)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#93c5fd', fontFamily: "'Space Grotesk',sans-serif" }}>
                {session?.user?.name?.[0]?.toUpperCase() || 'C'}
              </div>
              <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>{session?.user?.name}</span>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/' })} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>
              <LogOut size={13} /> Quitter
            </button>
          </div>
        </div>
        <div style={{ height: 2, background: 'linear-gradient(90deg,#1a56db,#3b82f6,transparent)' }} />
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Bienvenue</div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>{session?.user?.name} 👋</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{commandes.length} commande{commandes.length > 1 ? 's' : ''} au total</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total commandes', value: commandes.length, color: '#1a56db', bg: '#eff6ff', border: '#bfdbfe' },
            { label: 'En cours',        value: enCours.length,   color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
            { label: 'Livrées',         value: terminees.filter(c => c.statut === 'livree').length, color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Total dépensé',   value: `${commandes.reduce((a, c) => a + Number(c.total), 0).toLocaleString('fr-DZ')} DA`, color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: i === 3 ? 14 : 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alerte succès commande */}
        {commandeOk && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={18} color="#059669" />
              <div>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#065f46' }}>Commande #{commandeOk} envoyée !</span>
                <p style={{ fontSize: 12, color: '#16a34a', margin: '2px 0 0' }}>Votre commande est en cours de traitement.</p>
              </div>
            </div>
            <button onClick={() => setCommandeOk(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={16} /></button>
          </div>
        )}

        {/* Tabs */}
        <div className="card">
          <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
            <button onClick={() => setActiveTab('commandes')} className={`tab-btn${activeTab === 'commandes' ? ' active' : ''}`}>Mes commandes ({commandes.length})</button>
            <button onClick={() => setActiveTab('catalogue')} className={`tab-btn${activeTab === 'catalogue' ? ' active' : ''}`}>Catalogue & Commander</button>
          </div>

          <div style={{ padding: 24 }}>

            {/* ── COMMANDES ── */}
            {activeTab === 'commandes' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <button onClick={fetchCommandes} className="btn-ghost">
                    <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser
                  </button>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Chargement...</div>
                ) : commandes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 56 }}>
                    <ShoppingCart size={40} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.2, color: '#94a3b8' }} />
                    <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>Aucune commande pour le moment</p>
                    <button onClick={() => setActiveTab('catalogue')} className="btn-primary" style={{ marginTop: 16 }}>
                      Commander maintenant <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {commandes.map(cmd => {
                      const cfg = STATUT_CFG[cmd.statut] || STATUT_CFG.en_attente;
                      const Icon = cfg.icon;
                      const etapeIdx = ETAPES.indexOf(cmd.statut);
                      return (
                        <div key={cmd.id} style={{ background: '#f8fafc', borderRadius: 14, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                          <div style={{ height: 3, background: cfg.color }} />
                          <div style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Commande #{cmd.id}</span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                                    <Icon size={11} /> {cfg.label}
                                  </span>
                                </div>
                                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                  {new Date(cmd.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 700, color: '#1a56db' }}>{Number(cmd.total).toLocaleString('fr-DZ')} DA</div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{cmd.lignes?.length || 0} article{(cmd.lignes?.length || 0) > 1 ? 's' : ''}</div>
                              </div>
                            </div>

                            {/* Produits */}
                            {cmd.lignes && cmd.lignes.length > 0 && (
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                                {cmd.lignes.map((l, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 10px', fontSize: 12 }}>
                                    <Package size={12} color="#1a56db" />
                                    <span style={{ fontWeight: 500, color: '#334155' }}>{l.produit_nom}</span>
                                    <span style={{ color: '#94a3b8' }}>×{l.quantite}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Progression */}
                            {cmd.statut !== 'annulee' && (
                              <div style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                  {ETAPES.map((etape, i) => {
                                    const done = i <= etapeIdx;
                                    return (
                                      <div key={etape} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: done ? '#1a56db' : '#e2e8f0', color: done ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>
                                          {done ? '✓' : i + 1}
                                        </div>
                                        <span style={{ fontSize: 9, color: done ? '#1a56db' : '#94a3b8', fontWeight: done ? 600 : 400, textAlign: 'center' }}>{ETAPES_LABELS[etape]}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="progress-track">
                                  <div className="progress-fill" style={{ width: `${Math.max(0, (etapeIdx / (ETAPES.length - 1)) * 100)}%` }} />
                                </div>
                              </div>
                            )}

                            {/* Infos livraison */}
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#64748b' }}>
                              {cmd.livreur_nom && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <Truck size={12} color="#1a56db" />
                                  <span>Livreur : <strong style={{ color: '#334155' }}>{cmd.livreur_nom}</strong></span>
                                </div>
                              )}
                              {cmd.adresse_livraison && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <MapPin size={12} color="#94a3b8" />
                                  <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cmd.adresse_livraison}</span>
                                </div>
                              )}
                              {cmd.date_livraison_reelle && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#059669' }}>
                                  <CheckCircle size={12} />
                                  <span>Livré le {new Date(cmd.date_livraison_reelle).toLocaleDateString('fr-FR')}</span>
                                </div>
                              )}
                              {cmd.numero_bon_commande && (
                                <span style={{ background: '#eff6ff', color: '#1a56db', padding: '2px 7px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{cmd.numero_bon_commande}</span>
                              )}
                            </div>

                            {cmd.statut === 'annulee' && (
                              <div style={{ marginTop: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#dc2626', fontWeight: 500 }}>
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

            {/* ── CATALOGUE ── */}
            {activeTab === 'catalogue' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Catalogue</div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{produits.length} produits disponibles</div>
                  </div>
                  {totalItems > 0 && (
                    <button onClick={() => setShowPanier(true)} className="btn-primary">
                      <ShoppingCart size={14} /> Voir panier ({totalItems})
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
                  {produits.map(p => {
                    const inPanier = panier.find(x => x.produit.id === p.id);
                    const rupture  = p.stock_disponible === 0;
                    const stockBas = p.stock_disponible <= p.stock_minimum;
                    return (
                      <div key={p.id} className="product-card">
                        <div style={{ height: 3, background: rupture ? '#ef4444' : stockBas ? '#f59e0b' : 'linear-gradient(90deg,#1a56db,#3b82f6)' }} />
                        <div style={{ padding: 18 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div style={{ width: 40, height: 40, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Package size={18} color="#1a56db" />
                            </div>
                            <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 600, background: rupture ? '#fef2f2' : stockBas ? '#fffbeb' : '#f0fdf4', color: rupture ? '#dc2626' : stockBas ? '#d97706' : '#059669', border: `1px solid ${rupture ? '#fecaca' : stockBas ? '#fde68a' : '#bbf7d0'}` }}>
                              {rupture ? 'Rupture' : stockBas ? 'Stock bas' : 'Disponible'}
                            </span>
                          </div>
                          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>{p.nom}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14, lineHeight: 1.5 }}>{p.description || 'Produit de qualité'}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 700, color: '#1a56db' }}>{Number(p.prix_vente).toLocaleString('fr-DZ')} DA</div>
                              {p.stock_disponible > 0 && <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 1 }}>{p.stock_disponible} dispo.</div>}
                            </div>
                            {!rupture && (
                              inPanier ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <button className="qty-btn" onClick={() => setQte(p.id, inPanier.quantite - 1)}><Minus size={11} /></button>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', minWidth: 20, textAlign: 'center' }}>{inPanier.quantite}</span>
                                  <button className="qty-btn" onClick={() => setQte(p.id, inPanier.quantite + 1)}><Plus size={11} /></button>
                                </div>
                              ) : (
                                <button onClick={() => ajouterAuPanier(p)} className="btn-primary" style={{ padding: '7px 14px', fontSize: 12.5 }}>
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

      {/* Modal Panier */}
      {showPanier && (
        <div className="overlay" onClick={() => setShowPanier(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 19, color: '#0f172a', margin: 0 }}>
                Mon panier {totalItems > 0 && <span style={{ color: '#1a56db' }}>({totalItems})</span>}
              </h2>
              <button onClick={() => setShowPanier(false)} style={{ width: 28, height: 28, borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} color="#64748b" />
              </button>
            </div>

            {panier.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                <ShoppingCart size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                <p style={{ fontSize: 13 }}>Panier vide</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  {panier.map(p => (
                    <div key={p.produit.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ width: 32, height: 32, background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Package size={14} color="#1a56db" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{p.produit.nom}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{Number(p.produit.prix_vente).toLocaleString('fr-DZ')} DA / u</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <button className="qty-btn" onClick={() => setQte(p.produit.id, p.quantite - 1)}><Minus size={11} /></button>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', minWidth: 18, textAlign: 'center' }}>{p.quantite}</span>
                        <button className="qty-btn" onClick={() => setQte(p.produit.id, p.quantite + 1)}><Plus size={11} /></button>
                      </div>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: '#1a56db', fontSize: 13, minWidth: 70, textAlign: 'right' }}>
                        {(Number(p.produit.prix_vente) * p.quantite).toLocaleString('fr-DZ')} DA
                      </div>
                      <button onClick={() => supprimer(p.produit.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, padding: '12px 0 4px', color: '#0f172a' }}>
                    <span>Total</span>
                    <span style={{ color: '#1a56db' }}>{total.toLocaleString('fr-DZ')} DA</span>
                  </div>
                </div>

                {/* Erreur commande */}
                {cmdError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '9px 12px', marginBottom: 12 }}>
                    <AlertCircle size={14} color="#dc2626" />
                    <span style={{ fontSize: 12.5, color: '#dc2626' }}>{cmdError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowPanier(false)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Fermer</button>
                  <button onClick={passerCommande} disabled={cmdLoading} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
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