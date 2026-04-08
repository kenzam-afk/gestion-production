'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Package, LogIn, X, MapPin, Search } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [role, setRole] = useState(null as 'admin' | 'livreur' | null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [produits, setProduits] = useState([] as any[]);
  const [panier, setPanier] = useState([] as any[]);
  const [showPanier, setShowPanier] = useState(false);
  const [commandeEnvoyee, setCommandeEnvoyee] = useState(false);
  const [commandeId, setCommandeId] = useState(null as number | null);
  const [localisationLoading, setLocalisationLoading] = useState(false);
  const [showSuivi, setShowSuivi] = useState(false);
  const [numeroSuivi, setNumeroSuivi] = useState('');
  const [resultatSuivi, setResultatSuivi] = useState(null as any);
  const [suiviErreur, setSuiviErreur] = useState('');

  const [infoClient, setInfoClient] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    latitude: '',
    longitude: '',
  });

  useEffect(function() {
    fetch('/api/produits')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (Array.isArray(data)) setProduits(data);
      });
  }, []);

  function obtenirLocalisation() {
    if (!navigator.geolocation) {
      alert('La geolocalisation n\'est pas supportee par votre navigateur');
      return;
    }
    setLocalisationLoading(true);
    navigator.geolocation.getCurrentPosition(
      function(position) {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setInfoClient(function(prev) {
          return {
            ...prev,
            latitude: lat,
            longitude: lng,
            adresse: 'Lat: ' + lat + ', Lng: ' + lng,
          };
        });
        setLocalisationLoading(false);
      },
      function() {
        alert('Impossible d\'obtenir votre position. Veuillez saisir votre adresse manuellement.');
        setLocalisationLoading(false);
      }
    );
  }

  async function handleLogin() {
    setLoading(true);
    setError('');
    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    if (res?.error) {
      setError('Email ou mot de passe incorrect');
      setLoading(false);
      return;
    }
    const sessionRes = await fetch('/api/auth/session');
    const session = await sessionRes.json();
    if (session?.user?.role === 'admin') router.push('/admin');
    else if (session?.user?.role === 'livreur') router.push('/livreur');
    setLoading(false);
    setShowLogin(false);
  }

  function ajouterAuPanier(produit: any) {
    const existe = panier.find(function(p) { return p.produit.id === produit.id; });
    if (existe) {
      setPanier(panier.map(function(p) {
        if (p.produit.id === produit.id) {
          return { produit: p.produit, quantite: p.quantite + 1 };
        }
        return p;
      }));
    } else {
      setPanier([...panier, { produit: produit, quantite: 1 }]);
    }
  }

  function diminuerQuantite(id: number) {
    setPanier(panier.map(function(p) {
      if (p.produit.id === id) {
        return { produit: p.produit, quantite: Math.max(1, p.quantite - 1) };
      }
      return p;
    }));
  }

  function augmenterQuantite(id: number) {
    setPanier(panier.map(function(p) {
      if (p.produit.id === id) {
        return { produit: p.produit, quantite: p.quantite + 1 };
      }
      return p;
    }));
  }

  function saisirQuantite(id: number, valeur: string) {
    const q = parseInt(valeur);
    setPanier(panier.map(function(p) {
      if (p.produit.id === id) {
        return { produit: p.produit, quantite: isNaN(q) || q < 1 ? 1 : q };
      }
      return p;
    }));
  }

  function supprimerDuPanier(id: number) {
    setPanier(panier.filter(function(p) { return p.produit.id !== id; }));
  }

  const total = panier.reduce(function(acc, p) {
    return acc + p.produit.prix * p.quantite;
  }, 0);

  function formulaireValide() {
    return (
      infoClient.prenom.trim() !== '' &&
      infoClient.nom.trim() !== '' &&
      infoClient.telephone.trim() !== '' &&
      panier.length > 0
    );
  }

  async function passerCommande() {
    const nomComplet = infoClient.prenom.trim() + ' ' + infoClient.nom.trim();
    const adresseComplete = infoClient.adresse.trim() !== ''
      ? infoClient.adresse
      : 'Non renseignee';

    const resClient = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: nomComplet,
        email: infoClient.email,
        telephone: infoClient.telephone,
        adresse: adresseComplete,
      }),
    });
    const dataClient = await resClient.json();

    const resCommande = await fetch('/api/commandes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: dataClient.id,
        produits: panier.map(function(p) {
          return {
            produit_id: p.produit.id,
            quantite: p.quantite,
            prix_unitaire: p.produit.prix,
          };
        }),
      }),
    });
    const dataCommande = await resCommande.json();

    setPanier([]);
    setInfoClient({
      prenom: '',
      nom: '',
      telephone: '',
      email: '',
      adresse: '',
      latitude: '',
      longitude: '',
    });
    setCommandeId(dataCommande.id);
    setCommandeEnvoyee(true);
  }

  async function rechercherCommande() {
    setSuiviErreur('');
    setResultatSuivi(null);
    if (numeroSuivi.trim() === '') {
      setSuiviErreur('Veuillez saisir un numero de commande');
      return;
    }
    const res = await fetch('/api/commandes/' + numeroSuivi.trim());
    if (!res.ok) {
      setSuiviErreur('Commande introuvable. Verifiez le numero.');
      return;
    }
    const data = await res.json();
    setResultatSuivi(data);
  }

  const statutLabels: Record<string, string> = {
    en_attente: 'En attente de confirmation',
    confirmee: 'Confirmee',
    en_fabrication: 'En cours de fabrication',
    livree: 'Livree',
    annulee: 'Annulee',
  };

  const statutColors: Record<string, string> = {
    en_attente: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    confirmee: 'bg-blue-100 text-blue-700 border-blue-300',
    en_fabrication: 'bg-purple-100 text-purple-700 border-purple-300',
    livree: 'bg-green-100 text-green-700 border-green-300',
    annulee: 'bg-red-100 text-red-700 border-red-300',
  };

  const statutEtapes = ['en_attente', 'confirmee', 'en_fabrication', 'livree'];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">🏭 Gestion Production</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={function() { setShowSuivi(true); }}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 text-sm font-medium"
          >
            <Search size={18} />
            Suivre ma commande
          </button>
          <button
            onClick={function() { setShowPanier(true); }}
            className="relative flex items-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <ShoppingCart size={22} />
            {panier.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {panier.length}
              </span>
            )}
          </button>
          <button
            onClick={function() { setShowLogin(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <LogIn size={18} />
            Connexion
          </button>
        </div>
      </nav>

      {/* Catalogue */}
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Nos Produits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {produits.map(function(p) {
            return (
              <div key={p.id} className="bg-white rounded-xl shadow p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Package size={20} className="text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-800">{p.nom}</h3>
                </div>
                <p className="text-gray-500 text-sm mb-4">{p.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-600 text-lg">{p.prix} DA</span>
                  <button
                    onClick={function() { ajouterAuPanier(p); }}
                    disabled={p.stock === 0}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {p.stock === 0 ? 'Rupture' : 'Ajouter'}
                  </button>
                </div>
              </div>
            );
          })}
          {produits.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">
              Aucun produit disponible
            </div>
          )}
        </div>
      </div>

      {/* Modal Panier */}
      {showPanier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Mon panier</h2>
              <button onClick={function() { setShowPanier(false); setCommandeEnvoyee(false); }}>
                <X size={20} />
              </button>
            </div>

            {commandeEnvoyee ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-green-600 font-bold text-lg mb-2">Commande envoyee !</p>
                <p className="text-gray-500 text-sm mb-2">
                  Votre commande a bien ete enregistree.
                </p>
                {commandeId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-1">Votre numero de commande :</p>
                    <p className="text-3xl font-bold text-blue-600">#{commandeId}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Gardez ce numero pour suivre votre commande
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={function() {
                      setCommandeEnvoyee(false);
                      setShowPanier(false);
                      setCommandeId(null);
                    }}
                    className="flex-1 border rounded-lg py-2 text-gray-600 hover:bg-gray-50"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={function() {
                      setCommandeEnvoyee(false);
                      setShowPanier(false);
                      setNumeroSuivi(commandeId ? String(commandeId) : '');
                      setCommandeId(null);
                      setShowSuivi(true);
                    }}
                    className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700"
                  >
                    Suivre ma commande
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {panier.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">Panier vide</p>
                ) : (
                  <div className="space-y-3 mb-4">
                    {panier.map(function(p) {
                      return (
                        <div key={p.produit.id} className="flex justify-between items-center border-b pb-3">
                          <span className="font-medium text-gray-800 w-24 truncate">{p.produit.nom}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={function() { diminuerQuantite(p.produit.id); }}
                              className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center font-bold hover:bg-gray-300"
                            >-</button>
                            <input
                              type="number"
                              min={1}
                              value={p.quantite}
                              onChange={function(e) { saisirQuantite(p.produit.id, e.target.value); }}
                              className="w-12 text-center border rounded p-1"
                            />
                            <button
                              onClick={function() { augmenterQuantite(p.produit.id); }}
                              className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center font-bold hover:bg-gray-300"
                            >+</button>
                            <span className="w-20 text-right text-sm font-medium text-gray-700">
                              {p.produit.prix * p.quantite} DA
                            </span>
                            <button
                              onClick={function() { supprimerDuPanier(p.produit.id); }}
                              className="text-red-400 hover:text-red-600 ml-1 font-bold"
                            >X</button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-blue-600">{total} DA</span>
                    </div>
                  </div>
                )}

                {/* Formulaire client */}
                <div className="border-t pt-4 mt-2">
                  <h3 className="font-semibold text-gray-700 mb-3">Vos informations</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Prenom *</label>
                        <input
                          type="text"
                          className="w-full border rounded-lg p-2"
                          placeholder="Prenom"
                          value={infoClient.prenom}
                          onChange={function(e) {
                            setInfoClient(function(prev) { return { ...prev, prenom: e.target.value }; });
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Nom *</label>
                        <input
                          type="text"
                          className="w-full border rounded-lg p-2"
                          placeholder="Nom"
                          value={infoClient.nom}
                          onChange={function(e) {
                            setInfoClient(function(prev) { return { ...prev, nom: e.target.value }; });
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Telephone *</label>
                      <input
                        type="tel"
                        className="w-full border rounded-lg p-2"
                        placeholder="0X XX XX XX XX"
                        value={infoClient.telephone}
                        onChange={function(e) {
                          setInfoClient(function(prev) { return { ...prev, telephone: e.target.value }; });
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Email (facultatif)</label>
                      <input
                        type="email"
                        className="w-full border rounded-lg p-2"
                        placeholder="votre@email.com"
                        value={infoClient.email}
                        onChange={function(e) {
                          setInfoClient(function(prev) { return { ...prev, email: e.target.value }; });
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Adresse de livraison</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 border rounded-lg p-2"
                          placeholder="Votre adresse ou cliquez Localiser"
                          value={infoClient.adresse}
                          onChange={function(e) {
                            setInfoClient(function(prev) { return { ...prev, adresse: e.target.value }; });
                          }}
                        />
                        <button
                          onClick={obtenirLocalisation}
                          disabled={localisationLoading}
                          className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm whitespace-nowrap"
                        >
                          <MapPin size={16} />
                          {localisationLoading ? '...' : 'Localiser'}
                        </button>
                      </div>
                      {infoClient.latitude !== '' && (
                        <p className="text-xs text-green-600 mt-1">
                          Position obtenue : {infoClient.latitude}, {infoClient.longitude}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={function() { setShowPanier(false); }}
                    className="flex-1 border rounded-lg py-2 text-gray-600 hover:bg-gray-50"
                  >
                    Fermer
                  </button>
                  <button
                    disabled={!formulaireValide()}
                    onClick={passerCommande}
                    className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 disabled:opacity-50"
                  >
                    Commander
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Suivi commande */}
      {showSuivi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Suivre ma commande</h2>
              <button onClick={function() {
                setShowSuivi(false);
                setResultatSuivi(null);
                setSuiviErreur('');
                setNumeroSuivi('');
              }}>
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="number"
                className="flex-1 border rounded-lg p-3"
                placeholder="Entrez votre numero de commande"
                value={numeroSuivi}
                onChange={function(e) { setNumeroSuivi(e.target.value); }}
              />
              <button
                onClick={rechercherCommande}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Search size={20} />
              </button>
            </div>

            {suiviErreur !== '' && (
              <p className="text-red-500 text-sm mb-4">{suiviErreur}</p>
            )}

            {resultatSuivi && (
              <div>
                {/* Infos commande */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-800 text-lg">Commande #{resultatSuivi.id}</p>
                      <p className="text-gray-500 text-sm">Client : {resultatSuivi.client_nom}</p>
                    </div>
                    <span className={'px-3 py-1 rounded-full text-sm font-medium border ' + (statutColors[resultatSuivi.statut] || 'bg-gray-100 text-gray-700')}>
                      {statutLabels[resultatSuivi.statut] || resultatSuivi.statut}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Total : <span className="font-bold text-blue-600">{resultatSuivi.total} DA</span>
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Passee le {new Date(resultatSuivi.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {/* Barre de progression */}
                {resultatSuivi.statut !== 'annulee' && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-600 mb-3">Progression :</p>
                    <div className="flex items-center justify-between">
                      {statutEtapes.map(function(etape, index) {
                        const etapeIndex = statutEtapes.indexOf(resultatSuivi.statut);
                        const fait = index <= etapeIndex;
                        const etapeLabels: Record<string, string> = {
                          en_attente: 'Recue',
                          confirmee: 'Confirmee',
                          en_fabrication: 'Fabrication',
                          livree: 'Livree',
                        };
                        return (
                          <div key={etape} className="flex flex-col items-center flex-1">
                            <div className={'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 ' +
                              (fait ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400')}>
                              {fait ? '✓' : index + 1}
                            </div>
                            <span className={'text-xs text-center ' + (fait ? 'text-blue-600 font-medium' : 'text-gray-400')}>
                              {etapeLabels[etape]}
                            </span>
                            {index < statutEtapes.length - 1 && (
                              <div className={'absolute'} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="relative mt-2">
                      <div className="h-1 bg-gray-200 rounded-full">
                        <div
                          className="h-1 bg-blue-600 rounded-full transition-all"
                          style={{
                            width: (
                              ((statutEtapes.indexOf(resultatSuivi.statut)) / (statutEtapes.length - 1)) * 100
                            ) + '%'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {resultatSuivi.statut === 'annulee' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-center">
                    <p className="text-red-600 font-medium">Cette commande a ete annulee.</p>
                  </div>
                )}

                {/* Produits de la commande */}
                {resultatSuivi.produits && resultatSuivi.produits.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Articles commandes :</p>
                    <div className="space-y-2">
                      {resultatSuivi.produits.map(function(p: any) {
                        return (
                          <div key={p.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                            <span className="text-gray-800">{p.produit_nom}</span>
                            <span className="text-gray-500 text-sm">
                              x{p.quantite} — {p.prix_unitaire * p.quantite} DA
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Connexion */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Connexion</h2>
              <button onClick={function() { setShowLogin(false); setRole(null); setError(''); }}>
                <X size={20} />
              </button>
            </div>

            {!role ? (
              <div className="space-y-3">
                <p className="text-gray-500 text-center mb-4">Vous etes ?</p>
                <button
                  onClick={function() { setRole('admin'); }}
                  className="w-full border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-medium hover:bg-blue-50"
                >
                  Administrateur
                </button>
                <button
                  onClick={function() { setRole('livreur'); }}
                  className="w-full border-2 border-green-600 text-green-600 py-3 rounded-lg font-medium hover:bg-green-50"
                >
                  Livreur
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={function() { setRole(null); }}
                  className="text-gray-500 text-sm hover:underline"
                >
                  Retour
                </button>
                <input
                  type="email"
                  className="w-full border rounded-lg p-3"
                  placeholder="Email"
                  value={form.email}
                  onChange={function(e) { setForm({ email: e.target.value, password: form.password }); }}
                />
                <input
                  type="password"
                  className="w-full border rounded-lg p-3"
                  placeholder="Mot de passe"
                  value={form.password}
                  onChange={function(e) { setForm({ email: form.email, password: e.target.value }); }}
                />
                {error !== '' && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}