"use client";

import { useEffect, useState } from "react";
import { Trash2, Package, ShoppingCart, RefreshCw, Search, Clock, CheckCircle2, Factory, Truck, ChevronDown } from "lucide-react";

interface LigneCommande { produit_nom: string; produit_description: string; unite: string; quantite: number; prix_unitaire: number; }
interface Commande {
  id: number; client_id: number; total: number; statut: string;
  adresse_livraison: string; created_at?: string;
  client_nom?: string; client_prenom?: string; client_titre?: string; type_client?: string;
  lignes?: LigneCommande[];
}

const STATUT_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  en_attente:     { label: "En attente",     color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  confirmee:      { label: "Confirmée",      color: "#1a56db", bg: "#eff6ff", border: "#bfdbfe" },
  en_fabrication: { label: "En fabrication", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  pret_livraison: { label: "Prêt livraison", color: "#0e7490", bg: "#ecfeff", border: "#a5f3fc" },
  livree:         { label: "Livrée",         color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
  annulee:        { label: "Annulée",        color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

// Transitions autorisées
const NEXT_STATUTS: Record<string, { label: string; statut: string; color: string }[]> = {
  en_attente:     [{ label: "✓ Confirmer",       statut: "confirmee",      color: "#1a56db" }, { label: "✕ Annuler", statut: "annulee", color: "#dc2626" }],
  confirmee:      [{ label: "⚙ Lancer fabrication", statut: "en_fabrication", color: "#7c3aed" }, { label: "✕ Annuler", statut: "annulee", color: "#dc2626" }],
  en_fabrication: [{ label: "📦 Prêt à livrer",  statut: "pret_livraison", color: "#0e7490" }],
  pret_livraison: [{ label: "🚚 Marquer livré",  statut: "livree",         color: "#059669" }],
  livree:         [],
  annulee:        [],
};

const DS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1.5px solid #e2e8f0;color:#64748b;border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:#1a56db;color:#1a56db;background:#eff6ff}
.btn-danger{display:inline-flex;align-items:center;gap:5px;background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:8px;padding:6px 11px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}
.btn-danger:hover{background:#fee2e2}
.input-field{width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-family:'DM Sans',sans-serif;font-size:13.5px;color:#1e293b;outline:none;transition:border .15s;background:#f8fafc}
.input-field:focus{border-color:#1a56db;background:white;box-shadow:0 0 0 3px rgba(26,86,219,.08)}
.tr-row:hover td{background:#f8fafc}
.filter-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:20px;font-size:12px;font-weight:500;border:1.5px solid #e2e8f0;background:white;cursor:pointer;font-family:'DM Sans',sans-serif;color:#64748b;transition:all .15s}
.filter-btn.active{background:#080f1e;color:white;border-color:#080f1e}
.filter-btn:hover:not(.active){border-color:#1a56db;color:#1a56db}
.action-btn{display:inline-flex;align-items:center;gap:5px;border:none;border-radius:8px;padding:6px 11px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;white-space:nowrap}
.action-btn:hover{opacity:.85;transform:translateY(-1px)}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function CommandesPage() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterStatut, setFilterStatut] = useState("tous");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/commandes");
      const data = await res.json();
      setCommandes(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    setLoading(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cette commande ?")) return;
    await fetch(`/api/commandes/${id}`, { method: "DELETE" });
    fetchAll();
  }

  async function changerStatut(id: number, statut: string) {
    await fetch(`/api/commandes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    fetchAll();
  }

  const statutsList = ["tous", ...Object.keys(STATUT_CFG)];
  const stats = {
    total:   commandes.length,
    attente: commandes.filter(c => c.statut === "en_attente").length,
    fabr:    commandes.filter(c => c.statut === "en_fabrication").length,
    livrees: commandes.filter(c => c.statut === "livree").length,
    ca:      commandes.reduce((a, c) => a + (Number(c.total) || 0), 0),
  };

  const filtered = commandes.filter(c => {
    const nomClient = c.type_client === "entreprise"
      ? c.client_titre || ""
      : `${c.client_prenom || ""} ${c.client_nom || ""}`.trim();
    const produits  = (c.lignes || []).map(l => l.produit_nom).join(" ");
    const text      = `${nomClient} ${produits} ${c.id}`.toLowerCase();
    const matchS    = filterStatut === "tous" || c.statut === filterStatut;
    return matchS && text.includes(search.toLowerCase());
  });

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", padding: "28px 32px", maxWidth: 1400 }}>
      <style>{DS}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#1a56db", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Administration</div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#080f1e,#1a56db)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingCart size={18} color="white" />
            </div>
            Commandes
          </h1>
          <p style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 3 }}>{stats.total} commandes au total</p>
        </div>
        <button onClick={fetchAll} className="btn-ghost">
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total",       value: stats.total,   color: "#1a56db", bg: "#eff6ff", border: "#bfdbfe" },
          { label: "En attente",  value: stats.attente,  color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
          { label: "Fabrication", value: stats.fabr,     color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
          { label: "Livrées",     value: stats.livrees,  color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
          { label: "CA total",    value: `${stats.ca.toLocaleString("fr-DZ")} DA`, color: "#0e7490", bg: "#ecfeff", border: "#a5f3fc" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: i === 4 ? 15 : 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", maxWidth: 280 }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input className="input-field" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {statutsList.map(s => (
            <button key={s} onClick={() => setFilterStatut(s)} className={`filter-btn${filterStatut === s ? " active" : ""}`}>
              {s === "tous" ? "Tous" : (STATUT_CFG[s]?.label || s)}
              {s !== "tous" && <span style={{ opacity: 0.7, fontSize: 11 }}>{commandes.filter(c => c.statut === s).length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#080f1e" }}>
              {["#", "Client", "Produits", "Statut", "Total", "Date", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px", fontSize: 10.5, fontWeight: 700, color: "#4d7aa3", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: h === "Total" ? "right" : "left", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 56 }}>
                <ShoppingCart size={32} style={{ display: "block", margin: "0 auto 10px", opacity: 0.2, color: "#94a3b8" }} />
                <span style={{ fontSize: 13, color: "#94a3b8" }}>Aucune commande</span>
              </td></tr>
            ) : filtered.map(cmd => {
              const cfg = STATUT_CFG[cmd.statut] || { label: cmd.statut, color: "#475569", bg: "#f1f5f9", border: "#e2e8f0" };
              const nomClient = cmd.type_client === "entreprise"
                ? cmd.client_titre || `Client #${cmd.client_id}`
                : `${cmd.client_prenom || ""} ${cmd.client_nom || ""}`.trim() || `Client #${cmd.client_id}`;
              const nextActions = NEXT_STATUTS[cmd.statut] || [];

              return (
                <tr key={cmd.id} className="tr-row" style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>#{cmd.id}</td>

                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{nomClient}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>ID {cmd.client_id}</div>
                  </td>

                  {/* Produits depuis lignes[] */}
                  <td style={{ padding: "13px 16px" }}>
                    {cmd.lignes && cmd.lignes.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {cmd.lignes.map((l, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 24, height: 24, background: "#eff6ff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Package size={11} color="#1a56db" />
                            </div>
                            <span style={{ fontSize: 12.5, fontWeight: 500, color: "#334155" }}>{l.produit_nom}</span>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>×{l.quantite}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12.5, color: "#94a3b8" }}>—</span>
                    )}
                  </td>

                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                  </td>

                  <td style={{ padding: "13px 16px", textAlign: "right" }}>
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: "#059669" }}>
                      {Number(cmd.total).toLocaleString("fr-DZ")} <span style={{ fontSize: 10, fontWeight: 400, color: "#94a3b8" }}>DA</span>
                    </span>
                  </td>

                  <td style={{ padding: "13px 16px", fontSize: 11.5, color: "#94a3b8" }}>
                    {cmd.created_at ? new Date(cmd.created_at).toLocaleDateString("fr-FR") : "—"}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {nextActions.map((action, i) => (
                        <button key={i}
                          onClick={() => changerStatut(cmd.id, action.statut)}
                          className="action-btn"
                          style={{ background: action.color + "18", color: action.color, border: `1px solid ${action.color}40` }}>
                          {action.label}
                        </button>
                      ))}
                      <button onClick={() => handleDelete(cmd.id)} className="btn-danger">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#94a3b8" }}>
            {filtered.length} commande{filtered.length > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}