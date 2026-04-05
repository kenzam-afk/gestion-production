'use client';

import { useEffect, useState } from 'react';
import { Factory } from 'lucide-react';

interface OrdreFabrication {
  id: number;
  produit_nom: string;
  commande_ref: number;
  quantite: number;
  statut: string;
  date_debut: string;
  date_fin: string;
  created_at: string;
}

export default function Fabrication() {
  const [ordres, setOrdres] = useState<OrdreFabrication[]>([]);

  async function fetchOrdres() {
    const res = await fetch('/api/fabrication');
    const data = await res.json();
    setOrdres(data);
  }

  useEffect(() => { fetchOrdres(); }, []);

  async function handleStatut(id: number, statut: string, date_debut?: string, date_fin?: string) {
    await fetch(`/api/fabrication/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        statut,
        date_debut: date_debut || new Date().toISOString().split('T')[0],
        date_fin: date_fin || null,
      }),
    });
    fetchOrdres();
  }

  const statutColors: Record<string, string> = {
    planifie: 'bg-yellow-100 text-yellow-700',
    en_cours: 'bg-blue-100 text-blue-700',
    termine: 'bg-green-100 text-green-700',
  };

  const statutLabels: Record<string, string> = {
    planifie: 'Planifié',
    en_cours: 'En cours',
    termine: 'Terminé',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ordres de fabrication</h1>
        <div className="flex items-center gap-2 text-gray-500">
          <Factory size={20} />
          <span>{ordres.length} ordres</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {ordres.length === 0 && (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
            Aucun ordre de fabrication — confirmez une commande pour en générer
          </div>
        )}
        {ordres.map((o) => (
          <div key={o.id} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-gray-800 text-lg">{o.produit_nom}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutColors[o.statut]}`}>
                    {statutLabels[o.statut]}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">Commande #{o.commande_ref} • Quantité : <strong>{o.quantite}</strong></p>
                <p className="text-gray-400 text-xs mt-1">
                  Créé le {new Date(o.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <div className="flex gap-2">
                {o.statut === 'planifie' && (
                  <button
                    onClick={() => handleStatut(o.id, 'en_cours')}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
                  >
                    Démarrer
                  </button>
                )}
                {o.statut === 'en_cours' && (
                  <button
                    onClick={() => handleStatut(o.id, 'termine', o.date_debut, new Date().toISOString().split('T')[0])}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700"
                  >
                    Terminer
                  </button>
                )}
              </div>
            </div>

            {o.date_debut && (
              <div className="mt-3 pt-3 border-t flex gap-6 text-sm text-gray-500">
                <span>Début : {new Date(o.date_debut).toLocaleDateString('fr-FR')}</span>
                {o.date_fin && <span>Fin : {new Date(o.date_fin).toLocaleDateString('fr-FR')}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}