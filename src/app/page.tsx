'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, Package, LogIn, X, MapPin, Search,
  UserPlus, Building2, User, ChevronRight, Star,
  Shield, Truck, Award, ArrowRight, Eye, EyeOff,
  CheckCircle, AlertCircle, Minus, Plus, Trash2, Zap, Sparkles,
} from 'lucide-react';

type PanierItem = { produit: any; quantite: number };
type TypeClient = 'individuel' | 'entreprise';
type ModalType = 'none' | 'login' | 'register' | 'panier' | 'suivi';

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente', confirmee: 'Confirmée',
  en_fabrication: 'En fabrication', livree: 'Livrée', annulee: 'Annulée',
};
const STATUT_COLORS: Record<string, string> = {
  en_attente: '#f59e0b', confirmee: '#a855f7',
  en_fabrication: '#ec4899', livree: '#10b981', annulee: '#ef4444',
};
const STATUT_ETAPES = ['en_attente', 'confirmee', 'en_fabrication', 'livree'];

export default function Home() {
  const router = useRouter();
  const [modal, setModal] = useState<ModalType>('none');
  const closeModal = () => setModal('none');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [produits, setProduits] = useState<any[]>([]);
  const [panier, setPanier] = useState<PanierItem[]>([]);
  const [commandeEnvoyee, setCommandeEnvoyee] = useState(false);
  const [commandeId, setCommandeId] = useState<number | null>(null);
  const [commandeLoading, setCommandeLoading] = useState(false);
  const [infoClient, setInfoClient] = useState({ prenom: '', nom: '', telephone: '', email: '', adresse: '', latitude: '', longitude: '' });
  const [locLoading, setLocLoading] = useState(false);
  const [typeClient, setTypeClient] = useState<TypeClient>('individuel');
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regTel, setRegTel] = useState('');
  const [regAdresse, setRegAdresse] = useState('');
  const [regPwd, setRegPwd] = useState('');
  const [regNom, setRegNom] = useState('');
  const [regPrenom, setRegPrenom] = useState('');
  const [regNin, setRegNin] = useState('');
  const [regDOB, setRegDOB] = useState('');
  const [regTitre, setRegTitre] = useState('');
  const [regNif, setRegNif] = useState('');
  const [regAnnee, setRegAnnee] = useState('');
  const [regSiege, setRegSiege] = useState('');
  const [numeroSuivi, setNumeroSuivi] = useState('');
  const [resultatSuivi, setResultatSuivi] = useState<any>(null);
  const [suiviErreur, setSuiviErreur] = useState('');
  const [suiviLoading, setSuiviLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetch('/api/produits').then(r => r.json()).then(d => { if (Array.isArray(d)) setProduits(d); });
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleLogin() {
    setLoginLoading(true); setLoginError('');
    const res = await signIn('credentials', { email: loginForm.email, password: loginForm.password, redirect: false });
    if (res?.error) { setLoginError('Email ou mot de passe incorrect'); setLoginLoading(false); return; }
    const s = await (await fetch('/api/auth/session')).json();
    if (s?.user?.role === 'admin') router.push('/admin');
    else if (s?.user?.role === 'livreur') router.push('/livreur');
    else if (s?.user?.role === 'responsable_production') router.push('/production');
    else if (s?.user?.role === 'fournisseur') router.push('/fournisseur');
    else if (s?.user?.role === 'client') router.push('/client');
    setLoginLoading(false); closeModal();
  }

  async function handleRegister() {
    setRegisterLoading(true); setRegisterError('');
    try {
      const resUser = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nom: typeClient === 'individuel' ? `${regPrenom} ${regNom}` : regTitre, email: regEmail, mot_de_passe: regPwd, role: 'client' }) });
      const dataUser = await resUser.json();
      if (!resUser.ok) throw new Error(dataUser.error || 'Erreur inscription');
      await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ utilisateur_id: dataUser.id, type_client: typeClient, email: regEmail, telephone: regTel, adresse: regAdresse, nom: regNom, prenom: regPrenom, date_naissance: regDOB || null, nin: regNin || null, titre: regTitre || null, nif: regNif || null, annee_creation: regAnnee ? parseInt(regAnnee) : null, siege_social: regSiege || null }) });
      setRegisterSuccess(true);
    } catch (e: any) { setRegisterError(e.message); }
    setRegisterLoading(false);
  }

  function ajouterAuPanier(produit: any) {
    setPanier(prev => { const e = prev.find(p => p.produit.id === produit.id); if (e) return prev.map(p => p.produit.id === produit.id ? { ...p, quantite: p.quantite + 1 } : p); return [...prev, { produit, quantite: 1 }]; });
  }
  const setQte = (id: number, q: number) => { if (q < 1) return; setPanier(prev => prev.map(p => p.produit.id === id ? { ...p, quantite: q } : p)); };
  const supprimer = (id: number) => setPanier(prev => prev.filter(p => p.produit.id !== id));
  const total = panier.reduce((a, p) => a + p.produit.prix_vente * p.quantite, 0);
  const totalItems = panier.reduce((a, p) => a + p.quantite, 0);

  async function passerCommande() {
    if (!infoClient.prenom || !infoClient.nom || !infoClient.telephone) return;
    setCommandeLoading(true);
    try {
      const dc = await (await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type_client: 'individuel', nom: infoClient.nom, prenom: infoClient.prenom, email: infoClient.email, telephone: infoClient.telephone, adresse: infoClient.adresse || 'Non renseignée' }) })).json();
      const dCmd = await (await fetch('/api/commandes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: dc.id, produits: panier.map(p => ({ produit_id: p.produit.id, quantite: p.quantite, prix_unitaire: p.produit.prix_vente })) }) })).json();
      setPanier([]); setCommandeId(dCmd.id); setCommandeEnvoyee(true);
    } finally { setCommandeLoading(false); }
  }

  function obtenirLocalisation() {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude.toFixed(6), lng = pos.coords.longitude.toFixed(6);
      setInfoClient(p => ({ ...p, latitude: lat, longitude: lng, adresse: `Lat: ${lat}, Lng: ${lng}` }));
      setLocLoading(false);
    }, () => setLocLoading(false));
  }

  async function rechercherCommande() {
    if (!numeroSuivi.trim()) { setSuiviErreur('Veuillez saisir un numéro'); return; }
    setSuiviLoading(true); setSuiviErreur(''); setResultatSuivi(null);
    const res = await fetch(`/api/commandes/${numeroSuivi.trim()}`);
    if (!res.ok) setSuiviErreur('Commande introuvable.');
    else setResultatSuivi(await res.json());
    setSuiviLoading(false);
  }

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#080812', minHeight: '100vh', color: '#f1f0ff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080812; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0f0f23; }
        ::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 3px; }
        .btn-v { background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; border: none; border-radius: 12px; padding: 12px 24px; font-weight: 700; cursor: pointer; font-family: 'Outfit', sans-serif; font-size: 14px; transition: all 0.25s; box-shadow: 0 4px 20px rgba(124,58,237,0.4); display: inline-flex; align-items: center; gap: 8px; }
        .btn-v:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(124,58,237,0.6); filter: brightness(1.1); }
        .btn-v:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-outline-v { background: transparent; border: 1.5px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.85); border-radius: 12px; padding: 12px 24px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; font-size: 14px; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }
        .btn-outline-v:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.3); }
        .btn-ghost-v { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); border-radius: 10px; padding: 9px 16px; font-weight: 500; cursor: pointer; font-family: 'Outfit', sans-serif; font-size: 13px; transition: all 0.2s; display: inline-flex; align-items: center; gap: 7px; }
        .btn-ghost-v:hover { background: rgba(124,58,237,0.12); border-color: rgba(124,58,237,0.4); color: #c4b5fd; }
        .inp { width: 100%; background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 10px; padding: 11px 14px; font-family: 'Outfit', sans-serif; font-size: 14px; color: #f1f0ff !important; outline: none; transition: all 0.2s; }
        .inp:focus { border-color: #7c3aed !important; background: rgba(124,58,237,0.08) !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.15) !important; }
        .inp::placeholder { color: rgba(255,255,255,0.3); }
        label { font-size: 12px; font-weight: 600; color: #a09dc0; margin-bottom: 5px; display: block; letter-spacing: 0.02em; }
        .overlay-d { position: fixed; inset: 0; background: rgba(4,4,20,0.85); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; animation: fadeIn 0.2s ease; }
        .modal-d { background: #0f0f23; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; padding: 32px; box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1); animation: slideUp 0.25s ease; }
        .modal-lg { max-width: 540px; }
        .close-btn { width: 32px; height: 32px; border-radius: 9px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); cursor: pointer; display: flex; align-items: center; justify-content: center; color: #a09dc0; transition: all 0.2s; flex-shrink: 0; }
        .close-btn:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #fca5a5; }
        .prod-card { background: rgba(19,19,42,0.8); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; overflow: hidden; transition: all 0.3s; }
        .prod-card:hover { border-color: rgba(124,58,237,0.4); transform: translateY(-4px); box-shadow: 0 16px 40px rgba(124,58,237,0.15); }
        .qty-btn { width: 28px; height: 28px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); cursor: pointer; display: flex; align-items: center; justify-content: center; color: #a09dc0; transition: all 0.15s; }
        .qty-btn:hover { border-color: #7c3aed; color: #c4b5fd; background: rgba(124,58,237,0.1); }
        .prog-track { height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
        .prog-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg,#7c3aed,#ec4899); transition: width 0.6s ease; }
        .type-card { flex: 1; padding: 16px; border-radius: 14px; cursor: pointer; border: 1.5px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); font-family: 'Outfit', sans-serif; text-align: left; transition: all 0.2s; }
        .type-card.selected { border-color: #7c3aed; background: rgba(124,58,237,0.1); }
        .form-row { display: flex; gap: 12px; }
        .form-row > * { flex: 1; }
        .grad-text { background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 20px rgba(124,58,237,0.3)} 50%{box-shadow:0 0 40px rgba(124,58,237,0.6),0 0 80px rgba(236,72,153,0.2)} }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: scrolled ? 'rgba(8,8,18,0.92)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent', transition: 'all 0.3s' }}>
        <div style={{ height: 2, background: 'linear-gradient(90deg, #7c3aed, #ec4899, #06b6d4, transparent)' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(124,58,237,0.5)', animation: 'pulse-glow 3s ease-in-out infinite', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,255,255,0.2),transparent)' }} />
              <Package size={19} color="white" style={{ position: 'relative', zIndex: 1 }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#f1f0ff', lineHeight: 1.1, letterSpacing: '-0.02em' }}>Gestion Pro</div>
              <div style={{ fontSize: 9, color: '#7c3aed', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Production & Livraison</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setModal('register')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s' }}>
              <UserPlus size={14} /> Créer un compte
            </button>
            <button onClick={() => setModal('panier')} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, background: 'rgba(255,255,255,0.05)', cursor: 'pointer', color: '#a09dc0', transition: 'all 0.2s' }}>
              <ShoppingCart size={17} />
              {totalItems > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: 'white', fontSize: 9, fontWeight: 700, width: 17, height: 17, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #080812' }}>{totalItems}</span>}
            </button>
            <button onClick={() => setModal('login')} className="btn-v" style={{ padding: '9px 18px', fontSize: 13 }}>
              <LogIn size={14} /> Connexion
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '90px 24px 100px', minHeight: '85vh', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 50%, rgba(124,58,237,0.2) 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, rgba(236,72,153,0.15) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(6,182,212,0.1) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div style={{ position: 'absolute', top: '15%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)', animation: 'float 6s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '25%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.1), transparent 70%)', animation: 'float 8s ease-in-out infinite reverse', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ maxWidth: 660 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '6px 14px', marginBottom: 24 }}>
              <Zap size={12} color="#a855f7" />
              <span style={{ fontSize: 11.5, color: '#c4b5fd', fontWeight: 600, letterSpacing: '0.04em' }}>Plateforme de gestion à la demande</span>
            </div>
            <h1 style={{ fontSize: 54, fontWeight: 900, color: '#f1f0ff', lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.03em' }}>
              Commandez sur mesure,{' '}
              <span className="grad-text">livré chez vous</span>
            </h1>
            <p style={{ fontSize: 16.5, color: '#6b6890', marginBottom: 36, lineHeight: 1.75, maxWidth: 520 }}>
              Mobilier professionnel fabriqué à la demande. Suivez votre commande en temps réel, de la fabrication à la livraison.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
              <button onClick={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })} className="btn-v" style={{ fontSize: 15, padding: '14px 30px' }}>
                Voir le catalogue <ArrowRight size={16} />
              </button>
              <button onClick={() => setModal('register')} className="btn-outline-v" style={{ fontSize: 15, padding: '14px 30px' }}>
                Créer mon compte
              </button>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { icon: <Shield size={14} color="#a855f7" />, label: 'Qualité garantie', color: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.25)' },
                { icon: <Truck size={14} color="#06b6d4" />, label: 'Livraison rapide', color: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.25)' },
                { icon: <Star size={14} color="#ec4899" />, label: 'Sur mesure', color: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.25)' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: item.color, border: `1px solid ${item.border}`, borderRadius: 20, padding: '7px 14px' }}>
                  {item.icon}
                  <span style={{ fontSize: 12.5, color: '#c4c0e8', fontWeight: 500 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CATALOGUE */}
      <div id="catalogue" style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Catalogue</div>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: '#f1f0ff', margin: 0, letterSpacing: '-0.02em' }}>Nos <span className="grad-text">Produits</span></h2>
          </div>
          <span style={{ fontSize: 13, color: '#5c5a7a', fontWeight: 500 }}>{produits.length} produit{produits.length !== 1 ? 's' : ''}</span>
        </div>
        {produits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 64, height: 64, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Package size={28} color="#7c3aed" />
            </div>
            <p style={{ color: '#5c5a7a', fontSize: 14 }}>Aucun produit disponible pour le moment</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {produits.map(p => {
              const inPanier = panier.find(x => x.produit.id === p.id);
              const stockBas = p.stock_disponible <= p.stock_minimum;
              const rupture = p.stock_disponible === 0;
              return (
                <div key={p.id} className="prod-card">
                  <div style={{ height: 3, background: rupture ? '#ef4444' : stockBas ? '#f59e0b' : 'linear-gradient(90deg,#7c3aed,#ec4899)' }} />
                  <div style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ width: 44, height: 44, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={20} color="#a855f7" />
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: rupture ? 'rgba(239,68,68,0.1)' : stockBas ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: rupture ? '#ef4444' : stockBas ? '#f59e0b' : '#10b981', border: `1px solid ${rupture ? 'rgba(239,68,68,0.25)' : stockBas ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}` }}>
                        {rupture ? '● Rupture' : stockBas ? '⚠ Stock bas' : '✓ En stock'}
                      </span>
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: 17, color: '#f1f0ff', marginBottom: 8, letterSpacing: '-0.01em' }}>{p.nom}</h3>
                    <p style={{ fontSize: 13, color: '#6b6890', marginBottom: 20, lineHeight: 1.6 }}>{p.description || 'Produit de qualité professionnelle'}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(135deg,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                          {Number(p.prix_vente).toLocaleString('fr-DZ')} DA
                        </div>
                        {p.stock_disponible > 0 && <div style={{ fontSize: 11, color: '#5c5a7a', marginTop: 3 }}>{p.stock_disponible} unités dispo.</div>}
                      </div>
                      {!rupture && (
                        <button onClick={() => ajouterAuPanier(p)} className="btn-v" style={{ padding: '9px 16px', fontSize: 12.5 }}>
                          {inPanier ? `× ${inPanier.quantite}` : <><Plus size={13} /> Ajouter</>}
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

      {/* MODAL CONNEXION — sans lien "Créer un compte" */}
      {modal === 'login' && (
        <div className="overlay-d" onClick={closeModal}>
          <div className="modal-d" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: 22, color: '#f1f0ff', margin: 0, letterSpacing: '-0.02em' }}>Connexion</h2>
                <p style={{ fontSize: 13, color: '#6b6890', marginTop: 4 }}>Accès à votre espace</p>
              </div>
              <button onClick={closeModal} className="close-btn"><X size={15} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label>Adresse email</label><input className="inp" type="email" placeholder="email@exemple.com" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div>
                <label>Mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input className="inp" type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ paddingRight: 44 }} />
                  <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b6890' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {loginError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 12px' }}>
                  <AlertCircle size={14} color="#ef4444" /><span style={{ fontSize: 13, color: '#fca5a5' }}>{loginError}</span>
                </div>
              )}
              <button onClick={handleLogin} disabled={loginLoading} className="btn-v" style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 4 }}>
                {loginLoading ? <><span className="spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} /> Connexion...</> : 'Se connecter'}
              </button>
            </div>
            {/* Pas de lien "Créer un compte" ici — réservé aux clients via la page d'accueil */}
          </div>
        </div>
      )}

      {/* MODAL INSCRIPTION */}
      {modal === 'register' && (
        <div className="overlay-d" onClick={closeModal}>
          <div className="modal-d modal-lg" onClick={e => e.stopPropagation()}>
            {registerSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 64, height: 64, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={30} color="#10b981" />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 20, color: '#f1f0ff', marginBottom: 8 }}>Compte créé !</h3>
                <p style={{ color: '#6b6890', fontSize: 14, marginBottom: 24 }}>Votre compte a été enregistré. Connectez-vous maintenant.</p>
                <button onClick={() => { setRegisterSuccess(false); setModal('login'); }} className="btn-v" style={{ padding: '12px 28px' }}>Se connecter</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                  <div>
                    <h2 style={{ fontWeight: 800, fontSize: 22, color: '#f1f0ff', margin: 0, letterSpacing: '-0.02em' }}>Créer un compte</h2>
                    <p style={{ fontSize: 13, color: '#6b6890', marginTop: 4 }}>Étape {registerStep} sur 2</p>
                  </div>
                  <button onClick={closeModal} className="close-btn"><X size={15} /></button>
                </div>
                <div className="prog-track" style={{ marginBottom: 26 }}>
                  <div className="prog-fill" style={{ width: registerStep === 1 ? '50%' : '100%' }} />
                </div>
                {registerStep === 1 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b6890', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Type de compte</div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
                      {([
                        { type: 'individuel', icon: <User size={18} />, label: 'Individuel', desc: 'Particulier' },
                        { type: 'entreprise', icon: <Building2 size={18} />, label: 'Entreprise', desc: 'Société / org.' },
                      ] as any[]).map(opt => (
                        <button key={opt.type} onClick={() => setTypeClient(opt.type)} className={`type-card${typeClient === opt.type ? ' selected' : ''}`}>
                          <div style={{ color: typeClient === opt.type ? '#a855f7' : '#6b6890', marginBottom: 8 }}>{opt.icon}</div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f0ff', marginBottom: 2 }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: '#6b6890' }}>{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                    {typeClient === 'individuel' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                        <div className="form-row">
                          <div><label>Prénom *</label><input className="inp" placeholder="Mohammed" value={regPrenom} onChange={e => setRegPrenom(e.target.value)} /></div>
                          <div><label>Nom *</label><input className="inp" placeholder="Benali" value={regNom} onChange={e => setRegNom(e.target.value)} /></div>
                        </div>
                        <div><label>NIN</label><input className="inp" placeholder="Numéro d'identification" value={regNin} onChange={e => setRegNin(e.target.value)} /></div>
                        <div><label>Date de naissance</label><input className="inp" type="date" value={regDOB} onChange={e => setRegDOB(e.target.value)} /></div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                        <div><label>Raison sociale *</label><input className="inp" placeholder="SARL Bois & Design" value={regTitre} onChange={e => setRegTitre(e.target.value)} /></div>
                        <div className="form-row">
                          <div><label>NIF</label><input className="inp" placeholder="001234567890123" value={regNif} onChange={e => setRegNif(e.target.value)} /></div>
                          <div><label>Année création</label><input className="inp" type="number" placeholder="2015" value={regAnnee} onChange={e => setRegAnnee(e.target.value)} /></div>
                        </div>
                        <div><label>Siège social</label><input className="inp" placeholder="Zone industrielle, Alger" value={regSiege} onChange={e => setRegSiege(e.target.value)} /></div>
                      </div>
                    )}
                    <button onClick={() => setRegisterStep(2)} className="btn-v" style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: '13px' }}
                      disabled={typeClient === 'individuel' ? !regPrenom || !regNom : !regTitre}>
                      Continuer <ChevronRight size={15} />
                    </button>
                  </>
                )}
                {registerStep === 2 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b6890', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Coordonnées & Accès</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                      <div><label>Email *</label><input className="inp" type="email" placeholder="contact@exemple.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} /></div>
                      <div><label>Téléphone *</label><input className="inp" type="tel" placeholder="0555 123 456" value={regTel} onChange={e => setRegTel(e.target.value)} /></div>
                      <div><label>Adresse</label><input className="inp" placeholder="Votre adresse complète" value={regAdresse} onChange={e => setRegAdresse(e.target.value)} /></div>
                      <div>
                        <label>Mot de passe *</label>
                        <div style={{ position: 'relative' }}>
                          <input className="inp" type={showPwd ? 'text' : 'password'} placeholder="Minimum 8 caractères" value={regPwd} onChange={e => setRegPwd(e.target.value)} style={{ paddingRight: 44 }} />
                          <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b6890' }}>
                            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                    {registerError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 12px', marginTop: 12 }}>
                        <AlertCircle size={14} color="#ef4444" /><span style={{ fontSize: 13, color: '#fca5a5' }}>{registerError}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                      <button onClick={() => setRegisterStep(1)} className="btn-ghost-v" style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>Retour</button>
                      <button onClick={handleRegister} className="btn-v" style={{ flex: 2, justifyContent: 'center', padding: '12px' }} disabled={registerLoading || !regEmail || !regTel || !regPwd}>
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

      {/* MODAL PANIER */}
      {modal === 'panier' && (
        <div className="overlay-d" onClick={closeModal}>
          <div className="modal-d modal-lg" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: 20, color: '#f1f0ff', margin: 0 }}>
                Mon panier {totalItems > 0 && <span style={{ color: '#a855f7' }}>({totalItems})</span>}
              </h2>
              <button onClick={() => { closeModal(); setCommandeEnvoyee(false); }} className="close-btn"><X size={15} /></button>
            </div>
            {commandeEnvoyee ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 64, height: 64, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={30} color="#10b981" />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 20, color: '#f1f0ff', marginBottom: 8 }}>Commande envoyée !</h3>
                {commandeId && (
                  <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 16, padding: '20px', margin: '16px 0' }}>
                    <p style={{ fontSize: 12, color: '#6b6890', marginBottom: 6 }}>Numéro de commande</p>
                    <p style={{ fontSize: 40, fontWeight: 900, background: 'linear-gradient(135deg,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>#{commandeId}</p>
                    <p style={{ fontSize: 11, color: '#6b6890', marginTop: 6 }}>Conservez ce numéro pour le suivi</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { closeModal(); setCommandeEnvoyee(false); }} className="btn-ghost-v" style={{ flex: 1, justifyContent: 'center', padding: '11px' }}>Fermer</button>
                  <button onClick={() => { closeModal(); setCommandeEnvoyee(false); setNumeroSuivi(commandeId ? String(commandeId) : ''); setModal('suivi'); }} className="btn-v" style={{ flex: 1, justifyContent: 'center', padding: '11px' }}>Suivre</button>
                </div>
              </div>
            ) : (
              <>
                {panier.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b6890' }}>
                    <ShoppingCart size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ fontSize: 14 }}>Votre panier est vide</p>
                  </div>
                ) : (
                  <div style={{ marginBottom: 16 }}>
                    {panier.map(p => (
                      <div key={p.produit.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ width: 34, height: 34, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package size={15} color="#a855f7" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#f1f0ff' }}>{p.produit.nom}</div>
                          <div style={{ fontSize: 11, color: '#6b6890' }}>{Number(p.produit.prix_vente).toLocaleString('fr-DZ')} DA / u</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button className="qty-btn" onClick={() => setQte(p.produit.id, p.quantite - 1)}><Minus size={11} /></button>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f0ff', minWidth: 20, textAlign: 'center' }}>{p.quantite}</span>
                          <button className="qty-btn" onClick={() => setQte(p.produit.id, p.quantite + 1)}><Plus size={11} /></button>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13, background: 'linear-gradient(135deg,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', minWidth: 80, textAlign: 'right' }}>
                          {(Number(p.produit.prix_vente) * p.quantite).toLocaleString('fr-DZ')} DA
                        </div>
                        <button onClick={() => supprimer(p.produit.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><Trash2 size={13} /></button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, padding: '14px 0 4px', color: '#f1f0ff' }}>
                      <span>Total</span>
                      <span style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{total.toLocaleString('fr-DZ')} DA</span>
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b6890', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Vos informations</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    <div className="form-row">
                      <div><label>Prénom *</label><input className="inp" placeholder="Prénom" value={infoClient.prenom} onChange={e => setInfoClient(p => ({ ...p, prenom: e.target.value }))} /></div>
                      <div><label>Nom *</label><input className="inp" placeholder="Nom" value={infoClient.nom} onChange={e => setInfoClient(p => ({ ...p, nom: e.target.value }))} /></div>
                    </div>
                    <div><label>Téléphone *</label><input className="inp" type="tel" placeholder="0555 123 456" value={infoClient.telephone} onChange={e => setInfoClient(p => ({ ...p, telephone: e.target.value }))} /></div>
                    <div><label>Email</label><input className="inp" type="email" placeholder="votre@email.com" value={infoClient.email} onChange={e => setInfoClient(p => ({ ...p, email: e.target.value }))} /></div>
                    <div>
                      <label>Adresse de livraison</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input className="inp" style={{ flex: 1 }} placeholder="Adresse ou GPS" value={infoClient.adresse} onChange={e => setInfoClient(p => ({ ...p, adresse: e.target.value }))} />
                        <button onClick={obtenirLocalisation} disabled={locLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', borderRadius: 10, padding: '0 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif" }}>
                          <MapPin size={13} /> {locLoading ? '...' : 'GPS'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button onClick={closeModal} className="btn-ghost-v" style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>Fermer</button>
                  <button onClick={passerCommande} className="btn-v" style={{ flex: 2, justifyContent: 'center', padding: '12px' }}
                    disabled={commandeLoading || panier.length === 0 || !infoClient.prenom || !infoClient.nom || !infoClient.telephone}>
                    {commandeLoading ? 'Envoi...' : `Commander — ${total.toLocaleString('fr-DZ')} DA`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL SUIVI */}
      {modal === 'suivi' && (
        <div className="overlay-d" onClick={closeModal}>
          <div className="modal-d" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: 20, color: '#f1f0ff', margin: 0 }}>Suivre ma commande</h2>
                <p style={{ fontSize: 13, color: '#6b6890', marginTop: 4 }}>Entrez votre numéro de commande</p>
              </div>
              <button onClick={() => { closeModal(); setResultatSuivi(null); setSuiviErreur(''); setNumeroSuivi(''); }} className="close-btn"><X size={15} /></button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input className="inp" style={{ flex: 1 }} type="number" placeholder="Ex: 1042" value={numeroSuivi} onChange={e => setNumeroSuivi(e.target.value)} onKeyDown={e => e.key === 'Enter' && rechercherCommande()} />
              <button onClick={rechercherCommande} disabled={suiviLoading} className="btn-v" style={{ padding: '0 18px' }}>
                {suiviLoading ? '...' : <Search size={16} />}
              </button>
            </div>
            {suiviErreur && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                <AlertCircle size={14} color="#ef4444" /><span style={{ fontSize: 13, color: '#fca5a5' }}>{suiviErreur}</span>
              </div>
            )}
            {resultatSuivi && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 18, color: '#f1f0ff', margin: 0 }}>Commande #{resultatSuivi.id}</p>
                    <p style={{ fontSize: 13, color: '#6b6890', marginTop: 3 }}>Client : {resultatSuivi.client_nom}</p>
                  </div>
                  <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: STATUT_COLORS[resultatSuivi.statut] + '18', color: STATUT_COLORS[resultatSuivi.statut], border: `1px solid ${STATUT_COLORS[resultatSuivi.statut]}40` }}>
                    {STATUT_LABELS[resultatSuivi.statut] || resultatSuivi.statut}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b6890', marginBottom: 20 }}>
                  <span>Total : <strong style={{ color: '#a855f7' }}>{Number(resultatSuivi.total).toLocaleString('fr-DZ')} DA</strong></span>
                  <span>{new Date(resultatSuivi.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                {resultatSuivi.statut !== 'annulee' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      {STATUT_ETAPES.map((etape, i) => {
                        const idx = STATUT_ETAPES.indexOf(resultatSuivi.statut);
                        const done = i <= idx;
                        const labels: Record<string, string> = { en_attente: 'Reçue', confirmee: 'Confirmée', en_fabrication: 'Fabrication', livree: 'Livrée' };
                        return (
                          <div key={etape} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : 'rgba(255,255,255,0.06)', border: `1px solid ${done ? 'transparent' : 'rgba(255,255,255,0.1)'}`, color: done ? 'white' : '#6b6890', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginBottom: 6, boxShadow: done ? '0 0 12px rgba(124,58,237,0.4)' : 'none' }}>
                              {done ? '✓' : i + 1}
                            </div>
                            <span style={{ fontSize: 9.5, color: done ? '#c4b5fd' : '#6b6890', fontWeight: done ? 600 : 400, textAlign: 'center' }}>{labels[etape]}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="prog-track">
                      <div className="prog-fill" style={{ width: `${(STATUT_ETAPES.indexOf(resultatSuivi.statut) / (STATUT_ETAPES.length - 1)) * 100}%` }} />
                    </div>
                  </>
                )}
                {resultatSuivi.statut === 'annulee' && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '11px', textAlign: 'center' }}>
                    <p style={{ color: '#fca5a5', fontSize: 13, fontWeight: 600, margin: 0 }}>Cette commande a été annulée.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px 24px', marginTop: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={14} color="white" />
            </div>
            <span style={{ fontWeight: 700, color: '#f1f0ff', fontSize: 13 }}>Gestion Pro</span>
          </div>
          <span style={{ fontSize: 11.5, color: '#3a3858' }}>PFE 2025 — Plateforme de gestion à la demande</span>
        </div>
      </footer>
    </div>
  );
}