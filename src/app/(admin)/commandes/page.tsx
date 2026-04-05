'use client';

import { useEffect, useState } from 'react';
import { Plus, Eye, Trash2 } from 'lucide-react';

interface Commande {
  id: number;
  client_nom: string;
  statut: string;
  total: number;
  created_at: string;
}

interface Client {
  id: number;
  nom: string;
}

interface Produit {
  id: number;
  nom: string;
  prix: number;
}

export default function Commandes() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ client_id: '', produits: [{ produit_id: '', quantite: 1, prix_unitaire: 0 }] });

  async function fetchAll() {
    const [cmd, cli, prod] = await Promise.all([
      fetch('/api/commandes').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/produits').then(r => r.json()),
    ]);
    setCommandes(cmd);
    setClients(cli);
    setProduits(prod);
  }

  useEffect(() => { fetchAll(); }, []);

  function addProduitLine() {
    setForm({ ...form, produits: [...form.produits, { produit_id: '', quantite: 1, prix_unitaire: 0 }] });
  }

  function updateProduitLine(index: number, field: string, value: string | number) {
    const newProduits = [...form.produits];
    if (field === 'produit_id') {
      const produit = produits.find(p => p.id === parseInt(value as string));
      newProduits[index] = { ...newProduits[index], produit_id: value as string, prix_unitaire: produit?.prix || 0 };
    } else {
      newProduits[index] = { ...newProduits[index], [field]: value };
    }
    setForm({ ...form, produits: newProduits });
  }

  async function handleSubmit() {
    await fetch('/api/commandes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: parseInt(form.client_id),
        produits: form.produits.map(p => ({
          produit_id: parseInt(p.produit_id),
          quantite: p.quantite,
          prix_unitaire: p.prix_unitaire,
        })),
      }),
    });
    setShowModal(false);
    setForm({ client_id: '', produits: [{ produit_id: '', quantite: 1, prix_unitaire: 0 }] });
    fetchAll();
  }

  async function handleStatut(id: number, statut: string) {
    await fetch(`/api/commandes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    });
    fetchAll();
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer cette commande ?')) return;
    await fetch(`/api/commandes/${id}`, { method: 'DELETE' });
    fetchAll();
  }

  const statutColors: Record<string, string> = {
    en_attente: 'bg-yellow-100 text-yellow-700',
    confirmee: 'bg-blue-100 text-blue-700',
    en_fabrication: 'bg-purple-100 text-purple-700',
    livree: 'bg-green-100 text-green-700',
    annulee: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Commandes</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Nouvelle commande
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-gray-600">#</th>
              <th className="text-left p-4 text-gray-600">Client</th>
              <th className="text-left p-4 text-gray-600">Statut</th>
              <th className="text-left p-4 text-gray-600">Total</th>
              <th className="text-left p-4 text-gray-600">Date</th>
              <th className="text-left p-4 text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {commandes.length === 0 && (
              <tr><td colSpan={6} className="text-center p-8 text-gray-400">Aucune commande</td></tr>
            )}
            {commandes.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">#{c.id}</td>
                <td className="p-4">{c.client_nom}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutColors[c.statut]}`}>
                    {c.statut.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4">{c.total} DA</td>
                <td className="p-4">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                <td className="p-4 flex gap-2">
                  {c.statut === 'en_attente' && (
                    <button onClick={() => handleStatut(c.id, 'confirmee')} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                      Confirmer
                    </button>
                  )}
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Nouvelle commande</h2>
            <div className="space-y-3">
              <select className="w-full border rounded-lg p-2" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})}>
                <option value="">Sélectionner un client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>

              <div className="space-y-2">
                {form.produits.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <select className="flex-1 border rounded-lg p-2" value={p.produit_id} onChange={e => updateProduitLine(i, 'produit_id', e.target.value)}>
                      <option value="">Produit</option>
                      {produits.map(pr => <option key={pr.id} value={pr.id}>{pr.nom}</option>)}
                    </select>
                    <input type="number" className="w-20 border rounded-lg p-2" placeholder="Qté" value={p.quantite} onChange={e => updateProduitLine(i, 'quantite', parseInt(e.target.value))} />
                    <span className="flex items-center text-sm text-gray-500 w-24">{p.prix_unitaire} DA</span>
                  </div>
                ))}
                <button onClick={addProduitLine} className="text-blue-600 text-sm hover:underline">+ Ajouter un produit</button>
              </div>
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