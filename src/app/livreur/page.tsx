'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { MapPin, Phone, CheckCircle, XCircle, Navigation, Package, Clock, LogOut } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

interface Livraison {
  id: number; statut: string; raison_echec: string | null;
  adresse: string; date_livraison: string | null; created_at: string;
  commande_id: number; commande_total: number; commande_statut: string;
  client_nom: string; client_telephone: string; client_email: string; client_adresse: string;
}

export default function LivreurPage() {
  const { data: session } = useSession();
  const [livraisons, setLivraisons]   = useState<Livraison[]>([]);
  const [loading, setLoading]         = useState(true);
  const [positionLivreur, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [modalId, setModalId]         = useState<number | null>(null);
  const [raisonEchec, setRaisonEchec] = useState('');
  const [showRaison, setShowRaison]   = useState(false);
  const [activeTab, setActiveTab]     = useState('actives');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        pos => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true },
      );
    }
  }, []);

  async function fetchLivraisons() {
    if (!session?.user) return;
    const userId = (session.user as any).id;
    const res    = await fetch('/api/livraisons/livreur/' + userId);
    const data   = await res.json();
    if (Array.isArray(data)) setLivraisons(data);
    setLoading(false);
  }

  useEffect(() => { if (session?.user) fetchLivraisons(); }, [session]);

  async function marquerLivree(id: number) {
    await fetch('/api/livraisons/' + id, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'livree', date_livraison: new Date().toISOString().split('T')[0], raison_echec: null }),
    });
    setModalId(null); fetchLivraisons();
  }

  async function marquerProbleme(id: number) {
    if (!raisonEchec) { alert('Veuillez choisir une raison'); return; }
    await fetch('/api/livraisons/' + id, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'en_attente', date_livraison: null, raison_echec: raisonEchec }),
    });
    setShowRaison(false); setRaisonEchec(''); setModalId(null); fetchLivraisons();
  }

  function ouvrirItineraire(adresse: string) {
    const url = positionLivreur
      ? `https://www.google.com/maps/dir/${positionLivreur.lat},${positionLivreur.lng}/${encodeURIComponent(adresse)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresse)}`;
    window.open(url, '_blank');
  }

  const livraisonsActives  = livraisons.filter(l => l.statut === 'en_attente' || l.statut === 'en_cours');
  const livraisonsTerminees = livraisons.filter(l => l.statut === 'livree');
  const livraisonsProblemes = livraisons.filter(l => l.raison_echec && l.statut !== 'livree');
  const livraisonSelectionnee = livraisons.find(l => l.id === modalId);

  const raisonsEchec = [
    { value: 'client_absent',       label: 'Client absent' },
    { value: 'annulation_client',   label: 'Annulation client' },
    { value: 'adresse_introuvable', label: 'Adresse introuvable' },
    { value: 'refus_client',        label: 'Refus du client' },
  ];

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Chargement...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">Espace Livreur</h1>
            <p className="text-gray-400 text-sm">{session?.user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Cloche notifications */}
            <NotificationBell accentColor="#06b6d4" />

            {positionLivreur ? (
              <div className="flex items-center gap-1 text-green-400 text-xs">
                <Navigation size={14} /><span>GPS actif</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-400 text-xs">
                <Navigation size={14} /><span>GPS inactif</span>
              </div>
            )}
            <button onClick={() => signOut({ callbackUrl: '/' })} className="flex items-center gap-1 text-gray-400 hover:text-white">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{livraisonsActives.length}</p>
            <p className="text-xs text-gray-400 mt-1">À livrer</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{livraisonsTerminees.length}</p>
            <p className="text-xs text-gray-400 mt-1">Livrées</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{livraisonsProblemes.length}</p>
            <p className="text-xs text-gray-400 mt-1">Problèmes</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b">
        {[
          { id: 'actives',   label: `À livrer (${livraisonsActives.length})`,    color: 'text-blue-600 border-blue-600' },
          { id: 'terminees', label: `Livrées (${livraisonsTerminees.length})`,   color: 'text-green-600 border-green-600' },
          { id: 'problemes', label: `Problèmes (${livraisonsProblemes.length})`, color: 'text-red-600 border-red-600' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === t.id ? `${t.color} border-b-2` : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">

        {activeTab === 'actives' && (
          <>
            {livraisonsActives.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                <CheckCircle size={40} className="mx-auto mb-3 text-green-300" />
                <p className="font-medium">Toutes les livraisons sont terminées !</p>
              </div>
            )}
            {livraisonsActives.map(l => (
              <div key={l.id} className="bg-white rounded-xl shadow overflow-hidden">
                <div className="bg-blue-600 px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Package size={18} className="text-white" />
                    <span className="text-white font-bold">Commande #{l.commande_id}</span>
                  </div>
                  <span className="text-blue-100 font-bold">{l.commande_total} DA</span>
                </div>
                <div className="p-4">
                  <p className="font-bold text-gray-800 text-lg">{l.client_nom}</p>
                  {l.raison_echec && (
                    <div className="mt-1 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1 inline-block">
                      <p className="text-orange-600 text-xs font-medium">
                        Tentative précédente : {raisonsEchec.find(r => r.value === l.raison_echec)?.label}
                      </p>
                    </div>
                  )}
                  <div className="flex items-start gap-2 mt-3 mb-3 bg-gray-50 rounded-lg p-3">
                    <MapPin size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700 text-sm">{l.adresse || l.client_adresse}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button onClick={() => window.location.href = 'tel:' + l.client_telephone}
                      className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 py-2 rounded-lg hover:bg-green-100">
                      <Phone size={16} /><span className="text-sm font-medium">{l.client_telephone}</span>
                    </button>
                    <button onClick={() => ouvrirItineraire(l.adresse || l.client_adresse)}
                      className="flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 py-2 rounded-lg hover:bg-blue-100">
                      <Navigation size={16} /><span className="text-sm font-medium">Itinéraire</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => marquerLivree(l.id)}
                      className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 font-medium">
                      <CheckCircle size={20} /> Livrée
                    </button>
                    <button onClick={() => { setModalId(l.id); setShowRaison(true); }}
                      className="flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 font-medium">
                      <XCircle size={20} /> Problème
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'terminees' && (
          <>
            {livraisonsTerminees.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                <Clock size={40} className="mx-auto mb-3 text-gray-300" />
                <p>Aucune livraison terminée</p>
              </div>
            )}
            {livraisonsTerminees.map(l => (
              <div key={l.id} className="bg-white rounded-xl shadow overflow-hidden">
                <div className="bg-green-600 px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-white" />
                    <span className="text-white font-bold">Commande #{l.commande_id}</span>
                  </div>
                  <span className="text-green-100 font-bold">{l.commande_total} DA</span>
                </div>
                <div className="p-4">
                  <p className="font-bold text-gray-800">{l.client_nom}</p>
                  <div className="flex items-start gap-2 mt-2 bg-gray-50 rounded-lg p-3">
                    <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-500 text-sm">{l.adresse || l.client_adresse}</p>
                  </div>
                  {l.date_livraison && (
                    <p className="text-green-600 text-xs mt-2 font-medium">
                      Livré le {new Date(l.date_livraison).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'problemes' && (
          <>
            {livraisonsProblemes.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                <p>Aucun problème signalé</p>
              </div>
            )}
            {livraisonsProblemes.map(l => (
              <div key={l.id} className="bg-white rounded-xl shadow overflow-hidden">
                <div className="bg-orange-500 px-4 py-3 flex justify-between items-center">
                  <span className="text-white font-bold">Commande #{l.commande_id}</span>
                  <span className="text-orange-100 font-bold">{l.commande_total} DA</span>
                </div>
                <div className="p-4">
                  <p className="font-bold text-gray-800">{l.client_nom}</p>
                  <div className="flex items-start gap-2 mt-2 bg-gray-50 rounded-lg p-3">
                    <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-500 text-sm">{l.adresse || l.client_adresse}</p>
                  </div>
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm font-medium">
                      Raison : {raisonsEchec.find(r => r.value === l.raison_echec)?.label}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button onClick={() => window.location.href = 'tel:' + l.client_telephone}
                      className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 py-2 rounded-lg">
                      <Phone size={16} /><span className="text-sm">Rappeler</span>
                    </button>
                    <button onClick={() => marquerLivree(l.id)}
                      className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg">
                      <CheckCircle size={16} /><span className="text-sm">Livrée</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Modal raison echec */}
      {showRaison && livraisonSelectionnee && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Signaler un problème</h3>
            <p className="text-gray-500 text-sm mb-4">Commande #{livraisonSelectionnee.commande_id} — {livraisonSelectionnee.client_nom}</p>
            <div className="space-y-2 mb-6">
              {raisonsEchec.map(r => (
                <button key={r.value} onClick={() => setRaisonEchec(r.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${raisonEchec === r.value ? 'border-red-500 bg-red-50 text-red-700 font-medium' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowRaison(false); setRaisonEchec(''); setModalId(null); }}
                className="flex-1 border rounded-xl py-3 text-gray-600 hover:bg-gray-50">Annuler</button>
              <button onClick={() => marquerProbleme(livraisonSelectionnee.id)} disabled={!raisonEchec}
                className="flex-1 bg-red-500 text-white rounded-xl py-3 hover:bg-red-600 disabled:opacity-50 font-medium">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}