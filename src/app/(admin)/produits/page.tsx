'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Produit {
  id: number;
  nom: string;
  description: string;
  prix: number;
  stock: number;
  stock_minimum: number;
  cout_production: number;
}

export default function Produits() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editProduit, setEditProduit] = useState<Produit | null>(null);
  const [form, setForm] = useState({
    nom: '', description: '', prix: '', stock: '', stock_minimum: '', cout_production: ''
  });

  async function fetchProduits() {
    const res = await fetch('/api/produits');
    const data = await res.json();
    setProduits(data);
  }

  useEffect(() => { fetchProduits(); }, []);

  function openAdd() {
    setEditProduit(null);
    setForm({ nom: '', description: '', prix: '', stock: '', stock_minimum: '', cout_production: '' });
    setShowModal(true);
  }

  function openEdit(p: Produit) {
    setEditProduit(p);
    setForm({
      nom: p.nom, description: p.description, prix: String(p.prix),
      stock: String(p.stock), stock_minimum: String(p.stock_minimum),
      cout_production: String(p.cout_production)
    });
    setShowModal(true);
  }

  async function handleSubmit() {
    const url = editProduit ? `/api/produits/${editProduit.id}` : '/api/produits';
    const method = editProduit ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        prix: parseFloat(form.prix),
        stock: parseInt(form.stock),
        stock_minimum: parseInt(form.stock_minimum),
        cout_production: parseFloat(form.cout_production),
      }),
    });
    setShowModal(false);
    fetchProduits();
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer ce produit ?')) return;
    await fetch(`/api/produits/${id}`, { method: 'DELETE' });
    fetchProduits();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Produits</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Ajouter
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-gray-600">Nom</th>
              <th className="text-left p-4 text-gray-600">Prix</th>
              <th className="text-left p-4 text-gray-600">Stock</th>
              <th className="text-left p-4 text-gray-600">Stock min</th>
              <th className="text-left p-4 text-gray-600">Coût prod.</th>
              <th className="text-left p-4 text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {produits.length === 0 && (
              <tr><td colSpan={6} className="text-center p-8 text-gray-400">Aucun produit</td></tr>
            )}
            {produits.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{p.nom}</td>
                <td className="p-4">{p.prix} DA</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.stock <= p.stock_minimum ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="p-4">{p.stock_minimum}</td>
                <td className="p-4">{p.cout_production} DA</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => openEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
            <h2 className="text-xl font-bold mb-4">{editProduit ? 'Modifier' : 'Ajouter'} un produit</h2>
            <div className="space-y-3">
              <input className="w-full border rounded-lg p-2" placeholder="Nom" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
              <textarea className="w-full border rounded-lg p-2" placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <input className="w-full border rounded-lg p-2" placeholder="Prix" type="number" value={form.prix} onChange={e => setForm({...form, prix: e.target.value})} />
              <input className="w-full border rounded-lg p-2" placeholder="Stock" type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
              <input className="w-full border rounded-lg p-2" placeholder="Stock minimum" type="number" value={form.stock_minimum} onChange={e => setForm({...form, stock_minimum: e.target.value})} />
              <input className="w-full border rounded-lg p-2" placeholder="Coût de production" type="number" value={form.cout_production} onChange={e => setForm({...form, cout_production: e.target.value})} />
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