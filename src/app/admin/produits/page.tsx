"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Produit {
  id: number;
  nom: string;
  description: string;
  categorie: string;
  unite: string;
  cout_matieres_premieres: number;
  cout_fabrication: number;
  cout_total: number;
  marge_base: number;
  marge_dynamique: number;
  prix_vente: number;
  stock_disponible: number;
  stock_minimum: number;
}

interface PrixCalc {
  cout_total: string;
  marge_dynamique: number;
  prix_vente: string;
  raisons: string[];
}

export default function Produits() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [error, setError] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [prixCalc, setPrixCalc] = useState<PrixCalc | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    description: "",
    categorie: "",
    unite: "unité",
    cout_matieres_premieres: "",
    cout_fabrication: "",
    marge_base: "20",
    stock_disponible: "",
    stock_minimum: "10",
  });

  useEffect(() => { fetchProduits(); }, []);

  async function fetchProduits() {
    try {
      const res = await fetch("/api/produits");
      const data = await res.json();
      setProduits(Array.isArray(data) ? data : []);
      if (!res.ok) setError(data?.error || "Erreur chargement");
    } catch {
      setError("Erreur réseau");
    }
  }

  async function calculerPrix() {
    if (!form.cout_matieres_premieres || !form.cout_fabrication) return;
    setCalcLoading(true);
    try {
      const res = await fetch("/api/produits/prix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cout_matieres_premieres: parseFloat(form.cout_matieres_premieres),
          cout_fabrication: parseFloat(form.cout_fabrication),
          categorie: form.categorie,
          marge_base: parseFloat(form.marge_base),
        }),
      });
      const data = await res.json();
      if (data.success) setPrixCalc(data);
    } finally {
      setCalcLoading(false);
    }
  }

  async function handleSubmit() {
    const res = await fetch("/api/produits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        cout_matieres_premieres: parseFloat(form.cout_matieres_premieres || "0"),
        cout_fabrication: parseFloat(form.cout_fabrication || "0"),
        marge_base: parseFloat(form.marge_base || "20"),
        stock_disponible: parseInt(form.stock_disponible || "0"),
        stock_minimum: parseInt(form.stock_minimum || "10"),
      }),
    });
    if (res.ok) {
      setShowModal(false);
      setPrixCalc(null);
      setForm({ nom: "", description: "", categorie: "", unite: "unité", cout_matieres_premieres: "", cout_fabrication: "", marge_base: "20", stock_disponible: "", stock_minimum: "10" });
      fetchProduits();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ce produit ?")) return;
    await fetch(`/api/produits/${id}`, { method: "DELETE" });
    fetchProduits();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Produits</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> Ajouter
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-gray-600">Nom</th>
              <th className="text-left p-4 text-gray-600">Catégorie</th>
              <th className="text-left p-4 text-gray-600">Coût MP</th>
              <th className="text-left p-4 text-gray-600">Coût Fab.</th>
              <th className="text-left p-4 text-gray-600">Marge</th>
              <th className="text-left p-4 text-gray-600">Prix Vente</th>
              <th className="text-left p-4 text-gray-600">Stock</th>
              <th className="text-left p-4 text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {produits.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-8 text-gray-400">
                  Aucun produit
                </td>
              </tr>
            ) : (
              produits.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{p.nom}</td>
                  <td className="p-4 text-gray-600">{p.categorie || '—'}</td>
                  <td className="p-4 text-gray-600">{p.cout_matieres_premieres} DA</td>
                  <td className="p-4 text-gray-600">{p.cout_fabrication} DA</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {p.marge_dynamique}%
                    </span>
                  </td>
                  <td className="p-4 font-bold text-green-700">{p.prix_vente} DA</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.stock_disponible <= p.stock_minimum
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {p.stock_disponible}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Ajouter un produit</h2>
            <div className="space-y-3">
              <input className="w-full border rounded-lg p-2" placeholder="Nom du produit *" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
              <input className="w-full border rounded-lg p-2" placeholder="Catégorie (ex: alimentaire, luxe...)" value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} />
              <textarea className="w-full border rounded-lg p-2" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <select className="w-full border rounded-lg p-2" value={form.unite} onChange={e => setForm({ ...form, unite: e.target.value })}>
                <option value="unité">Unité</option>
                <option value="kg">Kilogramme (kg)</option>
                <option value="litre">Litre</option>
                <option value="m2">Mètre carré (m²)</option>
                <option value="tonne">Tonne</option>
              </select>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Coût matières premières (DA)</label>
                  <input className="w-full border rounded-lg p-2" type="number" placeholder="Ex: 500" value={form.cout_matieres_premieres} onChange={e => setForm({ ...form, cout_matieres_premieres: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Coût fabrication (DA)</label>
                  <input className="w-full border rounded-lg p-2" type="number" placeholder="Ex: 200" value={form.cout_fabrication} onChange={e => setForm({ ...form, cout_fabrication: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Marge de base (%)</label>
                <input className="w-full border rounded-lg p-2" type="number" placeholder="Ex: 20" value={form.marge_base} onChange={e => setForm({ ...form, marge_base: e.target.value })} />
              </div>

              <button
                onClick={calculerPrix}
                disabled={calcLoading}
                className="w-full bg-gray-100 text-gray-700 rounded-lg py-2 hover:bg-gray-200 font-medium"
              >
                {calcLoading ? "Calcul en cours..." : "🧮 Calculer le prix dynamique"}
              </button>

              {/* Résultat calcul */}
              {prixCalc && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-semibold text-blue-800 mb-2">📊 Résultat du calcul :</p>
                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div className="text-center">
                      <p className="text-gray-500">Coût total</p>
                      <p className="font-bold">{prixCalc.cout_total} DA</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">Marge appliquée</p>
                      <p className="font-bold text-blue-600">{prixCalc.marge_dynamique}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">Prix de vente</p>
                      <p className="font-bold text-green-600">{prixCalc.prix_vente} DA</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {prixCalc.raisons.map((r, i) => (
                      <p key={i} className="text-xs text-blue-700">{r}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Stock disponible</label>
                  <input className="w-full border rounded-lg p-2" type="number" placeholder="0" value={form.stock_disponible} onChange={e => setForm({ ...form, stock_disponible: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Stock minimum</label>
                  <input className="w-full border rounded-lg p-2" type="number" placeholder="10" value={form.stock_minimum} onChange={e => setForm({ ...form, stock_minimum: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowModal(false); setPrixCalc(null); }} className="flex-1 border rounded-lg py-2 text-gray-600 hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}