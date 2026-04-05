'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Truck, CheckCircle, Clock } from 'lucide-react';

interface Livraison {
  id: number;
  commande_id: number;
  adresse: string;
  statut: string;
  date_livraison: string;
  created_at: string;
}

export default function LivreurPage() {
  const { data: session } = useSession();
  const [livraisons, setLivraisons] = useState<Livraison[]>([]);
  const [activeTab, setActiveTab] = useState<'en_cours' | 'livree'>('en_cours');

  async function fetchLivraisons() {
    const res = await fetch('/api/livraisons');
    const data = await res.json();
    setLivraisons(data);
  }

  useEffect(() => { fetchLivraisons(); }, []);

  async function handleStatut(id: number, statut: string) {
    await fetch(`/api/livraisons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        statut,
        date_livraison: new Date().toISOString().split('T')[0],
      }),
    });
    fetchLivraisons();
  }

  const livraisonsFiltered = livraisons.filter(l =>
    activeTab === 'en_cours'
      ? l.statut === 'en_attente' || l.statut === 'en_cours'
      : l.statut === 'livree'
  );

  const statutColors: Record<string, string> = {
    en_attente: 'bg-yellow-100 text-yellow-700',
    en_cours: 'bg-blue-100 text-blue-700',
    livree: 'bg-green-100 text-green-700',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bonjour, {session?.user?.name} 👋</h1>
        <p className="text-gray-500 mt-1">Gérez vos livraisons du jour</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Truck size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">En cours</p>
            <p className="text-2xl font-bold">{livraisons.filter(l => l.statut !== 'livree').length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
          <div className="bg-green-100 p-3 rounded-lg">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Livrées</p>
            <p className="text-2xl font-bold">{livraisons.filter(l => l.statut === 'livree').length}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('en_cours')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'en_cours' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
        >
          En cours
        </button>
        <button
          onClick={() => setActiveTab('livree')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'livree' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
        >
          Livrées
        </button>
      </div>

      <div className="space-y-4">
        {livraisonsFiltered.length === 0 && (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
            Aucune livraison
          </div>
        )}
        {livraisonsFiltered.map(l => (
          <div key={l.id} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-gray-800">Commande #{l.commande_id}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutColors[l.statut]}`}>
                    {l.statut.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-gray-500 text-sm flex items-center gap-1">
                  <Clock size={14} /> {l.adresse}
                </p>
              </div>
              <div className="flex gap-2">
                {l.statut === 'en_attente' && (
                  <button
                    onClick={() => handleStatut(l.id, 'en_cours')}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
                  >
                    Démarrer
                  </button>
                )}
                {l.statut === 'en_cours' && (
                  <button
                    onClick={() => handleStatut(l.id, 'livree')}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700"
                  >
                    Marquer livrée
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}