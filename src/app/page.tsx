'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, Package, LogIn, X, MapPin, Search,
  UserPlus, Building2, User, ChevronRight, Star,
  Shield, Truck, Award, ArrowRight, Menu, Eye, EyeOff,
  CheckCircle, AlertCircle, Minus, Plus, Trash2
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────
type PanierItem = { produit: any; quantite: number };
type TypeClient = 'individuel' | 'entreprise';
type ModalType = 'none' | 'login' | 'register' | 'panier' | 'suivi';

// ─── Statuts commande ────────────────────────────────────
const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  en_fabrication: 'En fabrication',
  livree: 'Livrée',
  annulee: 'Annulée',
};
const STATUT_COLORS: Record<string, string> = {
  en_attente: '#f59e0b',
  confirmee: '#3b82f6',
  en_fabrication: '#8b5cf6',
  livree: '#10b981',
  annulee: '#ef4444',
};
const STATUT_ETAPES = ['en_attente', 'confirmee', 'en_fabrication', 'livree'];

export default function Home() {
  const router = useRouter();

  // — Modal state —
  const [modal, setModal] = useState<ModalType>('none');
  const closeModal = () => setModal('none');

  // — Auth —
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // — Produits —
  const [produits, setProduits] = useState<any[]>([]);

  // — Panier —
  const [panier, setPanier] = useState<PanierItem[]>([]);
  const [commandeEnvoyee, setCommandeEnvoyee] = useState(false);
  const [commandeId, setCommandeId] = useState<number | null>(null);
  const [commandeLoading, setCommandeLoading] = useState(false);

  // — Infos client commande rapide —
  const [infoClient, setInfoClient] = useState({
    prenom: '', nom: '', telephone: '', email: '', adresse: '',
    latitude: '', longitude: '',
  });
  const [locLoading, setLocLoading] = useState(false);

  // — Inscription —
  const [typeClient, setTypeClient] = useState<TypeClient>('individuel');
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState('');
  // Champs communs
  const [regEmail, setRegEmail] = useState('');
  const [regTel, setRegTel] = useState('');
  const [regAdresse, setRegAdresse] = useState('');
  const [regPwd, setRegPwd] = useState('');
  // Individuel
  const [regNom, setRegNom] = useState('');
  const [regPrenom, setRegPrenom] = useState('');
  const [regNin, setRegNin] = useState('');
  const [regDOB, setRegDOB] = useState('');
  // Entreprise
  const [regTitre, setRegTitre] = useState('');
  const [regNif, setRegNif] = useState('');
  const [regAnnee, setRegAnnee] = useState('');
  const [regSiege, setRegSiege] = useState('');

  // — Suivi —
  const [numeroSuivi, setNumeroSuivi] = useState('');
  const [resultatSuivi, setResultatSuivi] = useState<any>(null);
  const [suiviErreur, setSuiviErreur] = useState('');
  const [suiviLoading, setSuiviLoading] = useState(false);

  // — Navbar mobile —
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    fetch('/api/produits')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProduits(data); });
  }, []);

  // ─── Auth ──────────────────────────────────────────────
  async function handleLogin() {
    setLoginLoading(true);
    setLoginError('');
    const res = await signIn('credentials', {
      email: loginForm.email,
      password: loginForm.password,
      redirect: false,
    });
    if (res?.error) {
      setLoginError('Email ou mot de passe incorrect');
      setLoginLoading(false);
      return;
    }
    const sessionRes = await fetch('/api/auth/session');
    const session = await sessionRes.json();
    if (session?.user?.role === 'admin') router.push('/admin');
    else if (session?.user?.role === 'livreur') router.push('/livreur');
    setLoginLoading(false);
    closeModal();
  }

  // ─── Inscription ───────────────────────────────────────
  async function handleRegister() {
    setRegisterLoading(true);
    setRegisterError('');
    try {
      // 1. Créer utilisateur
      const resUser = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: typeClient === 'individuel' ? `${regPrenom} ${regNom}` : regTitre,
          email: regEmail,
          mot_de_passe: regPwd,
          role: 'client',
        }),
      });
      const dataUser = await resUser.json();
      if (!resUser.ok) throw new Error(dataUser.error || 'Erreur inscription');

      // 2. Créer fiche client
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utilisateur_id: dataUser.id,
          type_client: typeClient,
          email: regEmail,
          telephone: regTel,
          adresse: regAdresse,
          nom: regNom,
          prenom: regPrenom,
          date_naissance: regDOB || null,
          nin: regNin || null,
          titre: regTitre || null,
          nif: regNif || null,
          annee_creation: regAnnee ? parseInt(regAnnee) : null,
          siege_social: regSiege || null,
        }),
      });
      setRegisterSuccess(true);
    } catch (e: any) {
      setRegisterError(e.message);
    }
    setRegisterLoading(false);
  }

  // ─── Panier ────────────────────────────────────────────
  function ajouterAuPanier(produit: any) {
    setPanier(prev => {
      const existe = prev.find(p => p.produit.id === produit.id);
      if (existe) return prev.map(p => p.produit.id === produit.id ? { ...p, quantite: p.quantite + 1 } : p);
      return [...prev, { produit, quantite: 1 }];
    });
  }
  function setQte(id: number, q: number) {
    if (q < 1) return;
    setPanier(prev => prev.map(p => p.produit.id === id ? { ...p, quantite: q } : p));
  }
  function supprimer(id: number) {
    setPanier(prev => prev.filter(p => p.produit.id !== id));
  }
  const total = panier.reduce((acc, p) => acc + p.produit.prix_vente * p.quantite, 0);
  const totalItems = panier.reduce((acc, p) => acc + p.quantite, 0);

  async function passerCommande() {
    if (!infoClient.prenom || !infoClient.nom || !infoClient.telephone) return;
    setCommandeLoading(true);
    try {
      const resClient = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type_client: 'individuel',
          nom: infoClient.nom,
          prenom: infoClient.prenom,
          email: infoClient.email,
          telephone: infoClient.telephone,
          adresse: infoClient.adresse || 'Non renseignée',
        }),
      });
      const dataClient = await resClient.json();

      const resCommande = await fetch('/api/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: dataClient.id,
          produits: panier.map(p => ({
            produit_id: p.produit.id,
            quantite: p.quantite,
            prix_unitaire: p.produit.prix_vente,
          })),
        }),
      });
      const dataCommande = await resCommande.json();
      setPanier([]);
      setCommandeId(dataCommande.id);
      setCommandeEnvoyee(true);
    } finally {
      setCommandeLoading(false);
    }
  }

  function obtenirLocalisation() {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setInfoClient(prev => ({ ...prev, latitude: lat, longitude: lng, adresse: `Lat: ${lat}, Lng: ${lng}` }));
        setLocLoading(false);
      },
      () => setLocLoading(false)
    );
  }

  // ─── Suivi ─────────────────────────────────────────────
  async function rechercherCommande() {
    if (!numeroSuivi.trim()) { setSuiviErreur('Veuillez saisir un numéro'); return; }
    setSuiviLoading(true);
    setSuiviErreur('');
    setResultatSuivi(null);
    const res = await fetch(`/api/commandes/${numeroSuivi.trim()}`);
    if (!res.ok) { setSuiviErreur('Commande introuvable.'); }
    else setResultatSuivi(await res.json());
    setSuiviLoading(false);
  }

  // ─── Render ────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Sora', 'Segoe UI', sans-serif", background: '#f8fafc', minHeight: '100vh' }}>

      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .btn-primary {
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          color: white; border: none; border-radius: 12px;
          padding: 12px 24px; font-weight: 600; cursor: pointer;
          font-family: 'Sora', sans-serif; font-size: 14px;
          transition: all 0.2s; box-shadow: 0 4px 14px rgba(59,130,246,0.35);
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(59,130,246,0.45); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-ghost {
          background: transparent; border: 1.5px solid #e2e8f0;
          color: #475569; border-radius: 10px; padding: 10px 20px;
          font-weight: 500; cursor: pointer; font-family: 'Sora', sans-serif;
          font-size: 14px; transition: all 0.2s;
        }
        .btn-ghost:hover { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }
        .card { background: white; border-radius: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04); }
        .input-field {
          width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px;
          padding: 11px 14px; font-family: 'Sora', sans-serif; font-size: 14px;
          color: #1e293b; outline: none; transition: border 0.2s;
          background: #f8fafc;
        }
        .input-field:focus { border-color: #3b82f6; background: white; }
        .badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
        }
        .overlay {
          position: fixed; inset: 0; background: rgba(15,23,42,0.6);
          backdrop-filter: blur(4px); display: flex; align-items: center;
          justify-content: center; z-index: 1000; padding: 16px;
        }
        .modal {
          background: white; border-radius: 24px; width: 100%; max-width: 480px;
          max-height: 90vh; overflow-y: auto; padding: 32px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.2);
        }
        .modal-lg { max-width: 560px; }
        .tab-btn {
          flex: 1; padding: 10px; border: none; background: transparent;
          font-family: 'Sora', sans-serif; font-weight: 600; font-size: 13px;
          cursor: pointer; border-radius: 10px; transition: all 0.2s; color: #64748b;
        }
        .tab-btn.active { background: #1e40af; color: white; box-shadow: 0 2px 8px rgba(30,64,175,0.3); }
        .step-dot {
          width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center;
          justify-content: center; font-size: 13px; font-weight: 700;
        }
        .hero-pattern {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%);
          position: relative; overflow: hidden;
        }
        .hero-pattern::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at 30% 50%, rgba(59,130,246,0.15) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.1) 0%, transparent 50%);
        }
        .product-card {
          background: white; border-radius: 20px; overflow: hidden;
          transition: all 0.3s; border: 1px solid #f1f5f9;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
        .qty-btn {
          width: 28px; height: 28px; border-radius: 8px; border: 1.5px solid #e2e8f0;
          background: white; cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #475569; transition: all 0.2s;
        }
        .qty-btn:hover { border-color: #3b82f6; color: #3b82f6; }
        .progress-bar {
          height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;
        }
        .progress-fill {
          height: 100%; border-radius: 2px;
          background: linear-gradient(90deg, #1e40af, #3b82f6);
          transition: width 0.5s ease;
        }
        label { font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 4px; display: block; }
        .form-row { display: flex; gap: 12px; }
        .form-row > * { flex: 1; }
        .section-title { font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
      `}</style>

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav style={{
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid #f1f5f9',
        boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #1e40af, #3b82f6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', lineHeight: 1.1 }}>Gestion Pro</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>Production & Livraison</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setModal('suivi')} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <Search size={15} /> Suivre commande
            </button>

            <button onClick={() => setModal('register')} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#f0fdf4', border: '1.5px solid #86efac',
              color: '#16a34a', borderRadius: 10, padding: '9px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Sora', sans-serif",
            }}>
              <UserPlus size={15} /> Créer un compte
            </button>

            {/* Panier */}
            <button onClick={() => setModal('panier')} style={{
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 42, height: 42, border: '1.5px solid #e2e8f0', borderRadius: 12,
              background: 'white', cursor: 'pointer', color: '#475569',
            }}>
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6, background: '#ef4444',
                  color: 'white', fontSize: 10, fontWeight: 700, width: 18, height: 18,
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {totalItems}
                </span>
              )}
            </button>

            <button onClick={() => setModal('login')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', fontSize: 13 }}>
              <LogIn size={15} /> Connexion
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <div className="hero-pattern" style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '6px 14px', marginBottom: 20 }}>
              <Award size={14} color="#fbbf24" />
              <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>Plateforme de gestion à la demande</span>
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 16, margin: 0 }}>
              Commandez sur mesure,{' '}
              <span style={{ background: 'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                livré chez vous
              </span>
            </h1>
            <p style={{ fontSize: 16, color: '#94a3b8', marginTop: 16, marginBottom: 32, lineHeight: 1.7 }}>
              Mobilier professionnel fabriqué à la demande. Suivez votre commande en temps réel, de la fabrication à la livraison.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => { const el = document.getElementById('catalogue'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                className="btn-primary" style={{ fontSize: 15, padding: '13px 28px', display: 'flex', alignItems: 'center', gap: 8 }}>
                Voir le catalogue <ArrowRight size={16} />
              </button>
              <button onClick={() => setModal('register')} className="btn-ghost" style={{ fontSize: 15, padding: '13px 28px', color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.2)' }}>
                Créer mon compte
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 24, marginTop: 48, flexWrap: 'wrap' }}>
            {[
              { icon: <Shield size={16} color="#60a5fa" />, label: 'Qualité garantie' },
              { icon: <Truck size={16} color="#34d399" />, label: 'Livraison rapide' },
              { icon: <Star size={16} color="#fbbf24" />, label: 'Sur mesure' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {item.icon}
                <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ CATALOGUE ═══════════════ */}
      <div id="catalogue" style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <div className="section-title">Catalogue</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0 }}>Nos Produits</h2>
          </div>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{produits.length} produit{produits.length !== 1 ? 's' : ''}</span>
        </div>

        {produits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#94a3b8' }}>
            <Package size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p>Aucun produit disponible pour le moment</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {produits.map(p => {
              const inPanier = panier.find(x => x.produit.id === p.id);
              const stockBas = p.stock_disponible <= p.stock_minimum;
              const rupture = p.stock_disponible === 0;
              return (
                <div key={p.id} className="product-card">
                  {/* Bandeau coloré */}
                  <div style={{ height: 6, background: rupture ? '#ef4444' : stockBas ? '#f59e0b' : 'linear-gradient(90deg, #1e40af, #3b82f6)' }} />
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, background: '#eff6ff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={22} color="#3b82f6" />
                      </div>
                      <span className="badge" style={{
                        background: rupture ? '#fef2f2' : stockBas ? '#fffbeb' : '#f0fdf4',
                        color: rupture ? '#dc2626' : stockBas ? '#d97706' : '#16a34a',
                        border: `1px solid ${rupture ? '#fecaca' : stockBas ? '#fde68a' : '#bbf7d0'}`,
                      }}>
                        {rupture ? '● Rupture' : stockBas ? `⚠ Stock faible` : `✓ En stock`}
                      </span>
                    </div>

                    <h3 style={{ fontWeight: 700, fontSize: 17, color: '#0f172a', marginBottom: 6 }}>{p.nom}</h3>
                    <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.5 }}>{p.description || 'Produit de qualité professionnelle'}</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#1e40af' }}>
                          {Number(p.prix_vente).toLocaleString('fr-DZ')} DA
                        </div>
                        {p.stock_disponible > 0 && (
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{p.stock_disponible} unités dispo.</div>
                        )}
                      </div>
                      {!rupture && (
                        <button
                          onClick={() => ajouterAuPanier(p)}
                          className="btn-primary"
                          style={{ padding: '9px 16px', fontSize: 13 }}
                        >
                          {inPanier ? `Dans le panier (${inPanier.quantite})` : 'Ajouter'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════ MODAL CONNEXION ═══════════════ */}
      {modal === 'login' && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: 22, color: '#0f172a', margin: 0 }}>Connexion</h2>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Accès administration & livraison</p>
              </div>
              <button onClick={closeModal} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748b" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label>Adresse email</label>
                <input className="input-field" type="email" placeholder="admin@gestion.com"
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label>Mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input className="input-field" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    style={{ paddingRight: 44 }} />
                  <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {loginError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px' }}>
                  <AlertCircle size={15} color="#dc2626" />
                  <span style={{ fontSize: 13, color: '#dc2626' }}>{loginError}</span>
                </div>
              )}
              <button onClick={handleLogin} disabled={loginLoading} className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: 15, marginTop: 4 }}>
                {loginLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </div>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#94a3b8' }}>
              Pas encore de compte ?{' '}
              <button onClick={() => setModal('register')} style={{ color: '#3b82f6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Sora', sans-serif" }}>
                Créer un compte
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL INSCRIPTION ═══════════════ */}
      {modal === 'register' && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            {registerSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 64, height: 64, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={32} color="#16a34a" />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', marginBottom: 8 }}>Compte créé avec succès !</h3>
                <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Votre compte a été enregistré. Vous pouvez maintenant vous connecter.</p>
                <button onClick={() => { setRegisterSuccess(false); setModal('login'); }} className="btn-primary" style={{ padding: '12px 28px' }}>
                  Se connecter
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontWeight: 800, fontSize: 22, color: '#0f172a', margin: 0 }}>Créer un compte</h2>
                    <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Étape {registerStep} sur 2</p>
                  </div>
                  <button onClick={closeModal} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={16} color="#64748b" />
                  </button>
                </div>

                {/* Barre progression */}
                <div className="progress-bar" style={{ marginBottom: 28 }}>
                  <div className="progress-fill" style={{ width: registerStep === 1 ? '50%' : '100%' }} />
                </div>

                {registerStep === 1 && (
                  <>
                    {/* Choix type */}
                    <div className="section-title">Type de compte</div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                      {([
                        { type: 'individuel', icon: <User size={20} />, label: 'Acheteur individuel', desc: 'Particulier / usage personnel' },
                        { type: 'entreprise', icon: <Building2 size={20} />, label: 'Entreprise', desc: 'Société / organisation' },
                      ] as { type: TypeClient; icon: any; label: string; desc: string }[]).map(opt => (
                        <button key={opt.type} onClick={() => setTypeClient(opt.type)} style={{
                          flex: 1, padding: '16px', borderRadius: 14, cursor: 'pointer',
                          border: `2px solid ${typeClient === opt.type ? '#3b82f6' : '#e2e8f0'}`,
                          background: typeClient === opt.type ? '#eff6ff' : 'white',
                          fontFamily: "'Sora', sans-serif", textAlign: 'left', transition: 'all 0.2s',
                        }}>
                          <div style={{ color: typeClient === opt.type ? '#1e40af' : '#94a3b8', marginBottom: 8 }}>{opt.icon}</div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 2 }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{opt.desc}</div>
                        </button>
                      ))}
                    </div>

                    {/* Champs selon type */}
                    {typeClient === 'individuel' ? (
                      <>
                        <div className="section-title">Informations personnelles</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div className="form-row">
                            <div><label>Prénom *</label><input className="input-field" placeholder="Mohammed" value={regPrenom} onChange={e => setRegPrenom(e.target.value)} /></div>
                            <div><label>Nom *</label><input className="input-field" placeholder="Benali" value={regNom} onChange={e => setRegNom(e.target.value)} /></div>
                          </div>
                          <div><label>NIN (Numéro d'identification nationale)</label><input className="input-field" placeholder="123456789" value={regNin} onChange={e => setRegNin(e.target.value)} /></div>
                          <div><label>Date de naissance</label><input className="input-field" type="date" value={regDOB} onChange={e => setRegDOB(e.target.value)} /></div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="section-title">Informations entreprise</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div><label>Raison sociale *</label><input className="input-field" placeholder="SARL Bois & Design" value={regTitre} onChange={e => setRegTitre(e.target.value)} /></div>
                          <div className="form-row">
                            <div><label>NIF</label><input className="input-field" placeholder="001234567890123" value={regNif} onChange={e => setRegNif(e.target.value)} /></div>
                            <div><label>Année création</label><input className="input-field" type="number" placeholder="2015" value={regAnnee} onChange={e => setRegAnnee(e.target.value)} /></div>
                          </div>
                          <div><label>Siège social</label><input className="input-field" placeholder="Zone industrielle, Alger" value={regSiege} onChange={e => setRegSiege(e.target.value)} /></div>
                        </div>
                      </>
                    )}

                    <button onClick={() => setRegisterStep(2)} className="btn-primary" style={{ width: '100%', padding: '13px', marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      disabled={typeClient === 'individuel' ? !regPrenom || !regNom : !regTitre}>
                      Continuer <ChevronRight size={16} />
                    </button>
                  </>
                )}

                {registerStep === 2 && (
                  <>
                    <div className="section-title">Coordonnées & Accès</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div><label>Email *</label><input className="input-field" type="email" placeholder="contact@exemple.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} /></div>
                      <div><label>Téléphone *</label><input className="input-field" type="tel" placeholder="0555 123 456" value={regTel} onChange={e => setRegTel(e.target.value)} /></div>
                      <div><label>Adresse</label><input className="input-field" placeholder="Votre adresse complète" value={regAdresse} onChange={e => setRegAdresse(e.target.value)} /></div>
                      <div>
                        <label>Mot de passe *</label>
                        <div style={{ position: 'relative' }}>
                          <input className="input-field" type={showPwd ? 'text' : 'password'} placeholder="Minimum 8 caractères"
                            value={regPwd} onChange={e => setRegPwd(e.target.value)} style={{ paddingRight: 44 }} />
                          <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {registerError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginTop: 12 }}>
                        <AlertCircle size={15} color="#dc2626" />
                        <span style={{ fontSize: 13, color: '#dc2626' }}>{registerError}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                      <button onClick={() => setRegisterStep(1)} className="btn-ghost" style={{ flex: 1, padding: '12px' }}>Retour</button>
                      <button onClick={handleRegister} className="btn-primary" style={{ flex: 2, padding: '12px' }}
                        disabled={registerLoading || !regEmail || !regTel || !regPwd}>
                        {registerLoading ? 'Création...' : 'Créer mon compte'}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL PANIER ═══════════════ */}
      {modal === 'panier' && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', margin: 0 }}>
                Mon panier {totalItems > 0 && <span style={{ color: '#3b82f6' }}>({totalItems})</span>}
              </h2>
              <button onClick={() => { closeModal(); setCommandeEnvoyee(false); }} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748b" />
              </button>
            </div>

            {commandeEnvoyee ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 64, height: 64, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={32} color="#16a34a" />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 20, color: '#0f172a' }}>Commande envoyée !</h3>
                {commandeId && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 16, padding: '20px', margin: '16px 0' }}>
                    <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Numéro de commande</p>
                    <p style={{ fontSize: 36, fontWeight: 800, color: '#1e40af' }}>#{commandeId}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Conservez ce numéro pour le suivi</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { closeModal(); setCommandeEnvoyee(false); }} className="btn-ghost" style={{ flex: 1, padding: '11px' }}>Fermer</button>
                  <button onClick={() => { closeModal(); setCommandeEnvoyee(false); setNumeroSuivi(commandeId ? String(commandeId) : ''); setModal('suivi'); }} className="btn-primary" style={{ flex: 1, padding: '11px' }}>
                    Suivre ma commande
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Liste articles */}
                {panier.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                    <ShoppingCart size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p>Votre panier est vide</p>
                  </div>
                ) : (
                  <div style={{ borderBottom: '1px solid #f1f5f9', marginBottom: 16, paddingBottom: 8 }}>
                    {panier.map(p => (
                      <div key={p.produit.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                        <div style={{ width: 36, height: 36, background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package size={16} color="#3b82f6" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', truncate: true }}>{p.produit.nom}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{Number(p.produit.prix_vente).toLocaleString('fr-DZ')} DA / u</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button className="qty-btn" onClick={() => setQte(p.produit.id, p.quantite - 1)}><Minus size={12} /></button>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', minWidth: 20, textAlign: 'center' }}>{p.quantite}</span>
                          <button className="qty-btn" onClick={() => setQte(p.produit.id, p.quantite + 1)}><Plus size={12} /></button>
                        </div>
                        <div style={{ fontWeight: 700, color: '#1e40af', fontSize: 13, minWidth: 72, textAlign: 'right' }}>
                          {(Number(p.produit.prix_vente) * p.quantite).toLocaleString('fr-DZ')} DA
                        </div>
                        <button onClick={() => supprimer(p.produit.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, padding: '12px 0 4px', color: '#0f172a' }}>
                      <span>Total</span>
                      <span style={{ color: '#1e40af' }}>{total.toLocaleString('fr-DZ')} DA</span>
                    </div>
                  </div>
                )}

                {/* Formulaire client */}
                <div>
                  <div className="section-title" style={{ marginTop: 8 }}>Vos informations</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="form-row">
                      <div><label>Prénom *</label><input className="input-field" placeholder="Prénom" value={infoClient.prenom} onChange={e => setInfoClient(p => ({ ...p, prenom: e.target.value }))} /></div>
                      <div><label>Nom *</label><input className="input-field" placeholder="Nom" value={infoClient.nom} onChange={e => setInfoClient(p => ({ ...p, nom: e.target.value }))} /></div>
                    </div>
                    <div><label>Téléphone *</label><input className="input-field" type="tel" placeholder="0555 123 456" value={infoClient.telephone} onChange={e => setInfoClient(p => ({ ...p, telephone: e.target.value }))} /></div>
                    <div><label>Email</label><input className="input-field" type="email" placeholder="votre@email.com" value={infoClient.email} onChange={e => setInfoClient(p => ({ ...p, email: e.target.value }))} /></div>
                    <div>
                      <label>Adresse de livraison</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input className="input-field" style={{ flex: 1 }} placeholder="Adresse ou cliquez Localiser" value={infoClient.adresse} onChange={e => setInfoClient(p => ({ ...p, adresse: e.target.value }))} />
                        <button onClick={obtenirLocalisation} disabled={locLoading} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1.5px solid #86efac', color: '#16a34a', borderRadius: 10, padding: '0 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Sora', sans-serif" }}>
                          <MapPin size={14} /> {locLoading ? '...' : 'GPS'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button onClick={closeModal} className="btn-ghost" style={{ flex: 1, padding: '12px' }}>Fermer</button>
                  <button onClick={passerCommande} className="btn-primary" style={{ flex: 2, padding: '12px' }}
                    disabled={commandeLoading || panier.length === 0 || !infoClient.prenom || !infoClient.nom || !infoClient.telephone}>
                    {commandeLoading ? 'Envoi...' : `Commander — ${total.toLocaleString('fr-DZ')} DA`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL SUIVI ═══════════════ */}
      {modal === 'suivi' && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: 22, color: '#0f172a', margin: 0 }}>Suivre ma commande</h2>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Entrez votre numéro de commande</p>
              </div>
              <button onClick={() => { closeModal(); setResultatSuivi(null); setSuiviErreur(''); setNumeroSuivi(''); }} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748b" />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input className="input-field" style={{ flex: 1 }} type="number" placeholder="Ex: 1042"
                value={numeroSuivi} onChange={e => setNumeroSuivi(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && rechercherCommande()} />
              <button onClick={rechercherCommande} disabled={suiviLoading} className="btn-primary" style={{ padding: '0 18px', display: 'flex', alignItems: 'center' }}>
                {suiviLoading ? '...' : <Search size={18} />}
              </button>
            </div>

            {suiviErreur && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                <AlertCircle size={15} color="#dc2626" />
                <span style={{ fontSize: 13, color: '#dc2626' }}>{suiviErreur}</span>
              </div>
            )}

            {resultatSuivi && (
              <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', margin: 0 }}>Commande #{resultatSuivi.id}</p>
                    <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Client : {resultatSuivi.client_nom}</p>
                  </div>
                  <span className="badge" style={{
                    background: STATUT_COLORS[resultatSuivi.statut] + '18',
                    color: STATUT_COLORS[resultatSuivi.statut],
                    border: `1px solid ${STATUT_COLORS[resultatSuivi.statut]}40`,
                    fontSize: 12,
                  }}>
                    {STATUT_LABELS[resultatSuivi.statut] || resultatSuivi.statut}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                  <span>Total : <strong style={{ color: '#1e40af' }}>{Number(resultatSuivi.total).toLocaleString('fr-DZ')} DA</strong></span>
                  <span>{new Date(resultatSuivi.created_at).toLocaleDateString('fr-FR')}</span>
                </div>

                {resultatSuivi.statut !== 'annulee' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      {STATUT_ETAPES.map((etape, i) => {
                        const idx = STATUT_ETAPES.indexOf(resultatSuivi.statut);
                        const done = i <= idx;
                        const labels: Record<string, string> = { en_attente: 'Reçue', confirmee: 'Confirmée', en_fabrication: 'Fabrication', livree: 'Livrée' };
                        return (
                          <div key={etape} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <div className="step-dot" style={{ background: done ? '#1e40af' : '#e2e8f0', color: done ? 'white' : '#94a3b8', marginBottom: 6 }}>
                              {done ? '✓' : i + 1}
                            </div>
                            <span style={{ fontSize: 10, textAlign: 'center', color: done ? '#1e40af' : '#94a3b8', fontWeight: done ? 600 : 400 }}>{labels[etape]}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(STATUT_ETAPES.indexOf(resultatSuivi.statut) / (STATUT_ETAPES.length - 1)) * 100}%` }} />
                    </div>
                  </>
                )}

                {resultatSuivi.statut === 'annulee' && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                    <p style={{ color: '#dc2626', fontSize: 13, fontWeight: 600 }}>Cette commande a été annulée.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer style={{ background: '#0f172a', marginTop: 80, padding: '32px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #1e40af, #3b82f6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={16} color="white" />
            </div>
            <span style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>Gestion Pro</span>
          </div>
          <span style={{ fontSize: 12, color: '#475569' }}>PFE 2025 — Plateforme de gestion à la demande</span>
        </div>
      </footer>
    </div>
  );
}