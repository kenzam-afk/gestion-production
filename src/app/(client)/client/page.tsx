'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ShoppingCart, Package } from 'lucide-react';

interface Produit {
  id: number;
  nom: string;
  description: string;
  prix: number;
  stock: number;
}

interface Commande {
  id: number;
  statut: string;
  total: number;
  created_at: string;
}

export default function ClientPage() {
  const { data: session } = useSession();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [panier, setPanier] = useState<{produit: Produit, quantite: number}[]>([]);
  const [showPanier, setShowPanier] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalogue' | 'commandes'>('catalogue');

  useEffect(() => {
    fetch('/api/produits').then(r => r.json()).then(setProduits);
    fetch('/api/commandes').then(r => r.json()).then(setCommandes);
  }, []);

  function ajouterAuPanier(produit: Produit) {
    const existe = panier.find(p => p.produit.id === produit.id);
    if (existe) {
      setPanier(panier.map(p => p.produit.id === produit.id ? {...p, quantite: p.quantite + 1} : p));
    } else {
      setPanier([...panier, { produit, quantite: 1 }]);
    }
  }

  async function passerCommande() {
    if (panier.length === 0) return;
    await fetch('/api/commandes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: (session?.user as any)?.id,
        produits: panier.map(p => ({
          produit_id: p.produit.id,
          quantite: p.quantite,
          prix_unitaire: p.produit.prix,
        })),
      }),
    });
    setPanier([]);
    setShowPanier(false);
    fetch('/api/commandes').then(r => r.json()).then(setCommandes);
  }

  const statutColors: Record<string, string> = {
    en_attente: 'bg-yellow-100 text-yellow-700',
    confirmee: 'bg-blue-100 text-blue-700',
    en_fabrication: 'bg-purple-100 text-purple-700',
    livree: 'bg-green-100 text-green-700',
    annulee: 'bg-red-100 text-red-700',
  };

  const total = panier.reduce((acc, p) => acc + p.produit.prix * p.quantite, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bonjour, {session?.user?.name} 👋</h1>
        <button onClick={() => setShowPanier(true)} className="relative flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <ShoppingCart size={18} />
          Panier
          {panier.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {panier.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('catalogue')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'catalogue' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>
          Catalogue
        </button>
        <button onClick={() => setActiveTab('commandes')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'commandes' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>
          Mes commandes
        </button>
      </div>

      {activeTab === 'catalogue' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {produits.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Package size={20} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-800">{p.nom}</h3>
              </div>
              <p className="text-gray-500 text-sm mb-3">{p.description}</p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-blue-600">{p.prix} DA</span>
                <button
                  onClick={() => ajouterAuPanier(p)}
                  disabled={p.stock === 0}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {p.stock === 0 ? 'Rupture' : 'Ajouter'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'commandes' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 text-gray-600">#</th>
                <th className="text-left p-4 text-gray-600">Statut</th>
                <th className="text-left p-4 text-gray-600">Total</th>
                <th className="text-left p-4 text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {commandes.length === 0 && (
                <tr><td colSpan={4} className="text-center p-8 text-gray-400">Aucune commande</td></tr>
              )}
              {commandes.map(c => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">#{c.id}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutColors[c.statut]}`}>
                      {c.statut.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">{c.total} DA</td>
                  <td className="p-4">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPanier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Mon panier</h2>
            {panier.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Panier vide</p>
            ) : (
              <div className="space-y-3 mb-4">
                {panier.map(p => (
                  <div key={p.produit.id} className="flex justify-between items-center border-b pb-2">
                    <span>{p.produit.nom} x{p.quantite}</span>
                    <span className="font-medium">{p.produit.prix * p.quantite} DA</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{total} DA</span>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowPanier(false)} className="flex-1 border rounded-lg py-2 text-gray-600 hover:bg-gray-50">Fermer</button>
              <button onClick={passerCommande} disabled={panier.length === 0} className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 disabled:opacity-50">
                Commander
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}