'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  Factory, Truck, BarChart3, LogOut, Layers, UserCheck,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard',          href: '/admin',                icon: LayoutDashboard },
  { name: 'Produits',           href: '/admin/produits',       icon: Package },
  { name: 'Matières Premières', href: '/matieres-premieres',   icon: Layers },
  { name: 'Clients',            href: '/clients',              icon: Users },
  { name: 'Commandes',          href: '/admin/commandes',      icon: ShoppingCart },
  { name: 'Fabrication',        href: '/admin/fabrication',    icon: Factory },
  { name: 'Livraisons',         href: '/admin/livraisons',     icon: Truck },
  { name: 'Livreurs',           href: '/admin/livreur',       icon: UserCheck },
  { name: 'Rapports',           href: '/admin/rapports',       icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .nav-link {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 13px; border-radius: 10px;
          text-decoration: none; font-size: 13px; font-weight: 500;
          transition: all 0.2s; color: #7ea6cc;
          font-family: 'Sora', sans-serif; white-space: nowrap;
        }
        .nav-link:hover {
          background: rgba(96,165,250,0.1);
          color: #bfdbfe;
        }
        .nav-link.active {
          background: linear-gradient(135deg, rgba(59,130,246,0.28), rgba(30,64,175,0.22));
          color: #93c5fd;
          box-shadow: inset 0 0 0 1px rgba(147,197,253,0.18);
        }
        .logout-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 13px; border-radius: 10px; border: none;
          background: transparent; cursor: pointer; font-size: 13px;
          font-weight: 500; color: #7ea6cc; font-family: 'Sora', sans-serif;
          transition: all 0.2s; white-space: nowrap;
        }
        .logout-btn:hover {
          background: rgba(239,68,68,0.12); color: #fca5a5;
        }
        .top-nav-scroll {
          display: flex; align-items: center; gap: 2px;
          overflow-x: auto; flex: 1;
          scrollbar-width: none;
        }
        .top-nav-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <nav style={{
        background: 'linear-gradient(90deg, #0d1f3c 0%, #0f2547 60%, #0a1d38 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        position: 'sticky', top: 0, zIndex: 100,
        fontFamily: "'Sora', sans-serif",
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '0 20px', height: 62, gap: 16,
        }}>

          {/* ── Logo ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginRight: 8 }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
            }}>
              <Package size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#e2e8f0', lineHeight: 1.1 }}>Gestion Pro</div>
              <div style={{ fontSize: 9, color: '#4a7aaa', fontWeight: 500 }}>Production & Livraison</div>
            </div>
          </div>

          {/* ── Séparateur ── */}
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

          {/* ── Liens navigation ── */}
          <div className="top-nav-scroll">
            {navigation.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`nav-link${isActive ? ' active' : ''}`}
                >
                  <Icon size={15} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* ── Séparateur ── */}
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

          {/* ── Profil + Déconnexion ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {session?.user && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'linear-gradient(135deg, #1e3a6e, #2d5a9e)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#93c5fd',
                }}>
                  {session.user.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', lineHeight: 1.1 }}>
                    {session.user.name || 'Admin'}
                  </div>
                  <div style={{ fontSize: 9, color: '#4a7aaa' }}>
                    {(session.user as any)?.role || 'admin'}
                  </div>
                </div>
              </div>
            )}

            <button onClick={() => signOut({ callbackUrl: '/' })} className="logout-btn">
              <LogOut size={15} />
              <span>Quitter</span>
            </button>
          </div>

        </div>
      </nav>
    </>
  );
}