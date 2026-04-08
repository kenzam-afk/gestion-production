'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Package, ShoppingCart } from 'lucide-react';

export default function Rapports() {
  const [stats, setStats] = useState({
    totalCommandes: 0,
    totalProduits: 0,
    totalClients: 0,
    chiffreAffaires: 0,
    commandesParStatut: {} as Record<string, number>,
    produitsStockFaible: [] as any[],
    dernièresCommandes: [] as any[],
  });

  useEffect(() => {
    async function fetchStats() {
      const [commandes, produits, clients] = await Promise.all([
        fetch('/api/commandes').then(r => r.json()),
        fetch('/api/produits').then(r => r.json()),
        fetch('/api/clients').then(r => r.json()),
      ]);

      const chiffreAffaires = commandes
        .filter((c: any) => c.statut === 'livree')
        .reduce((acc: number, c: any) => acc + parseFloat(c.total), 0);

      const commandesParStatut = commandes.reduce((acc: any, c: any) => {
        acc[c.statut] = (acc[c.statut] || 0) + 1;
        return acc;
      }, {});

      const produitsStockFaible = produits.filter(
        (p: any) => p.stock <= p.stock_minimum
      );

      setStats({
        totalCommandes: commandes.length,
        totalProduits: produits.length,
        totalClients: clients.length,
        chiffreAffaires,
        commandesParStatut,
        produitsStockFaible,
        dernièresCommandes: commandes.slice(0, 5),
      });
    }
    fetchStats();
  }, []);

  const statutLabels: Record<string, string> = {
    en_attente: 'En attente',
    confirmee: 'Confirmée',
    en_fabrication: 'En fabrication',
    livree: 'Livrée',
    annulee: 'Annulée',
  };

  const statutColors: Record<string, string> = {
    en_attente: 'bg-yellow-500',
    confirmee: 'bg-blue-500',
    en_fabrication: 'bg-purple-500',
    livree: 'bg-green-500',
    annulee: 'bg-red-500',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Rapports & Analytiques</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <p className="text-gray-500 text-sm">Chiffre d'affaires</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.chiffreAffaires.toFixed(2)} DA</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <ShoppingCart size={20} className="text-blue-600" />
            </div>
            <p className="text-gray-500 text-sm">Total commandes</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalCommandes}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Package size={20} className="text-purple-600" />
            </div>
            <p className="text-gray-500 text-sm">Total produits</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalProduits}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <BarChart3 size={20} className="text-orange-600" />
            </div>
            <p className="text-gray-500 text-sm">Total clients</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalClients}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Commandes par statut */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Commandes par statut</h2>
          <div className="space-y-3">
            {Object.entries(stats.commandesParStatut).map(([statut, count]) => (
              <div key={statut}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{statutLabels[statut] || statut}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`${statutColors[statut] || 'bg-gray-500'} h-2 rounded-full`}
                    style={{ width: `${(count / stats.totalCommandes) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Produits stock faible */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Produits stock faible
            {stats.produitsStockFaible.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                {stats.produitsStockFaible.length}
              </span>
            )}
          </h2>
          {stats.produitsStockFaible.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Tous les stocks sont suffisants</p>
          ) : (
            <div className="space-y-3">
              {stats.produitsStockFaible.map((p: any) => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="font-medium text-gray-800">{p.nom}</span>
                  <span className="text-red-600 font-bold">{p.stock} / {p.stock_minimum}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dernières commandes */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Dernières commandes</h2>
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 text-gray-600">#</th>
              <th className="text-left p-3 text-gray-600">Client</th>
              <th className="text-left p-3 text-gray-600">Statut</th>
              <th className="text-left p-3 text-gray-600">Total</th>
              <th className="text-left p-3 text-gray-600">Date</th>
            </tr>
          </thead>
          <tbody>
            {stats.dernièresCommandes.map((c: any) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-3">#{c.id}</td>
                <td className="p-3">{c.client_nom}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    c.statut === 'livree' ? 'bg-green-100 text-green-700' :
                    c.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {statutLabels[c.statut] || c.statut}
                  </span>
                </td>
                <td className="p-3">{c.total} DA</td>
                <td className="p-3">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}