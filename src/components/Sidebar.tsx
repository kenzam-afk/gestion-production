'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  Factory, Truck, BarChart3, LogOut, Layers, UserCheck, BarChart2,
  AlertTriangle, X, RefreshCw,
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useEffect, useState, useRef } from 'react';

const navigation = [
  { name: 'Dashboard',          href: '/admin',                    icon: LayoutDashboard, color: '#a855f7' },
  { name: 'Produits',           href: '/admin/produits',           icon: Package,         color: '#ec4899' },
  { name: 'Matières',           href: '/admin/matieres-premieres', icon: Layers,          color: '#06b6d4' },
  { name: 'Stock',              href: '/admin/stock',              icon: BarChart2,        color: '#10b981' },
  { name: 'Clients',            href: '/admin/clients',            icon: Users,           color: '#f59e0b' },
  { name: 'Commandes',          href: '/admin/commandes',          icon: ShoppingCart,    color: '#a855f7' },
  { name: 'Fabrication',        href: '/admin/fabrication',        icon: Factory,         color: '#ec4899' },
  { name: 'Livraisons',         href: '/admin/livraisons',         icon: Truck,           color: '#06b6d4' },
  { name: 'Livreurs',           href: '/admin/livreur',            icon: UserCheck,       color: '#10b981' },
  { name: 'Rapports',           href: '/admin/rapports',           icon: BarChart3,       color: '#f59e0b' },
];

interface Alerte {
  type: 'stock_critique' | 'stock_rupture' | 'commande_retard' | 'fabrication_retard';
  titre: string;
  detail: string;
  niveau: 'danger' | 'warning';
  lien: string;
}

