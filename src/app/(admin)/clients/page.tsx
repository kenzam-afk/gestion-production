"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Client {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
  });

  async function fetchClients() {
    try {
      setError("");
      const res = await fetch("/api/clients");
      const data = await res.json();

      if (!res.ok) {
        setClients([]);
        setError(data?.error || "Impossible de charger les clients");
        return;
      }

      setClients(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) {
        setError("Format de reponse invalide depuis l API");
      }
    } catch {
      setClients([]);
      setError("Erreur reseau lors du chargement des clients");
    }
  }

  useEffect(() => {
    fetchClients();
  }, []);

  function openAdd() {
    setEditClient(null);
    setForm({ nom: "", email: "", telephone: "", adresse: "" });
    setShowModal(true);
  }

  function openEdit(c: Client) {
    setEditClient(c);
    setForm({
      nom: c.nom,
      email: c.email,
      telephone: c.telephone,
      adresse: c.adresse,
    });
    setShowModal(true);
  }

  async function handleSubmit() {
    const url = editClient ? `/api/clients/${editClient.id}` : "/api/clients";
    const method = editClient ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    fetchClients();
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ce client ?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    fetchClients();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> Ajouter
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {error && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-gray-600">Nom</th>
              <th className="text-left p-4 text-gray-600">Email</th>
              <th className="text-left p-4 text-gray-600">Téléphone</th>
              <th className="text-left p-4 text-gray-600">Adresse</th>
              <th className="text-left p-4 text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center p-8 text-gray-400">
                  Aucun client
                </td>
              </tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{c.nom}</td>
                <td className="p-4">{c.email}</td>
                <td className="p-4">{c.telephone}</td>
                <td className="p-4">{c.adresse}</td>
                <td className="p-4 flex gap-2">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
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
            <h2 className="text-xl font-bold mb-4">
              {editClient ? "Modifier" : "Ajouter"} un client
            </h2>
            <div className="space-y-3">
              <input
                className="w-full border rounded-lg p-2"
                placeholder="Nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
              <input
                className="w-full border rounded-lg p-2"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                className="w-full border rounded-lg p-2"
                placeholder="Téléphone"
                value={form.telephone}
                onChange={(e) =>
                  setForm({ ...form, telephone: e.target.value })
                }
              />
              <textarea
                className="w-full border rounded-lg p-2"
                placeholder="Adresse"
                value={form.adresse}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border rounded-lg py-2 text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
