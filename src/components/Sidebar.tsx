'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Factory,
  Truck,
  BarChart3,
  LogOut,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Produits', href: '/produits', icon: Package },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Commandes', href: '/commandes', icon: ShoppingCart },
  { name: 'Fabrication', href: '/fabrication', icon: Factory },
  { name: 'Livraisons', href: '/livraisons', icon: Truck },
  { name: 'Rapports', href: '/rapports', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">🏭 Gestion</h1>
        <p className="text-gray-400 text-sm mt-1">Production</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white w-full transition-colors"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
        <p className="text-gray-500 text-xs text-center mt-2">PFE 2025</p>
      </div>
    </div>
  );
}