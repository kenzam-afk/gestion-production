'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  MapPin, Phone, CheckCircle, XCircle, Navigation,
  Package, Clock, LogOut, RefreshCw, Truck, AlertTriangle,
} from 'lucide-react';

interface Livraison {
  id: number; statut: string; raison_echec: string | null;
  adresse: string; date_livraison: string | null; created_at: string;
  commande_id: number; commande_total: number; commande_statut: string;
  client_nom: string; client_telephone: string; client_email: string; client_adresse: string;
}

const DS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--bg-base)}
.tab-btn{flex:1;padding:11px;font-size:13px;font-weight:600;border:none;background:transparent;cursor:pointer;font-family:'Outfit',sans-serif;color:var(--text-muted);transition:all .15s;border-bottom:2px solid transparent}
.btn-green{display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.35);color:#10b981;border-radius:10px;padding:10px 18px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .2s;width:100%;justify-content:center}
.btn-green:hover{background:rgba(16,185,129,.25)}
.btn-red{display:inline-flex;align-items:center;gap:6px;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.35);color:#ef4444;border-radius:10px;padding:10px 18px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .2s;width:100%;justify-content:center}
.btn-red:hover{background:rgba(239,68,68,.25)}
.btn-cyan{display:inline-flex;align-items:center;gap:6px;background:rgba(6,182,212,.12);border:1px solid rgba(6,182,212,.3);color:#06b6d4;border-radius:10px;padding:10px 18px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .2s;width:100%;justify-content:center}
.btn-cyan:hover{background:rgba(6,182,212,.22)}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--border);color:var(--text-secondary);border-radius:9px;padding:7px 14px;font-weight:500;cursor:pointer;font-family:'Outfit',sans-serif;font-size:12px}
.btn-ghost:hover{border-color:var(--violet);color:var(--violet-light)}
.overlay{position:fixed;inset:0;background:rgba(4,4,20,.88);backdrop-filter:blur(12px);display:flex;align-items:flex-end;justify-content:center;z-index:1000;padding:0;animation:fadeIn .2s}
.modal-bottom{background:var(--bg-card);border:1px solid var(--border);border-radius:20px 20px 0 0;width:100%;max-width:600px;padding:28px 24px 36px;box-shadow:0 -24px 60px rgba(0,0,0,.5);animation:slideUp .25s}
.raison-btn{width:100%;text-align:left;padding:13px 16px;border-radius:11px;border:1px solid var(--border);background:transparent;color:var(--text-secondary);cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;font-weight:500;transition:all .15s;margin-bottom:8px}
.raison-btn:hover{border-color:rgba(239,68,68,.4);color:#ef4444;background:rgba(239,68,68,.06)}
.raison-btn.selected{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.1);font-weight:700}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

const RAISONS = [
  { value: 'client_absent',       label: '🚪 Client absent' },
  { value: 'annulation_client',   label: '❌ Annulation du client' },
  { value: 'adresse_introuvable', label: '📍 Adresse introuvable' },
  { value: 'refus_client',        label: '🚫 Refus du client' },
];

