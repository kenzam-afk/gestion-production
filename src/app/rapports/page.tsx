"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Factory, Package, ShoppingCart, Users } from "lucide-react";

interface Commande {
  id: number;
  client_nom: string;
  statut: string;
  total: number;
  created_at: string;
}

interface Produit {
  id: number;
}

interface Client {
  id: number;
}

interface OrdreFabrication {
  id: number;
  produit_nom: string;
  statut: string;
  created_at: string;
}

export default function Rapports() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [ordres, setOrdres] = useState<OrdreFabrication[]>([]);
  const [error, setError] = useState("");

  async function fetchArray<T>(url: string, label: string): Promise<T[]> {
    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setError(
          (prev) => prev || data?.error || `Impossible de charger ${label}`,
        );
        return [];
      }

      if (!Array.isArray(data)) {
        setError((prev) => prev || `Format de reponse invalide pour ${label}`);
        return [];
      }

      return data as T[];
    } catch {
      setError(
        (prev) => prev || `Erreur reseau lors du chargement de ${label}`,
      );
      return [];
    }
  }

  async function fetchData() {
    setError("");
    const [listCommandes, listProduits, listClients, listOrdres] =
      await Promise.all([
        fetchArray<Commande>("/api/commandes", "les commandes"),
        fetchArray<Produit>("/api/produits", "les produits"),
        fetchArray<Client>("/api/clients", "les clients"),
        fetchArray<OrdreFabrication>(
          "/api/fabrication",
          "les ordres de fabrication",
        ),
      ]);

    setCommandes(listCommandes);
    setProduits(listProduits);
    setClients(listClients);
    setOrdres(listOrdres);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const chiffreAffaires = commandes.reduce(
      (sum, c) => sum + Number(c.total || 0),
      0,
    );
    const commandesLivrees = commandes.filter(
      (c) => c.statut === "livree",
    ).length;
    const fabricationActive = ordres.filter(
      (o) => o.statut === "planifie" || o.statut === "en_cours",
    ).length;

    return {
      produits: produits.length,
      clients: clients.length,
      commandes: commandes.length,
      commandesLivrees,
      fabricationActive,
      chiffreAffaires,
    };
  }, [clients, commandes, ordres, produits]);

  const recentCommandes = useMemo(() => {
    return [...commandes]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 6);
  }, [commandes]);

  const recentOrdres = useMemo(() => {
    return [...ordres]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 6);
  }, [ordres]);

  const cards = [
    {
      title: "Produits",
      value: stats.produits,
      icon: Package,
      color: "bg-blue-500",
    },
    {
      title: "Clients",
      value: stats.clients,
      icon: Users,
      color: "bg-green-500",
    },
    {
      title: "Commandes",
      value: stats.commandes,
      icon: ShoppingCart,
      color: "bg-orange-500",
    },
    {
      title: "Fabrication active",
      value: stats.fabricationActive,
      icon: Factory,
      color: "bg-purple-500",
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Rapports</h1>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <BarChart3 size={18} /> Actualiser
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow p-6 flex items-center gap-4"
            >
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Commandes recentes
          </h2>
          {recentCommandes.length === 0 ? (
            <p className="text-gray-400">Aucune commande</p>
          ) : (
            <div className="space-y-3">
              {recentCommandes.map((c) => (
                <div
                  key={c.id}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      #{c.id} - {c.client_nom}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-700">
                      {c.total} DA
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.statut.replace("_", " ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Fabrication recente
          </h2>
          {recentOrdres.length === 0 ? (
            <p className="text-gray-400">Aucun ordre de fabrication</p>
          ) : (
            <div className="space-y-3">
              {recentOrdres.map((o) => (
                <div
                  key={o.id}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div>
                    <p className="font-medium text-gray-800">{o.produit_nom}</p>
                    <p className="text-xs text-gray-500">Ordre #{o.id}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {o.statut.replace("_", " ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Synthese</h2>
        <p className="text-gray-600">
          Chiffre d affaires total:{" "}
          <span className="font-bold text-gray-800">
            {stats.chiffreAffaires} DA
          </span>
        </p>
        <p className="text-gray-600">
          Commandes livrees:{" "}
          <span className="font-bold text-gray-800">
            {stats.commandesLivrees}
          </span>
        </p>
      </div>
    </div>
  );
}
