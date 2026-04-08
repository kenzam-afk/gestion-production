'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Livraison {
  id: number;
  commande_id: number;
  commande_total: number;
  adresse: string;
  statut: string;
  date_livraison: string;
  created_at: string;
}

interface Commande {
  id: number;
  client_nom: string;
  total: number;
  statut: string;
}

interface Utilisateur {
  id: number;
  nom: string;
  role: string;
}

export default function Livraisons() {
  const [livraisons, setLivraisons] = useState<Livraison[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [livreurs, setLivreurs] = useState<Utilisateur[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ commande_id: '', livreur_id: '', adresse: '' });

  async function fetchAll() {
    const [liv, cmd] = await Promise.all([
      fetch('/api/livraisons').then(r => r.json()),
      fetch('/api/commandes').then(r => r.json()),
    ]);
    setLivraisons(liv);
    setCommandes(cmd.filter((c: Commande) => c.statut === 'livree' || c.statut === 'en_fabrication'));

    const users = await fetch('/api/utilisateurs').then(r => r.json());
    setLivreurs(users.filter((u: Utilisateur) => u.role === 'livreur'));
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleSubmit() {
    await fetch('/api/livraisons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commande_id: parseInt(form.commande_id),
        livreur_id: parseInt(form.livreur_id),
        adresse: form.adresse,
      }),
    });
    setShowModal(false);
    setForm({ commande_id: '', livreur_id: '', adresse: '' });
    fetchAll();
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer cette livraison ?')) return;
    await fetch(`/api/livraisons/${id}`, { method: 'DELETE' });
    fetchAll();
  }

  const statutColors: Record<string, string> = {
    en_attente: 'bg-yellow-100 text-yellow-700',
    en_cours: 'bg-blue-100 text-blue-700',
    livree: 'bg-green-100 text-green-700',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Livraisons</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Nouvelle livraison
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-gray-600">#</th>
              <th className="text-left p-4 text-gray-600">Commande</th>
              <th className="text-left p-4 text-gray-600">Adresse</th>
              <th className="text-left p-4 text-gray-600">Statut</th>
              <th className="text-left p-4 text-gray-600">Date</th>
              <th className="text-left p-4 text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {livraisons.length === 0 && (
              <tr><td colSpan={6} className="text-center p-8 text-gray-400">Aucune livraison</td></tr>
            )}
            {livraisons.map(l => (
              <tr key={l.id} className="border-b hover:bg-gray-50">
                <td className="p-4">#{l.id}</td>
                <td className="p-4">Commande #{l.commande_id}</td>
                <td className="p-4">{l.adresse}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutColors[l.statut]}`}>
                    {l.statut.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4">
                  {l.date_livraison ? new Date(l.date_livraison).toLocaleDateString('fr-FR') : '-'}
                </td>
                <td className="p-4">
                  <button onClick={() => handleDelete(l.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nouvelle livraison</h2>
            <div className="space-y-3">
              <select className="w-full border rounded-lg p-2" value={form.commande_id} onChange={e => setForm({...form, commande_id: e.target.value})}>
                <option value="">Sélectionner une commande</option>
                {commandes.map(c => <option key={c.id} value={c.id}>Commande #{c.id} — {c.client_nom}</option>)}
              </select>
              <select className="w-full border rounded-lg p-2" value={form.livreur_id} onChange={e => setForm({...form, livreur_id: e.target.value})}>
                <option value="">Sélectionner un livreur</option>
                {livreurs.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
              </select>
              <textarea className="w-full border rounded-lg p-2" placeholder="Adresse de livraison" value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 border rounded-lg py-2 text-gray-600 hover:bg-gray-50">Annuler</button>
              <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}