export default function LivreurPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ── Tous les useState en premier ──
  const [livraisons, setLivraisons] = useState<Livraison[]>([]);
  const [loading, setLoading]       = useState(true);
  const [gps, setGps]               = useState<{ lat: number; lng: number } | null>(null);
  const [activeTab, setActiveTab]   = useState<'actives' | 'terminees' | 'problemes'>('actives');
  const [modalId, setModalId]       = useState<number | null>(null);
  const [raison, setRaison]         = useState('');

  // ── Tous les useEffect avant tout return ──
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any)?.role !== 'livreur') {
      router.push('/');
    }
  }, [session, status]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        pos => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true },
      );
    }
  }, []);

  useEffect(() => {
    if (session?.user) fetchLivraisons();
  }, [session]);

  // ── Fonctions ──
  async function fetchLivraisons() {
    if (!session?.user) return;
    setLoading(true);
    const userId = (session.user as any).id;
    const res    = await fetch('/api/livraisons/livreur/' + userId);
    const data   = await res.json();
    if (Array.isArray(data)) setLivraisons(data);
    setLoading(false);
  }

  async function marquerLivree(id: number) {
    await fetch('/api/livraisons/' + id, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'livree', date_livraison: new Date().toISOString().split('T')[0], raison_echec: null }),
    });
    fetchLivraisons();
  }

  async function marquerProbleme(id: number) {
    if (!raison) return;
    await fetch('/api/livraisons/' + id, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'probleme', date_livraison: null, raison_echec: raison }),
    });
    setModalId(null); setRaison('');
    fetchLivraisons();
  }

  function ouvrirItineraire(adresse: string) {
    const url = gps
      ? `https://www.google.com/maps/dir/${gps.lat},${gps.lng}/${encodeURIComponent(adresse)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresse)}`;
    window.open(url, '_blank');
  }

  // ── Return conditionnel APRÈS tous les hooks ──
  if (status === 'loading') return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg-base)' }}>
      <div style={{ width:32, height:32, border:'3px solid #7c3aed', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
      <style>{'@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  if (!session || (session.user as any)?.role !== 'livreur') return null;

  // ── Variables calculées après les returns ──
  const actives   = livraisons.filter(l => ['en_attente','en_cours'].includes(l.statut));
  const terminees = livraisons.filter(l => l.statut === 'livree');
  const problemes = livraisons.filter(l => l.raison_echec && l.statut !== 'livree');
  const selected  = livraisons.find(l => l.id === modalId);

  const tabs = [
    { id: 'actives',   label: `À livrer (${actives.length})`,    color: '#06b6d4' },
    { id: 'terminees', label: `Livrées (${terminees.length})`,   color: '#10b981' },
    { id: 'problemes', label: `Problèmes (${problemes.length})`, color: '#ef4444' },
  ];

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", minHeight:'100vh', background:'var(--bg-base)' }}>
      <style>{DS}</style>

      <div style={{ height:2, background:'linear-gradient(90deg,#06b6d4,#7c3aed,transparent)' }} />
      <nav style={{ background:'var(--bg-base)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ padding:'0 20px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, background:'linear-gradient(135deg,#06b6d4,#7c3aed)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 14px rgba(6,182,212,.4)' }}>
              <Truck size={16} color="white" />
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:14, color:'var(--text-primary)' }}>Espace Livreur</div>
              <div style={{ fontSize:10, color:'var(--cyan)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{session?.user?.name}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color: gps?'#10b981':'#f59e0b' }}>
              <Navigation size={13} /> {gps ? 'GPS actif' : 'GPS inactif'}
            </div>
            <button onClick={fetchLivraisons} className="btn-ghost">
              <RefreshCw size={12} style={{ animation:loading?'spin 1s linear infinite':'none' }} />
            </button>
            <button onClick={() => signOut({ callbackUrl:'/' })} className="btn-ghost">
              <LogOut size={13} /> Quitter
            </button>
          </div>
        </div>
      </nav>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, padding:'16px 20px' }}>
        {[
          { label:'À livrer',  value:actives.length,   color:'#06b6d4', bg:'rgba(6,182,212,.1)',   border:'rgba(6,182,212,.2)'   },
          { label:'Livrées',   value:terminees.length, color:'#10b981', bg:'rgba(16,185,129,.1)', border:'rgba(16,185,129,.2)' },
          { label:'Problèmes', value:problemes.length, color:'#ef4444', bg:'rgba(239,68,68,.1)',  border:'rgba(239,68,68,.2)'  },
        ].map((s,i) => (
          <div key={i} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:14, padding:'14px', textAlign:'center' }}>
            <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:500, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--bg-card)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} className="tab-btn"
            style={{ color: activeTab===t.id ? t.color : 'var(--text-muted)', borderBottomColor: activeTab===t.id ? t.color : 'transparent', background: activeTab===t.id ? `${t.color}10` : 'transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>

        {activeTab === 'actives' && (
          actives.length === 0 ? (
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'48px 24px', textAlign:'center' }}>
              <CheckCircle size={40} style={{ display:'block', margin:'0 auto 12px', color:'#10b981', opacity:.5 }} />
              <p style={{ color:'var(--text-muted)', fontSize:14, fontWeight:500 }}>Toutes les livraisons sont terminées !</p>
            </div>
          ) : actives.map(l => (
            <div key={l.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
              <div style={{ height:3, background:'linear-gradient(90deg,#06b6d4,#7c3aed)' }} />
              <div style={{ padding:'16px 18px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:36, height:36, background:'rgba(6,182,212,.1)', border:'1px solid rgba(6,182,212,.25)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Package size={17} color="#06b6d4" />
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15, color:'var(--text-primary)' }}>Commande #{l.commande_id}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(l.created_at).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight:800, fontSize:16, color:'var(--violet-light)' }}>{Number(l.commande_total).toLocaleString('fr-DZ')} DA</div>
                </div>
                <div style={{ fontWeight:700, fontSize:15, color:'var(--text-primary)', marginBottom:8 }}>{l.client_nom}</div>
                {l.raison_echec && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.25)', borderRadius:8, padding:'7px 10px', marginBottom:10, fontSize:12, color:'#f59e0b' }}>
                    <AlertTriangle size={13} /> Tentative précédente : {RAISONS.find(r => r.value === l.raison_echec)?.label}
                  </div>
                )}
                <div style={{ display:'flex', alignItems:'flex-start', gap:8, background:'var(--bg-surface)', borderRadius:10, padding:'10px 12px', marginBottom:12 }}>
                  <MapPin size={16} color="#ef4444" style={{ flexShrink:0, marginTop:1 }} />
                  <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{l.adresse || l.client_adresse}</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                  <button onClick={() => window.location.href = 'tel:' + l.client_telephone} className="btn-ghost" style={{ justifyContent:'center', padding:'10px' }}>
                    <Phone size={14} /> {l.client_telephone || 'Appeler'}
                  </button>
                  <button onClick={() => ouvrirItineraire(l.adresse || l.client_adresse)} className="btn-cyan">
                    <Navigation size={14} /> Itinéraire
                  </button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <button onClick={() => marquerLivree(l.id)} className="btn-green"><CheckCircle size={16} /> Livrée ✓</button>
                  <button onClick={() => { setModalId(l.id); setRaison(''); }} className="btn-red"><XCircle size={16} /> Problème</button>
                </div>
              </div>
            </div>
          ))
        )}

        {activeTab === 'terminees' && (
          terminees.length === 0 ? (
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'48px 24px', textAlign:'center' }}>
              <Clock size={36} style={{ display:'block', margin:'0 auto 10px', opacity:.2, color:'var(--text-muted)' }} />
              <p style={{ color:'var(--text-muted)', fontSize:13 }}>Aucune livraison terminée</p>
            </div>
          ) : terminees.map(l => (
            <div key={l.id} style={{ background:'var(--bg-card)', border:'1px solid rgba(16,185,129,.2)', borderRadius:16, overflow:'hidden' }}>
              <div style={{ height:3, background:'#10b981' }} />
              <div style={{ padding:'16px 18px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <CheckCircle size={20} color="#10b981" />
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)' }}>Commande #{l.commande_id}</div>
                      <div style={{ fontSize:11, color:'#10b981', fontWeight:600 }}>
                        {l.date_livraison ? `Livrée le ${new Date(l.date_livraison).toLocaleDateString('fr-FR')}` : 'Livrée'}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight:700, fontSize:14, color:'var(--violet-light)' }}>{Number(l.commande_total).toLocaleString('fr-DZ')} DA</div>
                </div>
                <div style={{ fontWeight:600, fontSize:13, color:'var(--text-primary)', marginBottom:6 }}>{l.client_nom}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-muted)' }}>
                  <MapPin size={12} /> {l.adresse || l.client_adresse}
                </div>
              </div>
            </div>
          ))
        )}

        {activeTab === 'problemes' && (
          problemes.length === 0 ? (
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'48px 24px', textAlign:'center' }}>
              <p style={{ color:'var(--text-muted)', fontSize:13 }}>Aucun problème signalé</p>
            </div>
          ) : problemes.map(l => (
            <div key={l.id} style={{ background:'var(--bg-card)', border:'1px solid rgba(245,158,11,.25)', borderRadius:16, overflow:'hidden' }}>
              <div style={{ height:3, background:'#f59e0b' }} />
              <div style={{ padding:'16px 18px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)' }}>Commande #{l.commande_id}</div>
                  <div style={{ fontWeight:700, fontSize:14, color:'var(--violet-light)' }}>{Number(l.commande_total).toLocaleString('fr-DZ')} DA</div>
                </div>
                <div style={{ fontWeight:600, fontSize:13, color:'var(--text-primary)', marginBottom:6 }}>{l.client_nom}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-muted)', marginBottom:10 }}>
                  <MapPin size={12} /> {l.adresse || l.client_adresse}
                </div>
                <div style={{ background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.25)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#f59e0b', marginBottom:10 }}>
                  ⚠ Raison : {RAISONS.find(r => r.value === l.raison_echec)?.label || l.raison_echec}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                  <button onClick={() => window.location.href = 'tel:' + l.client_telephone} className="btn-ghost" style={{ justifyContent:'center' }}>
                    <Phone size={13} /> Rappeler
                  </button>
                  <button onClick={() => marquerLivree(l.id)} className="btn-green">
                    <CheckCircle size={13} /> Livrée
                  </button>
                  <button onClick={async () => {
                    if (!confirm('Annuler cette livraison ?')) return;
                    await fetch('/api/livraisons/' + l.id, {
                      method: 'PUT', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ statut: 'annulee' }),
                    });
                    fetchLivraisons();
                  }} className="btn-red">
                    <XCircle size={13} /> Annuler
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {modalId && selected && (
        <div className="overlay" onClick={() => { setModalId(null); setRaison(''); }}>
          <div className="modal-bottom" onClick={e => e.stopPropagation()}>
            <div style={{ width:40, height:4, background:'var(--border)', borderRadius:2, margin:'0 auto 20px' }} />
            <div style={{ marginBottom:16 }}>
              <div style={{ fontWeight:800, fontSize:17, color:'var(--text-primary)', marginBottom:4 }}>Signaler un problème</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>Commande #{selected.commande_id} — {selected.client_nom}</div>
            </div>
            <div style={{ marginBottom:16 }}>
              {RAISONS.map(r => (
                <button key={r.value} onClick={() => setRaison(r.value)} className={`raison-btn${raison===r.value?' selected':''}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <button onClick={() => { setModalId(null); setRaison(''); }} className="btn-ghost" style={{ justifyContent:'center', padding:'12px' }}>Annuler</button>
              <button onClick={() => marquerProbleme(modalId)} disabled={!raison} className="btn-red" style={{ opacity:raison?1:.4 }}>
                <XCircle size={14} /> Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}