function AlertBell() {
  const [alertes, setAlertes]   = useState<Alerte[]>([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const ref                     = useRef<HTMLDivElement>(null);

  async function fetchAlertes() {
    setLoading(true);
    try {
      const res  = await fetch('/api/alertes');
      const data = await res.json();
      setAlertes(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    setLoading(false);
  }

  useEffect(() => {
    fetchAlertes();
    const t = setInterval(fetchAlertes, 60000); // refresh toutes les minutes
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const nb = alertes.length;
  const nbDanger  = alertes.filter(a => a.niveau === 'danger').length;

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <style>{`
        .ab-btn {
          width: 36px; height: 36px; border-radius: 10px;
          background: ${nb > 0 ? 'rgba(239,68,68,.12)' : 'rgba(255,255,255,.06)'};
          border: 1px solid ${nb > 0 ? 'rgba(239,68,68,.35)' : 'rgba(255,255,255,.1)'};
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; position: relative; transition: all .15s;
        }
        .ab-btn:hover { background: rgba(239,68,68,.2); border-color: rgba(239,68,68,.5); }
        .ab-badge {
          position: absolute; top: -4px; right: -4px;
          background: #ef4444; color: white;
          font-size: 9px; font-weight: 700;
          min-width: 16px; height: 16px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          padding: 0 3px;
          animation: ab-pulse 1.5s infinite;
        }
        @keyframes ab-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,.5); }
          50%      { box-shadow: 0 0 0 5px rgba(239,68,68,0); }
        }
        .ab-dropdown {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 340px;
          background: #0a0a1e;
          border: 1px solid rgba(239,68,68,.2);
          border-radius: 16px;
          box-shadow: 0 24px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(239,68,68,.1);
          z-index: 999; overflow: hidden;
          animation: ab-fadeIn .15s ease;
        }
        @keyframes ab-fadeIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .ab-item {
          padding: 11px 14px;
          border-bottom: 1px solid rgba(255,255,255,.04);
          transition: background .15s; cursor: default;
          display: flex; gap: 10px; align-items: flex-start;
        }
        .ab-item:hover { background: rgba(255,255,255,.03); }
        .ab-item:last-child { border-bottom: none; }
      `}</style>

      <button className="ab-btn" onClick={() => { setOpen(o => !o); }}>
        <AlertTriangle size={15} color={nb > 0 ? '#ef4444' : 'rgba(255,255,255,0.5)'} />
        {nb > 0 && <span className="ab-badge">{nb > 9 ? '9+' : nb}</span>}
      </button>

      {open && (
        <div className="ab-dropdown">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(239,68,68,.15)', background: 'rgba(239,68,68,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <AlertTriangle size={14} color="#ef4444" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5' }}>
                Alertes système
              </span>
              {nb > 0 && (
                <span style={{ background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>
                  {nb}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={fetchAlertes} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5c5a7a' }}>
                <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5c5a7a' }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Liste */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {alertes.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#5c5a7a' }}>
                <AlertTriangle size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: .3 }} />
                <p style={{ fontSize: 13, margin: 0 }}>Aucune alerte active</p>
                <p style={{ fontSize: 11, margin: '4px 0 0', opacity: .6 }}>Tout fonctionne normalement</p>
              </div>
            ) : alertes.map((a, i) => (
              <Link key={i} href={a.lien} onClick={() => setOpen(false)}
                style={{ textDecoration: 'none', display: 'block' }}>
                <div className="ab-item">
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: a.niveau === 'danger' ? 'rgba(239,68,68,.15)' : 'rgba(245,158,11,.15)',
                    border: `1px solid ${a.niveau === 'danger' ? 'rgba(239,68,68,.3)' : 'rgba(245,158,11,.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <AlertTriangle size={14} color={a.niveau === 'danger' ? '#ef4444' : '#f59e0b'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: a.niveau === 'danger' ? '#fca5a5' : '#fcd34d', lineHeight: 1.3 }}>
                      {a.titre}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#5c5a7a', marginTop: 2, lineHeight: 1.4 }}>
                      {a.detail}
                    </div>
                  </div>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                    background: a.niveau === 'danger' ? '#ef4444' : '#f59e0b',
                    boxShadow: `0 0 6px ${a.niveau === 'danger' ? '#ef4444' : '#f59e0b'}`,
                  }} />
                </div>
              </Link>
            ))}
          </div>

          {/* Footer */}
          {nb > 0 && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#5c5a7a' }}>
                {nbDanger > 0 && `${nbDanger} critique${nbDanger > 1 ? 's' : ''}`}
                {nbDanger > 0 && alertes.length - nbDanger > 0 && ' · '}
                {alertes.length - nbDanger > 0 && `${alertes.length - nbDanger} avertissement${alertes.length - nbDanger > 1 ? 's' : ''}`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .sidebar-nav {
          background: #080812;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky; top: 0; z-index: 100;
          font-family: 'Outfit', sans-serif;
        }
        .sidebar-inner {
          display: flex; align-items: center;
          padding: 0 20px; height: 60px; gap: 8px;
          max-width: 1800px; margin: 0 auto; position: relative;
        }
        .sidebar-top-line {
          height: 2px;
          background: linear-gradient(90deg, #7c3aed, #ec4899, #06b6d4, transparent);
        }
        .logo-wrap {
          display: flex; align-items: center; gap: 10px;
          flex-shrink: 0; margin-right: 12px; text-decoration: none;
        }
        .logo-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px rgba(124,58,237,0.4);
          position: relative; overflow: hidden;
        }
        .logo-icon::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%);
        }
        .logo-name { font-weight: 800; font-size: 15px; color: #f1f0ff; letter-spacing: -0.02em; line-height: 1; }
        .logo-sub  { font-size: 9px; color: #7c3aed; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }
        .divider-v { width: 1px; height: 28px; background: rgba(255,255,255,0.08); flex-shrink: 0; margin: 0 4px; }
        .nav-scroll {
          display: flex; align-items: center; gap: 1px;
          overflow-x: auto; flex: 1; scrollbar-width: none; padding: 4px 0;
        }
        .nav-scroll::-webkit-scrollbar { display: none; }
        .nav-link {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 12px; border-radius: 9px; text-decoration: none;
          font-size: 12.5px; font-weight: 500; color: rgba(160,157,192,0.8);
          font-family: 'Outfit', sans-serif; white-space: nowrap;
          transition: all 0.2s; position: relative; border: 1px solid transparent;
        }
        .nav-link:hover { color: #f1f0ff; background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); }
        .nav-link.active { background: rgba(124,58,237,0.15); border-color: rgba(124,58,237,0.3); color: #f1f0ff; }
        .nav-link.active::before {
          content: ''; position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%);
          width: 20px; height: 2px; border-radius: 1px;
          background: linear-gradient(90deg, #7c3aed, #ec4899);
        }
        .nav-icon-wrap { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border-radius: 6px; flex-shrink: 0; }
        .profile-chip {
          display: flex; align-items: center; gap: 8px;
          padding: 5px 10px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 10px;
          flex-shrink: 0; cursor: default;
        }
        .avatar {
          width: 28px; height: 28px; border-radius: 8px;
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: white;
          font-family: 'Outfit', sans-serif; box-shadow: 0 0 10px rgba(124,58,237,0.3);
        }
        .profile-name { font-size: 12px; font-weight: 600; color: #e2e0ff; line-height: 1.1; }
        .profile-role { font-size: 9px; color: #7c3aed; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
        .logout-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 12px; border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.07);
          background: transparent; cursor: pointer;
          font-size: 12px; font-weight: 500; color: rgba(160,157,192,0.7);
          font-family: 'Outfit', sans-serif; transition: all 0.2s;
          white-space: nowrap; flex-shrink: 0;
        }
        .logout-btn:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #fca5a5; }
      `}</style>

      <header>
        <div className="sidebar-top-line" />
        <nav className="sidebar-nav">
          <div className="sidebar-inner">

            {/* Logo */}
            <Link href="/admin" className="logo-wrap">
              <div className="logo-icon">
                <Package size={18} color="white" style={{ position: 'relative', zIndex: 1 }} />
              </div>
              <div>
                <div className="logo-name">Gestion Pro</div>
                <div className="logo-sub">Production</div>
              </div>
            </Link>

            <div className="divider-v" />

            {/* Navigation */}
            <nav className="nav-scroll">
              {navigation.map(item => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link key={item.name} href={item.href} className={`nav-link${isActive ? ' active' : ''}`}>
                    <div className="nav-icon-wrap" style={{ background: isActive ? item.color + '22' : 'transparent' }}>
                      <Icon size={14} color={isActive ? item.color : 'currentColor'} />
                    </div>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="divider-v" />

            {/* Alertes + Notifications */}
            <AlertBell />
            <NotificationBell />

            {/* Profil */}
            {session?.user && (
              <div className="profile-chip">
                <div className="avatar">
                  {session.user.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div>
                  <div className="profile-name">{session.user.name || 'Admin'}</div>
                  <div className="profile-role">{(session.user as any)?.role || 'admin'}</div>
                </div>
              </div>
            )}

            <button onClick={() => signOut({ callbackUrl: '/' })} className="logout-btn">
              <LogOut size={13} />
              Quitter
            </button>

          </div>
        </nav>
      </header>
    </>
  );
}