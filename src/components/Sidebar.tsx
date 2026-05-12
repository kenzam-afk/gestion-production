'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  Factory, Truck, BarChart3, LogOut, Layers, UserCheck,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard',          href: '/admin',                    icon: LayoutDashboard },
  { name: 'Produits',           href: '/admin/produits',           icon: Package },
  { name: 'Stock',              href: '/admin/stock',              icon: BarChart3 },
  { name: 'Matières Premières', href: '/admin/matieres-premieres', icon: Layers },
  { name: 'Clients',            href: '/admin/clients',            icon: Users },
  { name: 'Commandes',          href: '/admin/commandes',          icon: ShoppingCart },
  { name: 'Fabrication',        href: '/admin/fabrication',        icon: Factory },
  { name: 'Livraisons',         href: '/admin/livraisons',         icon: Truck },
  { name: 'Livreurs',           href: '/admin/livreur',            icon: UserCheck },
  { name: 'Rapports',           href: '/admin/rapports',           icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

        * { box-sizing: border-box; }

        .sidebar-root {
          background: #080f1e;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky;
          top: 0;
          z-index: 100;
          font-family: 'DM Sans', sans-serif;
        }

        .sidebar-inner {
          display: flex;
          align-items: center;
          padding: 0 20px;
          height: 58px;
          gap: 12px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .logo-mark {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          background: linear-gradient(140deg, #1a56db 0%, #3b82f6 100%);
          box-shadow: 0 0 0 1px rgba(59,130,246,0.3), 0 4px 12px rgba(59,130,246,0.35);
        }

        .logo-mark::after {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: 8px;
          background: linear-gradient(140deg, rgba(255,255,255,0.15) 0%, transparent 60%);
        }

        .logo-text {
          flex-shrink: 0;
          margin-right: 4px;
        }

        .logo-title {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: #f1f5f9;
          line-height: 1;
          letter-spacing: -0.01em;
        }

        .logo-sub {
          font-size: 9px;
          color: #3b82f6;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .divider {
          width: 1px;
          height: 28px;
          background: rgba(255,255,255,0.07);
          flex-shrink: 0;
        }

        .nav-scroll {
          display: flex;
          align-items: center;
          gap: 1px;
          overflow-x: auto;
          flex: 1;
          scrollbar-width: none;
          padding: 4px 0;
        }
        .nav-scroll::-webkit-scrollbar { display: none; }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 11px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 12.5px;
          font-weight: 500;
          color: #4d7aa3;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
          transition: color 0.15s, background 0.15s;
          position: relative;
        }

        .nav-link:hover {
          color: #93c5fd;
          background: rgba(59,130,246,0.08);
        }

        .nav-link.active {
          color: #bfdbfe;
          background: rgba(59,130,246,0.13);
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 2px;
          border-radius: 1px;
          background: #3b82f6;
        }

        .profile-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 9px;
          flex-shrink: 0;
        }

        .avatar {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: linear-gradient(135deg, #1e3a6e, #1a56db);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #93c5fd;
          font-family: 'Space Grotesk', sans-serif;
        }

        .profile-name {
          font-size: 12px;
          font-weight: 600;
          color: #cbd5e1;
          line-height: 1.1;
        }

        .profile-role {
          font-size: 9px;
          color: #3b82f6;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 11px;
          border-radius: 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 12.5px;
          font-weight: 500;
          color: #4d7aa3;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.15s, background 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .logout-btn:hover {
          background: rgba(239,68,68,0.1);
          color: #fca5a5;
        }

        /* Sous-barre accent */
        .accent-bar {
          height: 2px;
          background: linear-gradient(90deg, #1a56db 0%, #3b82f6 40%, transparent 100%);
        }
      `}</style>

      <header className="sidebar-root">
        <div className="sidebar-inner">

          {/* Logo */}
          <div className="logo-mark">
            <Package size={17} color="white" style={{ position: 'relative', zIndex: 1 }} />
          </div>
          <div className="logo-text">
            <div className="logo-title">Gestion Pro</div>
            <div className="logo-sub">Production</div>
          </div>

          <div className="divider" />

          {/* Navigation */}
          <nav className="nav-scroll">
            {navigation.map(item => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`nav-link${isActive ? ' active' : ''}`}
                >
                  <Icon size={14} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="divider" />

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
            <LogOut size={14} />
            <span>Quitter</span>
          </button>

        </div>
        <div className="accent-bar" />
      </header>
    </>
  );
}