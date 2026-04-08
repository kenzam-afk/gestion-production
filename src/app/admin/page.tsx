'use client';

import { useEffect, useState } from 'react';
import { Package, Users, ShoppingCart, Factory } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    produits: 0,
    clients: 0,
    commandes: 0,
    fabrication: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const [produits, clients, commandes, fabrication] = await Promise.all([
        fetch('/api/produits').then(r => r.json()),
        fetch('/api/clients').then(r => r.json()),
        fetch('/api/commandes').then(r => r.json()),
        fetch('/api/fabrication').then(r => r.json()),
      ]);

      setStats({
        produits: produits.length,
        clients: clients.length,
        commandes: commandes.length,
        fabrication: fabrication.length,
      });
    }
    fetchStats();
  }, []);

  const cards = [
    { title: 'Produits', value: stats.produits, icon: Package, color: 'bg-blue-500' },
    { title: 'Clients', value: stats.clients, icon: Users, color: 'bg-green-500' },
    { title: 'Commandes', value: stats.commandes, icon: ShoppingCart, color: 'bg-orange-500' },
    { title: 'Fabrication', value: stats.fabrication, icon: Factory, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
              <div className={`${card.color} p-3 rounded-lg`}>
                <Icon size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Bienvenue sur la plateforme</h2>
        <p className="text-gray-500">
          Utilisez le menu à gauche pour naviguer entre les différentes sections de la plateforme.
        </p>
      </div>
    </div>
  );
}